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
        required : true ,
    }
})

const userModel = mongoose.model("User", userSchema);
module.exports = userModel; 