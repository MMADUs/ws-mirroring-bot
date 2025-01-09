import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import db from "../db.js";

export default {
  name: "deregister-receiver",
  data: new SlashCommandBuilder()
    .setName("deregister-receiver")
    .setDescription("Remove a receiver channel from list"),
  async execute(interaction) {
    try {
      const guild_id = interaction.guild.id;

      const receiver = await db.receiver.findMany({
        where: {
          guild_id: guild_id,
        }
      });

      if (receiver.length === 0) {
        await interaction.reply("None of receiver is registered");
        return;
      }

      const channelSelectOptions = receiver.map((receiver) => ({
        label: `#${receiver.guild_id} - #${receiver.channel_id}`,
        value: receiver.id.toString(),
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

      const selectedReceiver = receiver.find(
        (recv) => recv.id.toString() === selectInteraction.values[0]
      );

      // db query ops
      try {
        await db.receiver.delete({
          where: {
            id: selectedReceiver.id,
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
        content: `Successfully deregistered #${selectedReceiver.guild_id} - #${selectedReceiver.channel_id}.`,
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
