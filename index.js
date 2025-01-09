import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  Collection,
  TextChannel,
} from "discord.js";
import fs from "fs";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

// bot client perms
const client = new Client({
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
  ],
});

const commands = [];
client.command = new Collection();

const dataGet = fs
  .readdirSync(`./commands`)
  .filter((files) => files.endsWith(".js"));

for (const file of dataGet) {
  const { default: command } = await import(`./commands/${file}`);
  console.log(command);
  commands.push(command.data);
  client.command.set(command.name, command);
}
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// init slash command list
const slashCommandList = async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.ID), {
      body: commands,
    });
  } catch (error) {
    console.log(error);
  }
};
slashCommandList();

// init bot
client.on("ready", (res) => {
  console.log(`Ready! Logged in as ${res.user.tag}`);
  res.user.setActivity("Broadcasting");
});

// message receival
client.on("messageCreate", async (message) => {
  try {
    // Ignore bot messages
    if (message.author.bot) return;

    const send_guild_id = message.guildId;
    const send_channel_id = message.channelId;

    const sender = await db.sender.findUnique({
      where: {
        guild_id: send_guild_id,
        channel_id: send_channel_id,
      }
    })

    if(!sender) return;

    console.log("Received message:", message.content);

    // Fetch the list of target channels from your database
    const targets = await db.receiver.findMany();

    for (const target of targets) {
      try {
        const recv_guild_id = String(target.guild_id);
        const recv_channel_id = String(target.channel_id);

        const guild = client.guilds.cache.get(recv_guild_id);
        if (!guild) {
          console.log(`Bot is not in guild ${recv_guild_id}`);
          continue;
        }

        const channel = guild.channels.cache.get(recv_channel_id);
        if (!channel || !channel.isTextBased()) {
          console.log(
            `Channel ${recv_channel_id} not found or is not a text channel`
          );
          continue;
        }

        // Check permissions
        const permissions = channel.permissionsFor(guild.members.me);
        if (!permissions.has("SendMessages")) {
          console.log(
            `Missing SendMessages permission in channel ${recv_channel_id}`
          );
          continue;
        }

        let messageContent = message.content;

        // Handle replies
        if (message.reference && message.reference.messageId) {
          try {
            const repliedMessage = await message.channel.messages.fetch(
              message.reference.messageId
            );
            const repliedAuthor = repliedMessage.author.username;
            const repliedContent = repliedMessage.content;

            // Format the reply context
            messageContent = `> **${repliedAuthor}:** ${repliedContent}\n${messageContent}`;
          } catch (error) {
            console.log("Couldn't fetch replied message:", error);
          }
        }

        // Prepare message content
        let messageOptions = {
          content: messageContent,
          allowedMentions: {
            parse: ["roles", "everyone"], 
          },
        };

        // Handle attachments (images)
        if (message.attachments.size > 0) {
          messageOptions.files = Array.from(message.attachments.values()).map(
            (attachment) => ({
              attachment: attachment.url,
              name: attachment.name,
            })
          );
        }

        // Forward the message
        await channel.send(messageOptions);

        console.log(
          `Message forwarded to guild ${recv_guild_id}, channel ${recv_channel_id}`
        );
      } catch (error) {
        console.error(
          `Error forwarding to ${recv_guild_id}:${recv_channel_id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("Error handling message:", error.message);
  }
});

client.on("channelDelete", async (channel) => {
  try {
    // Check if the channel is a text channel
    if (!channel.isTextBased()) return;

    const channelId = channel.id;
    const guildId = channel.guild.id;

    // Log to see if the event is triggered
    console.log(`Channel deleted: ${channelId} in guild: ${guildId}`);

    // Now, remove the channel from your bot's database
    await db.receiver.deleteMany({
      where: {
        guild_id: guildId,
        channel_id: channelId
      }
    });

    console.log(`Channel ${channelId} removed from the database.`);
  } catch (error) {
    console.error("Error handling channel deletion:", error.message);
  }
});

// command event listener
client.on("interactionCreate", async (interaction) => {
  try {
    // console.log(interaction);
    const isCmd = interaction.commandName;
    console.log(isCmd);
    const cmd = client.command.get(isCmd);
    if (cmd) {
      cmd.execute(interaction, client);
      console.log(`Command : ${cmd.name}`);
    }
  } catch (error) {
    console.log(error);
  }
});

client.login(process.env.TOKEN);
