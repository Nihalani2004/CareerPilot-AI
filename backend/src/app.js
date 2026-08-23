const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const { getAllowedOrigins } = require("./config/security");
const { verifyTrustedOrigin } = require("./middlewares/csrf.middleware");

const app = express();
const allowedOrigins = getAllowedOrigins();

if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Request origin is not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
}))
app.use(verifyTrustedOrigin);


/* require all the routes here  */
const authRouter = require('./routes/auth.routes');
const interviewRouter = require("./routes/interview.routes")

/* use all the routes here */
app.use('/api/auth', authRouter); 
app.use("/api/interview", interviewRouter)

app.use((error, req, res, next) => {
    if (error.message === "Request origin is not allowed by CORS.") {
        return res.status(403).json({ message: error.message });
    }

    if (error.type === "entity.too.large" || error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Request payload is too large." });
    }

    console.error("Unhandled application error:", error);
    return res.status(error.status || 500).json({ message: "Internal Server Error" });
});


module.exports = app;
