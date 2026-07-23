import { GuildQueueEvent } from 'discord-player';
import { COLORS } from '../constants.js';
import {
  clearTrackState,
  guildThemes,
  nowPlayingMessages,
} from '../state.js';
import { nowPlayingPayload, simpleEmbed } from '../utils/embeds.js';

async function getTextChannel(client, queue) {
  const channelId = queue.metadata?.textChannelId;
  if (!channelId) return null;
  const channel = client.channels.cache.get(channelId)
    ?? await client.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}

export function registerPlayerEvents(player, client) {
  player.events.on(GuildQueueEvent.PlayerStart, async (queue, track) => {
    clearTrackState(queue.guild.id);
    const channel = await getTextChannel(client, queue);
    if (!channel) return;

    const previous = nowPlayingMessages.get(queue.guild.id);
    if (previous?.editable && previous.channelId === channel.id) {
      const edited = await previous.edit(nowPlayingPayload(queue, track)).catch(() => null);
      if (edited) return;
    }

    const message = await channel.send(nowPlayingPayload(queue, track)).catch(() => null);
    if (message) nowPlayingMessages.set(queue.guild.id, message);
  });

  player.events.on(GuildQueueEvent.PlayerFinish, (queue) => {
    clearTrackState(queue.guild.id);
  });

  player.events.on(GuildQueueEvent.PlayerSkip, (queue) => {
    clearTrackState(queue.guild.id);
  });

  player.events.on(GuildQueueEvent.EmptyQueue, async (queue) => {
    clearTrackState(queue.guild.id);
    guildThemes.delete(queue.guild.id);
    const message = nowPlayingMessages.get(queue.guild.id);
    if (message?.editable) {
      await message.edit({ components: [] }).catch(() => null);
    }
    nowPlayingMessages.delete(queue.guild.id);

    const channel = await getTextChannel(client, queue);
    await channel?.send({
      embeds: [simpleEmbed(
        'Sesi selesai',
        'Antrean sudah habis. Gunakan `/play` atau `/mood` untuk mulai lagi.',
        COLORS.neutral,
      )],
    }).catch(() => null);
  });

  player.events.on(GuildQueueEvent.PlayerError, async (queue, error, track) => {
    console.error(`[player:${queue.guild.id}] ${track?.title ?? 'unknown'}:`, error);
    const channel = await getTextChannel(client, queue);
    await channel?.send({
      embeds: [simpleEmbed(
        'Lagu dilewati',
        `Tidak bisa memutar **${track?.title ?? 'lagu ini'}**. Lunara mencoba lagu berikutnya.`,
        COLORS.danger,
      )],
    }).catch(() => null);
  });

  player.events.on(GuildQueueEvent.Error, (queue, error) => {
    console.error(`[queue:${queue.guild.id}]`, error);
  });
}
