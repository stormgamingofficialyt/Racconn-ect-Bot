const Discord = require('discord.js');
const dotenv = require('dotenv');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const { Player } = require('discord-player');
const { GatewayIntentBits } = require('discord.js');

dotenv.config();
const TOKEN = process.env.TOKEN;

const LOAD_SLASH = process.argv[2] == "load";

const CLIENT_ID = "1053721800028196905";
const GUILD_ID = "1054049393118040104";

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.slashcommands = new Discord.Collection();
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
});

let commands = []

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"));
for (const file of slashFiles) {
    const slashcmd = require(`./slash/${file}`);
    client.slashcommands.set(slashcmd.data.name, slashcmd);
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN);
    console.log("Deploying slash commands");
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
        .then(() => {
            console.log("Successfully loaded");
            process.exit(0);
        })
        .catch((err) => {
            if (err) console.log(err);
            process.exit(1);
        });
}
else {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`);
    })
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return;

            const slashcmd = client.slashcommands.get(interaction.commandName);
            if (!slashcmd) interaction.reply("Not a valid slash command");

            await interaction.deferReply();
            await slashcmd.run({ client, interaction });
        }
        handleCommand();
    })
    client.on("messageCreate", (message) => {
        if (message.content == "Is my raccoon listening?") {
            message.reply("Listening.");
        }

    })
    client.login(TOKEN);
}

// client.once('ready', () => Discord.Message('Bot is online!'));


// client.on('error', console.error);
// client.on('warn', console.warn);

// client.login('DISCORD_TOKEN');