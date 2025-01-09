import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import db from "../db.js";

export default {
  name: "register-sender",
  data: new SlashCommandBuilder()
    .setName("register-sender")
    .setDescription("Register a new sender channel"),
  async execute(interaction) {
    const guild_id = interaction.guild.id;
    // get all text channels in the server
    const textChannels = interaction.guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildText) // filter to only text channels
      .map((channel) => ({
        label: `#${channel.name}`,
        value: channel.id,
      }));

    if (textChannels.length === 0) {
      await interaction.reply("No text channels available in this server.");
      return;
    }

    const channelSelectMenu = new StringSelectMenuBuilder()
      .setCustomId("select-text-channel")
      .setPlaceholder("Choose a text channel")
      .addOptions(textChannels); // dynamically add text channel options

    const actionRow = new ActionRowBuilder().addComponents(channelSelectMenu);

    await interaction.reply({
      content: "Please select a text channel to register:",
      components: [actionRow],
    });

    const filter = (i) =>
      i.customId === "select-text-channel" && i.user.id === interaction.user.id;

    try {
      const selectInteraction = await interaction.channel.awaitMessageComponent(
        {
          filter,
          time: 15_000, // 15 seconds selection timeout
        }
      );

      const channel_id = selectInteraction.values[0];
      const selectedChannel = interaction.guild.channels.cache.get(channel_id);

      // db query ops
      try {
        const bc = await db.sender.create({
          data: {
            guild_id: guild_id,
            channel_id: channel_id,
          },
        });
        console.log(bc);
      } catch (error) {
        console.log("db error: " + error);
        await interaction.editReply({
          content: "Unable to registers",
          components: [],
        });
        return;
      }

      await selectInteraction.update({
        content: `You selected ${selectedChannel}. Channel registered successfully!`,
        components: [],
      });
    } catch (error) {
      await interaction.editReply({
        content: "You did not select a channel in time!",
        components: [],
      });
    }
  },
};
