import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from 'discord.js';
import { DefaultExtractors } from '@discord-player/extractor';
import { Player } from 'discord-player';
import { handlers } from './commands/handlers.js';
import { config, validateConfig } from './config.js';
import { handlePlayerButton } from './interactions/buttons.js';
import { registerPlayerEvents } from './player/events.js';

validateConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const player = new Player(client, {
  connectionTimeout: 30_000,
  probeTimeout: 10_000,
  ffmpegPath: process.env.FFMPEG_PATH,
});

await player.extractors.loadMulti(DefaultExtractors);

registerPlayerEvents(player, client);

client.once(Events.ClientReady, (readyClient) => {
  readyClient.user.setPresence({
    activities: [{
      name: '/play • /mood',
      type: ActivityType.Listening,
    }],
    status: 'online',
  });
  console.log(`Lunara aktif sebagai ${readyClient.user.tag}`);
  console.log(`Terhubung ke ${readyClient.guilds.cache.size} server.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      await handlePlayerButton(interaction);
      return;
    }
    if (!interaction.isChatInputCommand()) return;

    const handler = handlers.get(interaction.commandName);
    if (!handler) return;
    await handler(interaction, player);
  } catch (error) {
    console.error(`[interaction:${interaction.id}]`, error);
    const payload = {
      content: 'Terjadi kesalahan saat menjalankan command. Coba lagi sebentar.',
      flags: MessageFlags.Ephemeral,
    };
    if (interaction.deferred) {
      await interaction.editReply({ content: payload.content, embeds: [], components: [] }).catch(() => null);
    } else if (interaction.replied) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
});

client.on(Events.Error, (error) => console.error('[discord]', error));

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} diterima, menutup koneksi...`);
  for (const queue of player.nodes.cache.values()) {
    queue.delete();
  }
  client.destroy();
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

await client.login(config.token);
