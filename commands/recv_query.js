import { SlashCommandBuilder } from "discord.js";
import db from "../db.js";

export default {
  name: "list-receiver",
  data: new SlashCommandBuilder()
    .setName("list-receiver")
    .setDescription("Get a list of registered receiver"),
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

      // Format the broadcast data into a readable list
      const formattedData = receiver
        .map(
          (broadcast, index) =>
            `**${index + 1}.** Server: \`${broadcast.guild_id}\`, Channel: <#${
              broadcast.channel_id
            }>`
        )
        .join("\n");

      await interaction.reply({
        content: `**Registered Servers & Channels:**\n${formattedData}`,
        // ephemeral: true, // Optional: Only visible to the command user
      });
    } catch (error) {
      console.log("db error: " + error);
      await interaction.reply("An error occurred while reading data.");
    }
  },
};
