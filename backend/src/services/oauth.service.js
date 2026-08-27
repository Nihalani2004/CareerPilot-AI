const crypto = require("crypto");
const { getAllowedOrigins } = require("../config/security");

const PROVIDERS = {
    google: {
        clientIdKey: "GOOGLE_OAUTH_CLIENT_ID",
        clientSecretKey: "GOOGLE_OAUTH_CLIENT_SECRET",
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        profileEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
        scope: "openid email profile",
    },
    github: {
        clientIdKey: "GITHUB_OAUTH_CLIENT_ID",
        clientSecretKey: "GITHUB_OAUTH_CLIENT_SECRET",
        authorizationEndpoint: "https://github.com/login/oauth/authorize",
        tokenEndpoint: "https://github.com/login/oauth/access_token",
        profileEndpoint: "https://api.github.com/user",
        scope: "read:user user:email",
    },
};

class OAuthError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "OAuthError";
        this.status = status;
    }
}

function assertProvider(provider) {
    if (!Object.hasOwn(PROVIDERS, provider)) {
        throw new OAuthError("Unsupported OAuth provider.", 404);
    }
}

function getBackendOrigin() {
    const configuredOrigin = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    try {
        return new URL(configuredOrigin).origin;
    } catch {
        throw new OAuthError("BACKEND_URL must be a valid origin.", 500);
    }
}

function getRedirectUri(provider) {
    assertProvider(provider);
    return `${getBackendOrigin()}/api/auth/oauth/${provider}/callback`;
}

function getProviderConfig(provider) {
    assertProvider(provider);
    const definition = PROVIDERS[provider];
    const clientId = process.env[definition.clientIdKey];
    const clientSecret = process.env[definition.clientSecretKey];

    if (!clientId || !clientSecret) {
        throw new OAuthError(`${provider} OAuth is not configured.`, 503);
    }

    return {
        ...definition,
        clientId,
        clientSecret,
        redirectUri: getRedirectUri(provider),
    };
}

function createOAuthState() {
    return crypto.randomBytes(32).toString("base64url");
}

function getOAuthStateCookieName(provider) {
    assertProvider(provider);
    return `oauth_state_${provider}`;
}

function verifyOAuthState(expectedState, receivedState) {
    if (!expectedState || !receivedState) return false;

    const expected = Buffer.from(expectedState);
    const received = Buffer.from(receivedState);
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function buildAuthorizationUrl(provider, state) {
    const config = getProviderConfig(provider);
    const url = new URL(config.authorizationEndpoint);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("state", state);

    if (provider === "google") {
        url.searchParams.set("access_type", "online");
        url.searchParams.set("prompt", "select_account");
    }

    return url.toString();
}

async function getJson(fetchImpl, url, options, message) {
    const response = await fetchImpl(url, options);
    if (!response.ok) {
        throw new OAuthError(message, 401);
    }
    return response.json();
}

async function exchangeAuthorizationCode(provider, code, fetchImpl = fetch) {
    if (!code) {
        throw new OAuthError("Authorization code is missing.");
    }

    const config = getProviderConfig(provider);
    const tokenResponse = await getJson(fetchImpl, config.tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri: config.redirectUri,
            grant_type: "authorization_code",
        }),
    }, "OAuth token exchange failed.");

    if (!tokenResponse.access_token) {
        throw new OAuthError("OAuth token exchange failed.", 401);
    }

    if (provider === "google") {
        const profile = await getJson(fetchImpl, config.profileEndpoint, {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }, "Google profile lookup failed.");

        if (!profile.sub || !profile.email || !(profile.email_verified === true || profile.email_verified === "true")) {
            throw new OAuthError("Google did not provide a verified email address.", 401);
        }

        return {
            provider,
            providerId: String(profile.sub),
            email: profile.email.toLowerCase(),
            username: profile.name || profile.email.split("@")[0],
            avatarUrl: profile.picture || "",
        };
    }

    const profile = await getJson(fetchImpl, config.profileEndpoint, {
        headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "CareerPilot-AI",
        },
    }, "GitHub profile lookup failed.");
    const emails = await getJson(fetchImpl, "https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "CareerPilot-AI",
        },
    }, "GitHub verified-email lookup failed.");
    const verifiedEmail = emails.find((item) => item.primary && item.verified)
        || emails.find((item) => item.verified);

    if (!profile.id || !verifiedEmail?.email) {
        throw new OAuthError("GitHub did not provide a verified email address.", 401);
    }

    return {
        provider,
        providerId: String(profile.id),
        email: verifiedEmail.email.toLowerCase(),
        username: profile.name || profile.login || verifiedEmail.email.split("@")[0],
        avatarUrl: profile.avatar_url || "",
    };
}

function buildFrontendRedirect(pathname = "/", error) {
    const frontendUrl = new URL(getAllowedOrigins()[0]);
    frontendUrl.pathname = pathname;
    frontendUrl.search = "";
    if (error) frontendUrl.searchParams.set("oauthError", error);
    return frontendUrl.toString();
}

module.exports = {
    OAuthError,
    buildAuthorizationUrl,
    buildFrontendRedirect,
    createOAuthState,
    exchangeAuthorizationCode,
    getOAuthStateCookieName,
    verifyOAuthState,
};
