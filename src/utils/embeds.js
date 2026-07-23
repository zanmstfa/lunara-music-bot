import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { COLORS, LOOP_LABELS } from '../constants.js';
import { guildThemes } from '../state.js';
import { truncate } from './time.js';

const isWebUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export function progressBar(queue, length = 16) {
  const timestamp = queue.node.getTimestamp();
  if (!timestamp) return '🔴 LIVE';
  const ratio = Math.max(0, Math.min(1, timestamp.progress / 100));
  const marker = Math.min(length - 1, Math.round(ratio * (length - 1)));
  const bar = Array.from({ length }, (_, index) => (index === marker ? '●' : '━')).join('');
  return `\`${timestamp.current.label} ${bar} ${timestamp.total.label}\``;
}

export function playerControls(queue) {
  const paused = queue.node.isPaused();
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music:previous')
      .setEmoji('⏮️')
      .setLabel('Sebelumnya')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music:pause')
      .setEmoji(paused ? '▶️' : '⏸️')
      .setLabel(paused ? 'Lanjut' : 'Jeda')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music:skip')
      .setEmoji('⏭️')
      .setLabel('Lewati')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music:loop')
      .setEmoji('🔁')
      .setLabel(LOOP_LABELS[queue.repeatMode] ?? 'Loop')
      .setStyle(queue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('music:stop')
      .setEmoji('⏹️')
      .setLabel('Stop')
      .setStyle(ButtonStyle.Danger),
  );
}

export function nowPlayingPayload(queue, track = queue.currentTrack) {
  const requester = track?.requestedBy ? `<@${track.requestedBy.id}>` : 'Autoplay';
  const theme = guildThemes.get(queue.guild.id);
  const catalogUrl = track?.metadata?.catalogUrl;
  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setAuthor({ name: 'LUNARA • NOW PLAYING' })
    .setTitle(truncate(track?.title ?? 'Tidak diketahui', 240))
    .setDescription(progressBar(queue))
    .addFields(
      { name: 'Artis', value: truncate(track?.author || 'Tidak diketahui', 100), inline: true },
      { name: 'Diminta oleh', value: requester, inline: true },
      { name: 'Volume', value: `${queue.node.volume}%`, inline: true },
      { name: 'Mode', value: LOOP_LABELS[queue.repeatMode] ?? 'Mati', inline: true },
      { name: 'Mood Radio', value: theme ? `${theme.emoji} ${theme.label}` : 'Nonaktif', inline: true },
      { name: 'Berikutnya', value: queue.tracks.at(0) ? truncate(queue.tracks.at(0).title, 90) : 'Belum ada', inline: true },
    )
    .setFooter({ text: 'Kontrol hanya bisa dipakai dari voice channel yang sama.' })
    .setTimestamp();

  if (isWebUrl(catalogUrl)) embed.setURL(catalogUrl);
  else if (isWebUrl(track?.url)) embed.setURL(track.url);
  if (isWebUrl(track?.thumbnail)) embed.setThumbnail(track.thumbnail);

  return { embeds: [embed], components: [playerControls(queue)] };
}

export function queuePayload(queue, page = 1) {
  const tracks = queue.tracks.toArray();
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  const lines = tracks.slice(start, start + pageSize).map((track, offset) => {
    const requester = track.requestedBy ? `<@${track.requestedBy.id}>` : 'Autoplay';
    return `**${start + offset + 1}.** ${truncate(track.title, 65)} • \`${track.duration}\` • ${requester}`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`Antrean ${queue.guild.name}`)
    .setDescription([
      `**Sedang diputar:** ${truncate(queue.currentTrack?.title ?? 'Tidak ada', 80)}`,
      '',
      lines.length ? lines.join('\n') : '_Antrean berikutnya masih kosong._',
    ].join('\n'))
    .setFooter({
      text: `Halaman ${safePage}/${totalPages} • ${tracks.length} lagu menunggu • Loop ${LOOP_LABELS[queue.repeatMode]}`,
    });

  return { embeds: [embed] };
}

export function simpleEmbed(title, description, color = COLORS.primary) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description);
}
