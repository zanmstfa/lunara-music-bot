import {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { QueueRepeatMode } from 'discord-player';
import { COLORS, FILTERS, LOOP_LABELS, MOODS } from '../constants.js';
import { findLyrics } from '../services/lyrics.js';
import { playQuery, startMoodRadio } from '../services/music.js';
import { guildThemes } from '../state.js';
import { nowPlayingPayload, queuePayload } from '../utils/embeds.js';
import {
  canManagePlayer,
  getQueue,
  getVoiceChannel,
  isSameVoiceChannel,
  replyPrivate,
  requireActiveQueue,
} from '../utils/guards.js';
import { formatTime, parseTime, truncate } from '../utils/time.js';
import { castSkipVote } from '../utils/vote-skip.js';

const LOOP_MODES = Object.freeze({
  off: QueueRepeatMode.OFF,
  track: QueueRepeatMode.TRACK,
  queue: QueueRepeatMode.QUEUE,
  autoplay: QueueRepeatMode.AUTOPLAY,
});

async function handlePlay(interaction, player) {
  const voiceChannel = getVoiceChannel(interaction);
  if (!voiceChannel) return replyPrivate(interaction, 'Masuk ke voice channel terlebih dahulu.');

  const existingQueue = getQueue(interaction);
  if (existingQueue?.channel && !isSameVoiceChannel(interaction, existingQueue)) {
    return replyPrivate(interaction, `Lunara sedang dipakai di <#${existingQueue.channel.id}>.`);
  }

  const query = interaction.options.getString('query', true);
  const source = interaction.options.getString('sumber') ?? 'auto';
  await interaction.deferReply();

  const result = await playQuery(player, interaction, voiceChannel, query, source);
  result.queue.setMetadata({ textChannelId: interaction.channelId });
  const playlistSize = result.searchResult.playlist?.tracks?.length ?? 0;
  const detail = playlistSize > 1
    ? `Playlist **${truncate(result.searchResult.playlist.title, 80)}** — ${playlistSize} lagu`
    : `**${truncate(result.track.title, 100)}**`;

  return interaction.editReply(`🎶 ${detail} ditambahkan ke antrean.`);
}

async function handleMood(interaction, player) {
  const voiceChannel = getVoiceChannel(interaction);
  if (!voiceChannel) return replyPrivate(interaction, 'Masuk ke voice channel terlebih dahulu.');

  const existingQueue = getQueue(interaction);
  if (existingQueue?.channel && !isSameVoiceChannel(interaction, existingQueue)) {
    return replyPrivate(interaction, `Lunara sedang dipakai di <#${existingQueue.channel.id}>.`);
  }

  const moodKey = interaction.options.getString('pilihan', true);
  const mood = MOODS[moodKey];
  await interaction.deferReply();

  const result = await startMoodRadio(player, interaction, voiceChannel, mood);
  guildThemes.set(interaction.guildId, mood);
  const preset = FILTERS[mood.filter];
  await result.queue.filters.ffmpeg.setFilters(preset.filters);

  return interaction.editReply(
    `${mood.emoji} **Mood Radio ${mood.label}** aktif. Autoplay akan menjaga musik tetap mengalir.`,
  );
}

async function handlePause(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const paused = !queue.node.isPaused();
  queue.node.setPaused(paused);
  return replyPrivate(interaction, paused ? '⏸️ Musik dijeda.' : '▶️ Musik dilanjutkan.');
}

async function handleSkip(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const result = castSkipVote(queue, interaction.user);

  if (result.status === 'skipped') {
    return replyPrivate(interaction, result.forced
      ? '⏭️ Lagu dilewati oleh pemintanya.'
      : `⏭️ Vote terpenuhi (${result.votes}/${result.required}). Lagu dilewati.`);
  }
  if (result.status === 'duplicate') {
    return replyPrivate(interaction, `Kamu sudah vote. Saat ini ${result.votes}/${result.required}.`);
  }
  return replyPrivate(interaction, `🗳️ Vote tercatat: ${result.votes}/${result.required}.`);
}

async function handlePrevious(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  if (queue.history.isEmpty()) return replyPrivate(interaction, 'Riwayat lagu masih kosong.');
  await queue.history.previous();
  return replyPrivate(interaction, '⏮️ Kembali ke lagu sebelumnya.');
}

async function handleStop(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  if (!canManagePlayer(interaction, queue)) {
    return replyPrivate(interaction, 'Hanya peminta lagu, role DJ, atau moderator yang bisa menghentikan sesi.');
  }
  queue.delete();
  guildThemes.delete(interaction.guildId);
  return replyPrivate(interaction, '⏹️ Musik dihentikan dan antrean dikosongkan.');
}

async function handleQueue(interaction) {
  const queue = await requireActiveQueue(interaction, { sameChannel: false });
  if (!queue) return;
  const page = interaction.options.getInteger('halaman') ?? 1;
  return interaction.reply(queuePayload(queue, page));
}

async function handleNowPlaying(interaction) {
  const queue = await requireActiveQueue(interaction, { sameChannel: false });
  if (!queue) return;
  return interaction.reply(nowPlayingPayload(queue));
}

async function handleVolume(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const volume = interaction.options.getInteger('persen', true);
  queue.node.setVolume(volume);
  return replyPrivate(interaction, `🔊 Volume diatur ke **${volume}%**.`);
}

async function handleLoop(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const mode = LOOP_MODES[interaction.options.getString('mode', true)];
  queue.setRepeatMode(mode);
  return replyPrivate(interaction, `🔁 Mode pemutaran: **${LOOP_LABELS[mode]}**.`);
}

async function handleShuffle(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  if (queue.tracks.size < 2) return replyPrivate(interaction, 'Perlu minimal dua lagu dalam antrean.');
  queue.tracks.shuffle();
  return replyPrivate(interaction, `🔀 ${queue.tracks.size} lagu berhasil diacak.`);
}

async function handleSeek(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const target = parseTime(interaction.options.getString('waktu', true));
  if (target === null) {
    return replyPrivate(interaction, 'Format waktu tidak valid. Gunakan `90`, `1:30`, atau `01:02:30`.');
  }
  if (!queue.currentTrack.seekable) return replyPrivate(interaction, 'Lagu ini tidak mendukung seek.');
  if (target >= queue.currentTrack.durationMS) {
    return replyPrivate(interaction, `Posisi harus di bawah ${queue.currentTrack.duration}.`);
  }
  await queue.node.seek(target);
  return replyPrivate(interaction, `⏩ Dipindahkan ke **${formatTime(target)}**.`);
}

async function handleFilter(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const preset = FILTERS[interaction.options.getString('preset', true)];
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await queue.filters.ffmpeg.setFilters(preset.filters);
  return interaction.editReply(`🎛️ Preset audio **${preset.label}** aktif.`);
}

async function handleLyrics(interaction, player) {
  const queue = await requireActiveQueue(interaction, { sameChannel: false });
  if (!queue) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const lyrics = await findLyrics(player, queue.currentTrack);
  if (!lyrics) return interaction.editReply('Lirik untuk lagu ini belum ditemukan.');
  if (lyrics.instrumental) return interaction.editReply('Lagu ini ditandai sebagai instrumental.');

  const text = lyrics.plainLyrics?.trim();
  if (!text) return interaction.editReply('Lirik ditemukan, tetapi isinya kosong.');

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`Lirik • ${truncate(lyrics.trackName, 220)}`)
    .setDescription(truncate(text, 3_900))
    .setFooter({ text: `${lyrics.artistName} • Lirik dari LRCLIB` });

  const payload = { embeds: [embed] };
  if (text.length > 3_900) {
    payload.files = [
      new AttachmentBuilder(Buffer.from(text, 'utf8'), {
        name: `lirik-${lyrics.id}.txt`,
        description: `Lirik lengkap ${lyrics.trackName}`,
      }),
    ];
  }
  return interaction.editReply(payload);
}

async function handleRemove(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const position = interaction.options.getInteger('posisi', true);
  const track = queue.tracks.at(position - 1);
  if (!track) return replyPrivate(interaction, 'Posisi tersebut tidak ada dalam antrean.');

  const ownsTrack = track.requestedBy?.id === interaction.user.id;
  if (!ownsTrack && !canManagePlayer(interaction, queue)) {
    return replyPrivate(interaction, 'Kamu hanya bisa menghapus lagu milikmu sendiri.');
  }
  queue.removeTrack(track);
  return replyPrivate(interaction, `🗑️ **${truncate(track.title, 100)}** dihapus dari antrean.`);
}

async function handleMove(interaction) {
  const queue = await requireActiveQueue(interaction);
  if (!queue) return;
  const from = interaction.options.getInteger('dari', true);
  const to = interaction.options.getInteger('ke', true);
  const track = queue.tracks.at(from - 1);
  if (!track || to > queue.tracks.size) {
    return replyPrivate(interaction, `Posisi harus berada di antara 1 dan ${queue.tracks.size}.`);
  }
  const ownsTrack = track.requestedBy?.id === interaction.user.id;
  if (!ownsTrack && !canManagePlayer(interaction, queue)) {
    return replyPrivate(interaction, 'Kamu hanya bisa memindahkan lagu milikmu sendiri.');
  }
  queue.node.move(track, to - 1);
  return replyPrivate(interaction, `↕️ **${truncate(track.title, 100)}** dipindahkan ke posisi ${to}.`);
}

async function handleHelp(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle('Lunara Music')
    .setDescription('Bot musik kolaboratif dengan kontrol tombol, vote skip, dan Mood Radio.')
    .addFields(
      {
        name: 'Mulai mendengarkan',
        value: '`/play` lagu atau URL • `/mood` radio tanpa habis • `/nowplaying`',
      },
      {
        name: 'Kontrol',
        value: '`/pause` • `/skip` • `/previous` • `/seek` • `/volume` • `/stop`',
      },
      {
        name: 'Antrean',
        value: '`/queue` • `/shuffle` • `/remove` • `/move` • `/loop`',
      },
      {
        name: 'Ekstra',
        value: '`/filter` untuk efek audio • `/lyrics` untuk lirik',
      },
      {
        name: 'Aturan sesi',
        value: 'Skip memakai voting 50% pendengar. Peminta lagu dapat skip langsung. Stop dibatasi untuk peminta, role **DJ**, atau moderator.',
      },
    )
    .setFooter({ text: 'Tip: buat role bernama DJ untuk pengelola musik.' });

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

export const handlers = new Map([
  ['play', handlePlay],
  ['mood', handleMood],
  ['pause', handlePause],
  ['skip', handleSkip],
  ['previous', handlePrevious],
  ['stop', handleStop],
  ['queue', handleQueue],
  ['nowplaying', handleNowPlaying],
  ['volume', handleVolume],
  ['loop', handleLoop],
  ['shuffle', handleShuffle],
  ['seek', handleSeek],
  ['filter', handleFilter],
  ['lyrics', handleLyrics],
  ['remove', handleRemove],
  ['move', handleMove],
  ['help', handleHelp],
]);
