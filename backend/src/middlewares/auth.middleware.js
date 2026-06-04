const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');

async function authUser(req,res,next){
    const token = req.cookies.token;
    const isGetMe = req.path === '/get-me' || req.originalUrl?.includes('/get-me');

    if(!token){
        return res.status(isGetMe ? 200 : 401).json({
            message : "token not provided",
            user: null
        })
    }
    const isTokenBlacklisted = await tokenBlacklistModel.findOne({token});
    if(isTokenBlacklisted){
        return res.status(isGetMe ? 200 : 401).json({
            message : "token is invalid",
            user: null
        })
    }


    try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded;
    next();
    }catch(err){
        return res.status(isGetMe ? 200 : 401).json({
            message : "Invalid token",
            user: null
        })
    }
}

module.exports = {authUser};