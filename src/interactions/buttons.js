import { MessageFlags } from 'discord.js';
import { QueueRepeatMode } from 'discord-player';
import { LOOP_LABELS } from '../constants.js';
import { guildThemes } from '../state.js';
import { nowPlayingPayload } from '../utils/embeds.js';
import {
  canManagePlayer,
  getQueue,
  isSameVoiceChannel,
} from '../utils/guards.js';
import { castSkipVote } from '../utils/vote-skip.js';

const LOOP_SEQUENCE = [
  QueueRepeatMode.OFF,
  QueueRepeatMode.TRACK,
  QueueRepeatMode.QUEUE,
  QueueRepeatMode.AUTOPLAY,
];

async function notify(interaction, content) {
  return interaction.followUp({ content, flags: MessageFlags.Ephemeral });
}

export async function handlePlayerButton(interaction) {
  if (!interaction.customId.startsWith('music:')) return false;

  const queue = getQueue(interaction);
  if (!queue?.currentTrack) {
    await interaction.reply({
      content: 'Sesi musik ini sudah selesai.',
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }
  if (!isSameVoiceChannel(interaction, queue)) {
    await interaction.reply({
      content: 'Masuk ke voice channel yang sama dengan Lunara untuk memakai kontrol.',
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  await interaction.deferUpdate();
  const action = interaction.customId.slice('music:'.length);

  if (action === 'previous') {
    if (queue.history.isEmpty()) {
      await notify(interaction, 'Riwayat lagu masih kosong.');
    } else {
      await queue.history.previous();
      await notify(interaction, '⏮️ Kembali ke lagu sebelumnya.');
    }
  }

  if (action === 'pause') {
    const paused = !queue.node.isPaused();
    queue.node.setPaused(paused);
    await interaction.message.edit(nowPlayingPayload(queue));
    await notify(interaction, paused ? '⏸️ Musik dijeda.' : '▶️ Musik dilanjutkan.');
  }

  if (action === 'skip') {
    const result = castSkipVote(queue, interaction.user);
    if (result.status === 'skipped') {
      await notify(interaction, result.forced
        ? '⏭️ Lagu dilewati oleh pemintanya.'
        : `⏭️ Vote terpenuhi (${result.votes}/${result.required}).`);
    } else if (result.status === 'duplicate') {
      await notify(interaction, `Kamu sudah vote (${result.votes}/${result.required}).`);
    } else {
      await notify(interaction, `🗳️ Vote tercatat (${result.votes}/${result.required}).`);
    }
  }

  if (action === 'loop') {
    const currentIndex = LOOP_SEQUENCE.indexOf(queue.repeatMode);
    const next = LOOP_SEQUENCE[(currentIndex + 1) % LOOP_SEQUENCE.length];
    queue.setRepeatMode(next);
    await interaction.message.edit(nowPlayingPayload(queue));
    await notify(interaction, `🔁 Mode pemutaran: **${LOOP_LABELS[next]}**.`);
  }

  if (action === 'stop') {
    if (!canManagePlayer(interaction, queue)) {
      await notify(interaction, 'Hanya peminta, role DJ, atau moderator yang bisa menghentikan sesi.');
    } else {
      queue.delete();
      guildThemes.delete(interaction.guildId);
      await interaction.message.edit({ components: [] });
      await notify(interaction, '⏹️ Sesi musik dihentikan.');
    }
  }

  return true;
}
