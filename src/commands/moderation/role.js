const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Add or remove a role from a user')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for adding the role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for removing the role')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can manage roles
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: 'I don\'t have permission to manage roles!',
                ephemeral: true
            });
        }

        // Check if the role is manageable by the bot
        if (!role.editable) {
            return interaction.reply({
                content: 'I cannot manage this role! It may be higher than my highest role.',
                ephemeral: true
            });
        }

        // Check if the user is trying to manage a role higher than their highest role
        if (interaction.member.roles.highest.position <= role.position &&
            interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'You cannot manage this role as it is higher than or equal to your highest role.',
                ephemeral: true
            });
        }

        // Get the target member
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if the member exists
        if (!targetMember) {
            return interaction.reply({
                content: 'This user is not in the server!',
                ephemeral: true
            });
        }

        try {
            if (subcommand === 'add') {
                // Check if the user already has the role
                if (targetMember.roles.cache.has(role.id)) {
                    return interaction.reply({
                        content: `${targetUser.tag} already has the ${role.name} role!`,
                        ephemeral: true
                    });
                }

                // Add the role
                await targetMember.roles.add(role, `${reason} | Role added by ${interaction.user.tag}`);

                // Create role add message
                const roleAddMessage = `**Role Added**\n\n` +
                    `The role **${role.name}** has been added to **${targetUser.tag}**.\n\n` +
                    `**Reason:** ${reason}\n` +
                    `**Added by:** ${interaction.user.tag}`;

                // Send confirmation
                await interaction.reply({ content: roleAddMessage });

                // Try to DM the user
                try {
                    const dmMessage = `**Role Added in ${interaction.guild.name}**\n\n` +
                        `You have been given the role **${role.name}**.\n` +
                        `**Reason**: ${reason}`;

                    await targetUser.send({ content: dmMessage });
                } catch (error) {
                    // Ignore if we can't DM the user
                    console.log(`Could not DM user ${targetUser.tag}`);
                }
            } else if (subcommand === 'remove') {
                // Check if the user has the role
                if (!targetMember.roles.cache.has(role.id)) {
                    return interaction.reply({
                        content: `${targetUser.tag} doesn't have the ${role.name} role!`,
                        ephemeral: true
                    });
                }

                // Remove the role
                await targetMember.roles.remove(role, `${reason} | Role removed by ${interaction.user.tag}`);

                // Create role remove message
                const roleRemoveMessage = `**Role Removed**\n\n` +
                    `The role **${role.name}** has been removed from **${targetUser.tag}**.\n\n` +
                    `**Reason:** ${reason}\n` +
                    `**Removed by:** ${interaction.user.tag}`;

                // Send confirmation
                await interaction.reply({ content: roleRemoveMessage });

                // Try to DM the user
                try {
                    const dmMessage = `**Role Removed in ${interaction.guild.name}**\n\n` +
                        `The role **${role.name}** has been removed from you.\n` +
                        `**Reason**: ${reason}`;

                    await targetUser.send({ content: dmMessage });
                } catch (error) {
                    // Ignore if we can't DM the user
                    console.log(`Could not DM user ${targetUser.tag}`);
                }
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error managing roles for ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
