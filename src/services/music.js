import { QueryType, QueueRepeatMode } from 'discord-player';
import { config } from '../config.js';

const SEARCH_ENGINES = Object.freeze({
  auto: QueryType.SPOTIFY_SEARCH,
  soundcloud: QueryType.SOUNDCLOUD_SEARCH,
  spotify: QueryType.SPOTIFY_SEARCH,
});

const URL_PATTERN = /^https?:\/\//i;

export function resolveSearchEngine(query, source = 'auto') {
  if (source === 'auto' && URL_PATTERN.test(query)) {
    return QueryType.AUTO;
  }

  return SEARCH_ENGINES[source] ?? QueryType.SPOTIFY_SEARCH;
}

function playerOptions(interaction, query, source) {
  return {
    requestedBy: interaction.user,
    searchEngine: resolveSearchEngine(query, source),
    nodeOptions: {
      metadata: { textChannelId: interaction.channelId },
      volume: config.defaultVolume,
      bufferingTimeout: 15_000,
      leaveOnStop: true,
      leaveOnStopCooldown: 5_000,
      leaveOnEnd: true,
      leaveOnEndCooldown: 30_000,
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: config.leaveOnEmptyMs,
      pauseOnEmpty: true,
      skipOnNoStream: true,
      maxSize: config.maxPlaylistSize,
    },
    connectionOptions: {
      deaf: true,
      daveEncryption: true,
    },
    afterSearch: async (result) => {
      if (result.tracks.length > config.maxPlaylistSize) {
        result.setTracks(result.tracks.slice(0, config.maxPlaylistSize));
      }
      return result;
    },
  };
}

export async function playQuery(player, interaction, voiceChannel, query, source = 'auto') {
  try {
    return await player.play(voiceChannel, query, playerOptions(interaction, query, source));
  } catch (error) {
    const mayFallback = ['auto', 'spotify'].includes(source) && !URL_PATTERN.test(query);
    if (!mayFallback) throw error;

    return player.play(
      voiceChannel,
      query,
      playerOptions(interaction, query, 'soundcloud'),
    );
  }
}

export async function startMoodRadio(player, interaction, voiceChannel, mood) {
  const result = await playQuery(player, interaction, voiceChannel, mood.query, 'spotify');
  result.queue.setMetadata({ textChannelId: interaction.channelId });
  result.queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
  return result;
}
