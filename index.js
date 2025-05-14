const { Client, GatewayIntentBits, Partials, ActivityType, EmbedBuilder } = require("discord.js");
const { Player } = require("discord-player");
const playdl = require("play-dl");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const player = new Player(client);
client.player = player;

const prefix = "?";
const supportLink = "https://discord.gg/gr7dMFpkUr"; // Replace with your link
const inviteLink = "https://discord.com/oauth2/authorize?client_id=1339965838622462034&permissions=8&scope=bot"; // Replace with bot invite

// Status rotation
const statuses = [
  { name: "/play or ?play", type: ActivityType.Playing },
  { name: "users jamming", type: ActivityType.Watching },
  { name: "Join our support server", type: ActivityType.Watching }
];

client.once("ready", () => {
  console.log(`${client.user.username} is online!`);

  let i = 0;
  setInterval(() => {
    client.user.setActivity(statuses[i].name, { type: statuses[i].type });
    i = (i + 1) % statuses.length;
  }, 10000);
});

// Command handling
client.on("messageCreate", async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "play") {
    const query = args.join(" ");
    if (!query) return message.reply("Please enter a song name or URL!");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("Join a voice channel first!");

    const searchResult = await player.search(query, {
      requestedBy: message.author
    });

    if (!searchResult.tracks.length) return message.reply("No songs found.");

    const queue = await player.nodes.create(message.guild, {
      metadata: {
        channel: message.channel
      }
    });

    try {
      if (!queue.connection) await queue.connect(voiceChannel);
    } catch {
      player.nodes.delete(message.guild.id);
      return message.reply("Could not join your voice channel!");
    }

    queue.addTrack(searchResult.tracks[0]);
    if (!queue.isPlaying()) await queue.play();

    const embed = new EmbedBuilder()
      .setTitle("Now Playing")
      .setDescription(`[${searchResult.tracks[0].title}](${searchResult.tracks[0].url})`)
      .setThumbnail(searchResult.tracks[0].thumbnail)
      .setColor("Random");

    message.channel.send({ embeds: [embed] });
  }

  if (cmd === "skip") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.isPlaying()) return message.reply("No music is playing.");

    queue.node.skip();
    message.reply("Skipped the current song!");
  }

  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("Music Bot Help")
      .setDescription("**Commands:**\n`?play [song]`\n`?skip`\n`?invite`\n`?support`")
      .setColor("Blue");
    message.channel.send({ embeds: [embed] });
  }

  if (cmd === "invite") {
    message.channel.send(`**Invite the bot:** ${inviteLink}`);
  }

  if (cmd === "support") {
    message.channel.send(`**Join Support Server:** ${supportLink}`);
  }
});

// Slash commands auto register (optional, needs proper setup)
// player.events.on('playerStart', (queue, track) => { ... })

client.login(process.env.TOKEN); // Use GitHub secrets or replace with your token
