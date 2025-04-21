const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display detailed information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        // Get the target user (or the command user if no user is specified)
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Fetch the member object to get role information
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member && targetUser.id !== interaction.user.id) {
            return interaction.editReply({
                content: 'This user is not in the server!',
                ephemeral: true
            });
        }

        // Format account creation date
        const createdAt = new Date(targetUser.createdTimestamp);
        const createdAtFormatted = `<t:${Math.floor(createdAt.getTime() / 1000)}:F> (<t:${Math.floor(createdAt.getTime() / 1000)}:R>)`;

        // Format join date if member is in the server
        let joinedAtFormatted = 'Not in server';
        if (member) {
            const joinedAt = new Date(member.joinedTimestamp);
            joinedAtFormatted = `<t:${Math.floor(joinedAt.getTime() / 1000)}:F> (<t:${Math.floor(joinedAt.getTime() / 1000)}:R>)`;
        }

        // Get user badges
        const flags = targetUser.flags ? targetUser.flags.toArray() : [];
        const badges = flags.length ? flags.map(flag => {
            switch (flag) {
                case 'Staff': return '👨‍💼 Discord Staff';
                case 'Partner': return '👑 Discord Partner';
                case 'BugHunterLevel1': return '🐛 Bug Hunter (Level 1)';
                case 'BugHunterLevel2': return '🐛 Bug Hunter (Level 2)';
                case 'HypeSquadEvents': return '🏠 HypeSquad Events';
                case 'HouseBravery': return '🏠 House of Bravery';
                case 'HouseBrilliance': return '🏠 House of Brilliance';
                case 'HouseBalance': return '🏠 House of Balance';
                case 'EarlySupporter': return '👶 Early Supporter';
                case 'VerifiedBot': return '✅ Verified Bot';
                case 'VerifiedDeveloper': return '👨‍💻 Verified Bot Developer';
                case 'CertifiedModerator': return '👮 Discord Certified Moderator';
                default: return flag;
            }
        }).join('\\n') : 'None';

        // Get user roles if they are in the server
        let roles = 'Not in server';
        if (member && member.roles.cache.size > 1) { // > 1 to exclude @everyone
            roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id) // Filter out @everyone
                .sort((a, b) => b.position - a.position) // Sort by position
                .map(role => `<@&${role.id}>`)
                .join(', ');

            // Truncate if too long
            if (roles.length > 1024) {
                roles = roles.substring(0, 1021) + '...';
            }
        } else if (member) {
            roles = 'None';
        }

        // Get user status and activity
        let status = 'Not in server';
        let activity = 'None';

        if (member) {
            // Status
            status = member.presence ? member.presence.status : 'offline';
            status = {
                'online': '🟢 Online',
                'idle': '🟡 Idle',
                'dnd': '🔴 Do Not Disturb',
                'offline': '⚫ Offline'
            }[status] || '⚫ Offline';

            // Activity
            if (member.presence && member.presence.activities.length > 0) {
                const presenceActivity = member.presence.activities[0];
                const activityType = {
                    'PLAYING': 'Playing',
                    'STREAMING': 'Streaming',
                    'LISTENING': 'Listening to',
                    'WATCHING': 'Watching',
                    'CUSTOM': '',
                    'COMPETING': 'Competing in'
                }[presenceActivity.type] || 'Playing';

                activity = presenceActivity.type === 'CUSTOM'
                    ? presenceActivity.state || 'Custom Status'
                    : `${activityType} ${presenceActivity.name}`;
            }
        }

        // Fetch user's invites if bot has permission
        let inviteCount = 'No permission to view';

        if (interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
            try {
                const guildInvites = await interaction.guild.invites.fetch();
                const userInvites = guildInvites.filter(invite => invite.inviter && invite.inviter.id === targetUser.id);

                let totalUses = 0;
                userInvites.forEach(invite => {
                    totalUses += invite.uses;
                });

                inviteCount = `${totalUses} (${userInvites.size} active links)`;
            } catch (error) {
                console.error('Error fetching invites:', error);
                inviteCount = 'Error fetching invites';
            }
        }

        // Check if user is boosting the server
        let boostStatus = 'Not boosting';
        if (member && member.premiumSince) {
            const boostDate = new Date(member.premiumSince);
            boostStatus = `Boosting since <t:${Math.floor(boostDate.getTime() / 1000)}:F> (<t:${Math.floor(boostDate.getTime() / 1000)}:R>)`;
        }

        // Check permissions if user is in the server
        let keyPermissions = 'Not in server';
        if (member) {
            const permissionsArray = [];

            if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                permissionsArray.push('Administrator');
            } else {
                if (member.permissions.has(PermissionFlagsBits.ManageGuild)) permissionsArray.push('Manage Server');
                if (member.permissions.has(PermissionFlagsBits.BanMembers)) permissionsArray.push('Ban Members');
                if (member.permissions.has(PermissionFlagsBits.KickMembers)) permissionsArray.push('Kick Members');
                if (member.permissions.has(PermissionFlagsBits.ManageChannels)) permissionsArray.push('Manage Channels');
                if (member.permissions.has(PermissionFlagsBits.ManageRoles)) permissionsArray.push('Manage Roles');
                if (member.permissions.has(PermissionFlagsBits.MuteMembers)) permissionsArray.push('Mute Members');
                if (member.permissions.has(PermissionFlagsBits.DeafenMembers)) permissionsArray.push('Deafen Members');
                if (member.permissions.has(PermissionFlagsBits.MoveMembers)) permissionsArray.push('Move Members');
                if (member.permissions.has(PermissionFlagsBits.ManageMessages)) permissionsArray.push('Manage Messages');
                if (member.permissions.has(PermissionFlagsBits.MentionEveryone)) permissionsArray.push('Mention Everyone');
            }

            keyPermissions = permissionsArray.length > 0 ? permissionsArray.join(', ') : 'No key permissions';

            // Truncate if too long
            if (keyPermissions.length > 1024) {
                keyPermissions = keyPermissions.substring(0, 1021) + '...';
            }
        }

        // Create user info message
        let userInfoMessage = `**User Information - ${targetUser.tag}**\n\n` +
            `**User ID:** ${targetUser.id}\n` +
            `**Account Created:** ${createdAtFormatted}\n` +
            `**Joined Server:** ${joinedAtFormatted}\n\n` +
            `**Badges:** ${badges}\n`;

        // Add member-specific fields if user is in the server
        if (member) {
            userInfoMessage += `\n**Nickname:** ${member.nickname || 'None'}\n` +
                `**Status:** ${status}\n` +
                `**Activity:** ${activity}\n` +
                `**Boost Status:** ${boostStatus}\n` +
                `**Invites:** ${inviteCount}\n\n` +
                `**Key Permissions:** ${keyPermissions}\n\n` +
                `**Roles:** ${roles}`;
        }

        // Send the message
        await interaction.editReply({ content: userInfoMessage });
    },
};
