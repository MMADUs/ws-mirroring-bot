import { SlashCommandBuilder } from "discord.js";
import db from "../db.js";

export default {
  name: "list-sender",
  data: new SlashCommandBuilder()
    .setName("list-sender")
    .setDescription("Get a list of registered senders"),
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

      // Format the sender data into a readable list
      const formattedData = sender
        .map(
          (sender, index) =>
            `**${index + 1}.** Server: \`${sender.guild_id}\`, Channel: <#${
              sender.channel_id
            }>`
        )
        .join("\n");

      await interaction.reply({
        content: `**Registered Senders:**\n${formattedData}`,
        // ephemeral: true, // Optional: Only visible to the command user
      });
    } catch (error) {
      console.log("db error: " + error);
      await interaction.reply("An error occurred while reading data.");
    }
  },
};
