import { SlashCommandBuilder } from 'discord.js';
import { FILTERS, MOODS } from '../constants.js';

const choices = (entries) => entries.map(([value, data]) => ({
  name: data.label,
  value,
}));

export const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu atau tambahkan playlist ke antrean')
    .addStringOption((option) => option
      .setName('query')
      .setDescription('Judul, artis, atau URL lagu/playlist')
      .setRequired(true)
      .setMaxLength(500))
    .addStringOption((option) => option
      .setName('sumber')
      .setDescription('Sumber pencarian')
      .addChoices(
        { name: 'Otomatis', value: 'auto' },
        { name: 'YouTube', value: 'youtube' },
        { name: 'SoundCloud', value: 'soundcloud' },
        { name: 'Spotify', value: 'spotify' },
      )),
  new SlashCommandBuilder()
    .setName('mood')
    .setDescription('Mulai Mood Radio yang terus memutar lagu serupa')
    .addStringOption((option) => option
      .setName('pilihan')
      .setDescription('Suasana sesi musik')
      .setRequired(true)
      .addChoices(...choices(Object.entries(MOODS)))),
  new SlashCommandBuilder().setName('pause').setDescription('Jeda atau lanjutkan musik'),
  new SlashCommandBuilder().setName('skip').setDescription('Vote untuk melewati lagu saat ini'),
  new SlashCommandBuilder().setName('previous').setDescription('Kembali ke lagu sebelumnya'),
  new SlashCommandBuilder().setName('stop').setDescription('Hentikan musik dan kosongkan antrean'),
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Lihat daftar antrean')
    .addIntegerOption((option) => option
      .setName('halaman')
      .setDescription('Nomor halaman')
      .setMinValue(1)),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Lihat lagu yang sedang diputar'),
  new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Atur volume pemutar')
    .addIntegerOption((option) => option
      .setName('persen')
      .setDescription('Volume 1–100')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)),
  new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Atur mode pengulangan atau autoplay')
    .addStringOption((option) => option
      .setName('mode')
      .setDescription('Mode loop')
      .setRequired(true)
      .addChoices(
        { name: 'Mati', value: 'off' },
        { name: 'Ulangi lagu', value: 'track' },
        { name: 'Ulangi antrean', value: 'queue' },
        { name: 'Autoplay lagu serupa', value: 'autoplay' },
      )),
  new SlashCommandBuilder().setName('shuffle').setDescription('Acak lagu yang menunggu'),
  new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Lompat ke posisi tertentu pada lagu')
    .addStringOption((option) => option
      .setName('waktu')
      .setDescription('Contoh: 90, 1:30, atau 01:02:30')
      .setRequired(true)
      .setMaxLength(12)),
  new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Terapkan preset efek audio')
    .addStringOption((option) => option
      .setName('preset')
      .setDescription('Preset audio')
      .setRequired(true)
      .addChoices(...choices(Object.entries(FILTERS)))),
  new SlashCommandBuilder().setName('lyrics').setDescription('Cari lirik lagu yang sedang diputar'),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Hapus satu lagu dari antrean')
    .addIntegerOption((option) => option
      .setName('posisi')
      .setDescription('Nomor lagu pada /queue')
      .setRequired(true)
      .setMinValue(1)),
  new SlashCommandBuilder()
    .setName('move')
    .setDescription('Pindahkan posisi lagu dalam antrean')
    .addIntegerOption((option) => option
      .setName('dari')
      .setDescription('Posisi awal')
      .setRequired(true)
      .setMinValue(1))
    .addIntegerOption((option) => option
      .setName('ke')
      .setDescription('Posisi tujuan')
      .setRequired(true)
      .setMinValue(1)),
  new SlashCommandBuilder().setName('help').setDescription('Lihat panduan command Lunara'),
].map((command) => command.setDMPermission(false));

export const commandData = commands.map((command) => command.toJSON());
