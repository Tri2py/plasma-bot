const { Events, ActivityType } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Set bot activity
        client.user.setActivity(config.activity.name, { type: ActivityType[Object.keys(ActivityType)[config.activity.type]] });
    },
};
