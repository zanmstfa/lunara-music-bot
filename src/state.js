export const skipVotes = new Map();
export const nowPlayingMessages = new Map();
export const guildThemes = new Map();

export function clearTrackState(guildId) {
  skipVotes.delete(guildId);
}
