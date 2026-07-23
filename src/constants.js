export const COLORS = Object.freeze({
  primary: 0x8b5cf6,
  success: 0x22c55e,
  warning: 0xf59e0b,
  danger: 0xef4444,
  neutral: 0x64748b,
});

export const FILTERS = Object.freeze({
  off: { label: 'Normal', filters: [] },
  bass: { label: 'Bass Boost', filters: ['bassboost'] },
  nightcore: { label: 'Nightcore', filters: ['nightcore'] },
  vaporwave: { label: 'Vaporwave', filters: ['vaporwave'] },
  karaoke: { label: 'Karaoke', filters: ['karaoke'] },
  spatial: { label: '8D', filters: ['8D'] },
  lofi: { label: 'Lo-fi', filters: ['lofi'] },
});

export const MOODS = Object.freeze({
  chill: {
    label: 'Chill',
    emoji: '🌙',
    query: 'chill indie acoustic relaxing mix',
    filter: 'lofi',
  },
  focus: {
    label: 'Focus',
    emoji: '🧠',
    query: 'instrumental focus deep work music',
    filter: 'off',
  },
  party: {
    label: 'Party',
    emoji: '🎉',
    query: 'party dance hits mix',
    filter: 'bass',
  },
  galau: {
    label: 'Galau',
    emoji: '🌧️',
    query: 'lagu galau Indonesia acoustic',
    filter: 'off',
  },
  nusantara: {
    label: 'Nusantara',
    emoji: '🇮🇩',
    query: 'lagu Indonesia hits terbaru',
    filter: 'off',
  },
});

export const LOOP_LABELS = Object.freeze({
  0: 'Mati',
  1: 'Lagu',
  2: 'Antrean',
  3: 'Autoplay',
});
