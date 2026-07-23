export function cleanTrackTitle(title) {
  return String(title ?? '')
    .replace(/\((official|lyrics?|audio|video|visualizer|live)[^)]*\)/gi, '')
    .replace(/\[(official|lyrics?|audio|video|visualizer|live)[^\]]*\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function findLyrics(player, track) {
  const query = `${cleanTrackTitle(track.title)} ${track.author ?? ''}`.trim();
  const results = await player.lyrics.search({ q: query });
  if (!results.length) return null;

  const durationSeconds = Math.round((track.durationMS || 0) / 1_000);
  return results
    .map((result) => ({
      result,
      distance: durationSeconds ? Math.abs(result.duration - durationSeconds) : 0,
    }))
    .sort((a, b) => a.distance - b.distance)[0].result;
}
