const toInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const config = Object.freeze({
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  devGuildId: process.env.DEV_GUILD_ID || null,
  defaultVolume: toInteger(process.env.DEFAULT_VOLUME, 70, 1, 100),
  leaveOnEmptyMs: toInteger(process.env.LEAVE_ON_EMPTY_MS, 300_000, 10_000, 3_600_000),
  maxPlaylistSize: toInteger(process.env.MAX_PLAYLIST_SIZE, 100, 1, 500),
  youtubeCookie: process.env.YOUTUBE_COOKIE || null,
});

export function validateConfig({ deploy = false } = {}) {
  const missing = [];
  if (!config.token) missing.push('DISCORD_TOKEN');
  if (deploy && !config.clientId) missing.push('CLIENT_ID');

  if (missing.length) {
    throw new Error(`Konfigurasi belum lengkap: ${missing.join(', ')}. Salin .env.example menjadi .env.`);
  }
}
