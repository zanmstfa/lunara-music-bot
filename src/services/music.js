import { QueryType, QueueRepeatMode } from 'discord-player';
import { config } from '../config.js';
import {
  applyCatalogMetadata,
  selectBestCandidate,
} from './track-matcher.js';

const SEARCH_ENGINES = Object.freeze({
  auto: QueryType.SPOTIFY_SEARCH,
  soundcloud: QueryType.SOUNDCLOUD_SEARCH,
  spotify: QueryType.SPOTIFY_SEARCH,
});

const URL_PATTERN = /^https?:\/\//i;
const SPOTIFY_URL_PATTERN = /^https?:\/\/open\.spotify\.com\//i;

export function resolveSearchEngine(query, source = 'auto') {
  if (URL_PATTERN.test(query)) {
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

function shouldMatchSpotify(query, source) {
  if (!['auto', 'spotify'].includes(source)) return false;
  return !URL_PATTERN.test(query) || SPOTIFY_URL_PATTERN.test(query);
}

async function findSpotifyReference(player, interaction, query) {
  const result = await player.search(query, {
    requestedBy: interaction.user,
    searchEngine: URL_PATTERN.test(query) ? QueryType.AUTO : QueryType.SPOTIFY_SEARCH,
  });

  if (result.playlist) return null;
  return result.tracks[0];
}

async function findBestSoundCloudMatch(player, interaction, referenceTrack) {
  const result = await player.search(
    `${referenceTrack.author} ${referenceTrack.title}`,
    {
      requestedBy: interaction.user,
      searchEngine: QueryType.SOUNDCLOUD_SEARCH,
    },
  );
  const match = selectBestCandidate(referenceTrack, result.tracks);
  return match ? applyCatalogMetadata(match, referenceTrack) : null;
}

async function playMatchedTrack(player, interaction, voiceChannel, query) {
  const referenceTrack = await findSpotifyReference(player, interaction, query);
  if (!referenceTrack) return null;

  const playableTrack = await findBestSoundCloudMatch(player, interaction, referenceTrack);
  if (!playableTrack) return null;

  return player.play(
    voiceChannel,
    playableTrack,
    playerOptions(interaction, playableTrack.url, 'soundcloud'),
  );
}

export async function playQuery(player, interaction, voiceChannel, query, source = 'auto') {
  if (shouldMatchSpotify(query, source)) {
    try {
      const matched = await playMatchedTrack(player, interaction, voiceChannel, query);
      if (matched) return matched;
    } catch (error) {
      console.warn('[audio-match] Pencocokan pintar gagal, memakai pencarian biasa:', error.message);
    }
  }

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
