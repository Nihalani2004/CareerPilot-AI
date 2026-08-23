const mongoose = require('mongoose');
const dns = require('node:dns');

function configureMongoDns() {
    const configuredServers = process.env.MONGODB_DNS_SERVERS;

    if (!configuredServers) {
        return;
    }

    const servers = configuredServers
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

    if (servers.length > 0) {
        dns.setServers(servers);
    }
}

async function connectToDB(){
    configureMongoDns();
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database");
}


module.exports = connectToDB;
