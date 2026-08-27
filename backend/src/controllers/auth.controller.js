const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const tokenBlacklistModel = require('../models/blacklist.model');
const {
    getAuthCookieClearOptions,
    getAuthCookieOptions,
    getOAuthStateCookieClearOptions,
    getOAuthStateCookieOptions,
    getJwtExpiresIn,
} = require('../config/security');
const {
    OAuthError,
    buildAuthorizationUrl,
    buildFrontendRedirect,
    createOAuthState,
    exchangeAuthorizationCode,
    getOAuthStateCookieName,
    verifyOAuthState,
} = require('../services/oauth.service');

function createSessionToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiresIn() }
    );
}

function sanitizeUsername(value) {
    const normalized = String(value || "candidate")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24);
    return normalized || "candidate";
}

async function createAvailableUsername(preferredUsername) {
    const baseUsername = sanitizeUsername(preferredUsername);

    for (let attempt = 0; attempt < 25; attempt += 1) {
        const suffix = attempt === 0 ? "" : `-${crypto.randomBytes(2).toString("hex")}`;
        const username = `${baseUsername.slice(0, 30 - suffix.length)}${suffix}`;
        if (!(await userModel.exists({ username }))) return username;
    }

    return `candidate-${crypto.randomBytes(5).toString("hex")}`;
}

async function findOrCreateOAuthUser(identity) {
    const providerQuery = {
        oauthProviders: {
            $elemMatch: { provider: identity.provider, providerId: identity.providerId },
        },
    };
    const providerUser = await userModel.findOne(providerQuery);
    if (providerUser) return providerUser;

    const emailUser = await userModel.findOne({ email: identity.email });
    if (emailUser) {
        const linkedProviders = emailUser.oauthProviders || [];
        const isAlreadyLinked = linkedProviders.some((item) => (
            item.provider === identity.provider && item.providerId === identity.providerId
        ));

        if (!isAlreadyLinked) {
            linkedProviders.push({
                provider: identity.provider,
                providerId: identity.providerId,
                avatarUrl: identity.avatarUrl,
            });
            emailUser.oauthProviders = linkedProviders;
            await emailUser.save();
        }
        return emailUser;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await userModel.create({
                username: await createAvailableUsername(identity.username),
                email: identity.email,
                oauthProviders: [{
                    provider: identity.provider,
                    providerId: identity.providerId,
                    avatarUrl: identity.avatarUrl,
                }],
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;
            const concurrentUser = await userModel.findOne({
                $or: [providerQuery, { email: identity.email }],
            });
            if (concurrentUser) return concurrentUser;
        }
    }

    throw new Error("Unable to create OAuth user.");
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body 
 * @access Public
 */

async function registerUserController(req,res){
    try {
        const {username, email, password} = req.body;

        if(!username || !email || !password){
            return res.status(400).json({
                message : "Please provide username, email and password"
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or : [{username}, {email} ] 
        })

        if(isUserAlreadyExists){
            return res.status(400).json({
                message : "Account already exists with this username or email address"
            })
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username,
            email,
            password : hash
        })
        const token = createSessionToken(user);
        res.cookie("token", token, getAuthCookieOptions())

        res.status(201).json({
            message : "User registered successfully",
            user:{
                id : user._id,
                username : user.username,
                email : user.email, 
            }
        })
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body 
 * @access Public
 */
async function loginUserController(req,res){
    try {
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message : "Please provide email and password"
            })
        }

        const user = await userModel.findOne({email});

        if(!user || !user.password){
            return res.status(400).json({
                message : "Invalid email or password"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(400).json({
                message : "Invalid email or password"
            })
        }
        const token = createSessionToken(user);
        res.cookie("token", token, getAuthCookieOptions())
        res.status(200).json({
            message : "User logged in successfully",
            user:{
                id : user._id,
                username : user.username,
                email : user.email
            }
        })
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

async function startOAuthController(req, res) {
    try {
        const { provider } = req.params;
        const state = createOAuthState();
        res.cookie(getOAuthStateCookieName(provider), state, getOAuthStateCookieOptions());
        return res.redirect(302, buildAuthorizationUrl(provider, state));
    } catch (error) {
        if (error instanceof OAuthError && error.status === 404) {
            return res.status(404).json({ message: "OAuth provider not found." });
        }
        console.error("OAuth start error:", error.message);
        return res.redirect(302, buildFrontendRedirect("/login", "unavailable"));
    }
}

async function oauthCallbackController(req, res) {
    const { provider } = req.params;
    let stateCookieName;

    try {
        stateCookieName = getOAuthStateCookieName(provider);
        const storedState = req.cookies[stateCookieName];
        res.clearCookie(stateCookieName, getOAuthStateCookieClearOptions());

        if (!verifyOAuthState(storedState, req.query.state)) {
            return res.redirect(302, buildFrontendRedirect("/login", "failed"));
        }

        if (req.query.error || !req.query.code) {
            return res.redirect(302, buildFrontendRedirect("/login", "cancelled"));
        }

        const identity = await exchangeAuthorizationCode(provider, req.query.code);
        const user = await findOrCreateOAuthUser(identity);
        res.cookie("token", createSessionToken(user), getAuthCookieOptions());
        return res.redirect(302, buildFrontendRedirect("/"));
    } catch (error) {
        if (error instanceof OAuthError && error.status === 404) {
            return res.status(404).json({ message: "OAuth provider not found." });
        }
        if (stateCookieName) {
            res.clearCookie(stateCookieName, getOAuthStateCookieClearOptions());
        }
        console.error("OAuth callback error:", error.message);
        return res.redirect(302, buildFrontendRedirect("/login", "failed"));
    }
}

/**
 * @name logoutUserController
 * @description clear token user from user cookie and add the token in blacklist
 * @access Public
 */
async function logoutUserController(req,res){
    try {
        const token = req.cookies.token;

        if(token){
            await tokenBlacklistModel.create({
                token,
                expiresAt: new Date(req.user.exp * 1000),
            });
        }

        res.clearCookie("token", getAuthCookieClearOptions());
        res.status(200).json({
            message : "User logged out successfully"
        })
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access Private
 */
async function getMeController(req,res){
    try {
        const user = await userModel.findById(req.user.id);

        res.status(200).json({
            message : "User details fetched successfully",
            user:{
                id : user._id,
                username : user.username,
                email : user.email
            }
        })
    } catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    startOAuthController,
    oauthCallbackController,
    logoutUserController,
    getMeController
}
