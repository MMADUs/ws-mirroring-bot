import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import db from "../db.js";

export default {
  name: "deregister-sender",
  data: new SlashCommandBuilder()
    .setName("deregister-sender")
    .setDescription("Remove a sender channel from list"),
  async execute(interaction) {
    try {
      const guild_id = interaction.guild.id;

      const sender = await db.sender.findMany({
        where: {
          guild_id: guild_id,
        }
      });

      if (sender.length === 0) {
        await interaction.reply("None of sender is registered");
        return;
      }

      const channelSelectOptions = sender.map((sender) => ({
        label: `#${sender.guild_id} - #${sender.channel_id}`,
        value: sender.id.toString(),
      }));

      const channelSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("select-channel-to-deregister")
        .setPlaceholder("Select a channel to remove")
        .addOptions(channelSelectOptions);

      const actionRow = new ActionRowBuilder().addComponents(channelSelectMenu);

      await interaction.reply({
        content: "Please select a channel to deregister:",
        components: [actionRow],
      });

      const filter = (i) =>
        i.customId === "select-channel-to-deregister" &&
        i.user.id === interaction.user.id;

      const selectInteraction = await interaction.channel.awaitMessageComponent(
        {
          filter,
          time: 15_000, // 15 seconds timeout
        }
      );

      const selectedSender = sender.find(
        (send) => send.id.toString() === selectInteraction.values[0]
      );

      // db query ops
      try {
        await db.sender.delete({
          where: {
            id: selectedSender.id,
          },
        });
      } catch (error) {
        console.log("db error: " + error);
        await interaction.editReply({
          content: "Unable to deregister",
          components: [],
        });
        return;
      }

      await selectInteraction.update({
        content: `Successfully deregistered #${selectedSender.guild_id} - #${selectedSender.channel_id}.`,
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
