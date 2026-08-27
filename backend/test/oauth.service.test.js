const assert = require("node:assert/strict");
const test = require("node:test");
const {
    buildAuthorizationUrl,
    createOAuthState,
    getOAuthStateCookieName,
    verifyOAuthState,
} = require("../src/services/oauth.service");

const ENV_KEYS = [
    "PORT",
    "BACKEND_URL",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GITHUB_OAUTH_CLIENT_ID",
    "GITHUB_OAUTH_CLIENT_SECRET",
];

function withOAuthEnv(callback) {
    const snapshot = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    Object.assign(process.env, {
        PORT: "3000",
        GOOGLE_OAUTH_CLIENT_ID: "google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET: "google-client-secret",
        GITHUB_OAUTH_CLIENT_ID: "github-client-id",
        GITHUB_OAUTH_CLIENT_SECRET: "github-client-secret",
    });

    try {
        return callback();
    } finally {
        for (const key of ENV_KEYS) {
            if (snapshot[key] === undefined) delete process.env[key];
            else process.env[key] = snapshot[key];
        }
    }
}

test("builds provider-specific authorization URLs with an exact callback", () => {
    withOAuthEnv(() => {
        const googleUrl = new URL(buildAuthorizationUrl("google", "state-value"));
        const githubUrl = new URL(buildAuthorizationUrl("github", "state-value"));

        assert.equal(googleUrl.origin, "https://accounts.google.com");
        assert.equal(googleUrl.searchParams.get("redirect_uri"), "http://localhost:3000/api/auth/oauth/google/callback");
        assert.equal(googleUrl.searchParams.get("state"), "state-value");
        assert.equal(githubUrl.origin, "https://github.com");
        assert.equal(githubUrl.searchParams.get("scope"), "read:user user:email");
    });
});

test("uses provider-isolated, high-entropy OAuth states", () => {
    const state = createOAuthState();
    assert.ok(state.length >= 40);
    assert.equal(getOAuthStateCookieName("google"), "oauth_state_google");
    assert.equal(getOAuthStateCookieName("github"), "oauth_state_github");
    assert.equal(verifyOAuthState(state, state), true);
    assert.equal(verifyOAuthState(state, `${state}different`), false);
    assert.equal(verifyOAuthState(state, ""), false);
});
