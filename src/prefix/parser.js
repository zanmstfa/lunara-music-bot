import { FILTERS, MOODS } from '../constants.js';

export const DEFAULT_PREFIX = 'l!';

const COMMAND_ALIASES = Object.freeze({
  p: 'play',
  play: 'play',
  mood: 'mood',
  pause: 'pause',
  resume: 'pause',
  s: 'skip',
  skip: 'skip',
  prev: 'previous',
  previous: 'previous',
  stop: 'stop',
  disconnect: 'stop',
  q: 'queue',
  queue: 'queue',
  np: 'nowplaying',
  now: 'nowplaying',
  nowplaying: 'nowplaying',
  vol: 'volume',
  volume: 'volume',
  loop: 'loop',
  shuffle: 'shuffle',
  seek: 'seek',
  filter: 'filter',
  lyrics: 'lyrics',
  lirik: 'lyrics',
  rm: 'remove',
  remove: 'remove',
  move: 'move',
  h: 'help',
  help: 'help',
});

const LOOP_MODES = new Set(['off', 'track', 'queue', 'autoplay']);

function positiveInteger(value) {
  if (!/^\d+$/.test(value ?? '')) return null;
  const number = Number.parseInt(value, 10);
  return number > 0 ? number : null;
}

function missing(prefix, usage) {
  return `Cara pakainya: \`${prefix}${usage}\``;
}

export function parsePrefixCommand(content, prefix = DEFAULT_PREFIX) {
  if (typeof content !== 'string' || !content.toLowerCase().startsWith(prefix.toLowerCase())) {
    return null;
  }

  const body = content.slice(prefix.length).trim();
  if (!body) return { commandName: 'help', options: {} };

  const separator = body.search(/\s/);
  const trigger = (separator === -1 ? body : body.slice(0, separator)).toLowerCase();
  const rawArguments = separator === -1 ? '' : body.slice(separator).trim();
  const argumentsList = rawArguments ? rawArguments.split(/\s+/) : [];
  const commandName = COMMAND_ALIASES[trigger];

  if (!commandName) {
    return { error: `Command \`${prefix}${trigger}\` belum ada. Coba \`${prefix}help\` buat lihat daftarnya.` };
  }

  if (commandName === 'play') {
    if (!rawArguments) return { error: missing(prefix, 'p <judul lagu atau URL>') };
    if (rawArguments.length > 500) return { error: 'Judul atau URL terlalu panjang. Maksimal 500 karakter.' };
    return { commandName, options: { query: rawArguments, sumber: 'auto' } };
  }

  if (commandName === 'mood') {
    const pilihan = argumentsList[0]?.toLowerCase();
    if (!MOODS[pilihan]) {
      return {
        error: `${missing(prefix, 'mood <chill|focus|party|galau|nusantara>')}`,
      };
    }
    return { commandName, options: { pilihan } };
  }

  if (commandName === 'queue') {
    if (!argumentsList.length) return { commandName, options: { halaman: 1 } };
    const halaman = positiveInteger(argumentsList[0]);
    if (!halaman) return { error: missing(prefix, 'q [nomor halaman]') };
    return { commandName, options: { halaman } };
  }

  if (commandName === 'volume') {
    const persen = positiveInteger(argumentsList[0]);
    if (!persen || persen > 100) return { error: missing(prefix, 'vol <1-100>') };
    return { commandName, options: { persen } };
  }

  if (commandName === 'loop') {
    const mode = argumentsList[0]?.toLowerCase();
    if (!LOOP_MODES.has(mode)) {
      return { error: missing(prefix, 'loop <off|track|queue|autoplay>') };
    }
    return { commandName, options: { mode } };
  }

  if (commandName === 'seek') {
    if (!rawArguments) return { error: missing(prefix, 'seek <detik atau mm:ss>') };
    return { commandName, options: { waktu: rawArguments } };
  }

  if (commandName === 'filter') {
    const preset = argumentsList[0]?.toLowerCase();
    if (!FILTERS[preset]) {
      return {
        error: missing(prefix, 'filter <off|bass|nightcore|vaporwave|karaoke|spatial|lofi>'),
      };
    }
    return { commandName, options: { preset } };
  }

  if (commandName === 'remove') {
    const posisi = positiveInteger(argumentsList[0]);
    if (!posisi) return { error: missing(prefix, 'rm <posisi>') };
    return { commandName, options: { posisi } };
  }

  if (commandName === 'move') {
    const dari = positiveInteger(argumentsList[0]);
    const ke = positiveInteger(argumentsList[1]);
    if (!dari || !ke) return { error: missing(prefix, 'move <dari> <ke>') };
    return { commandName, options: { dari, ke } };
  }

  return { commandName, options: {} };
}
