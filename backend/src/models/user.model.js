const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique : [true, "Username already taken"],
        required : true ,
    },
    email:{
        type:String,
        unique : [true, "Account already exists with this email address"],
        required : true ,
    },
    password:{
        type:String,
        required : false,
    },
    oauthProviders: [{
        provider: {
            type: String,
            enum: ["google", "github"],
            required: true,
        },
        providerId: {
            type: String,
            required: true,
        },
        avatarUrl: {
            type: String,
            default: "",
        },
    }],
})

userSchema.index({ "oauthProviders.provider": 1, "oauthProviders.providerId": 1 }, { unique: true, sparse: true });

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
