import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryType } from 'discord-player';
import {
  playQuery,
  resolveSearchEngine,
} from '../src/services/music.js';

test('pencarian teks memprioritaskan katalog Spotify', () => {
  assert.equal(resolveSearchEngine('Never Gonna Give You Up'), QueryType.SPOTIFY_SEARCH);
});

test('URL tetap dideteksi otomatis sesuai sumbernya', () => {
  assert.equal(
    resolveSearchEngine('https://open.spotify.com/track/example'),
    QueryType.AUTO,
  );
});

test('SoundCloud tetap dapat dipilih secara manual', () => {
  assert.equal(
    resolveSearchEngine('Never Gonna Give You Up', 'soundcloud'),
    QueryType.SOUNDCLOUD_SEARCH,
  );
});

test('pencarian pintar memilih kandidat SoundCloud terbaik dari metadata Spotify', async () => {
  const spotifyTrack = {
    title: 'Never Gonna Give You Up',
    author: 'Rick Astley',
    durationMS: 213_000,
    url: 'https://open.spotify.com/track/example',
    thumbnail: 'https://example.com/spotify.jpg',
    cleanTitle: 'Never Gonna Give You Up',
  };
  const cover = {
    title: 'Never Gonna Give You Up Cover',
    author: 'Random Singer',
    durationMS: 213_000,
    url: 'https://soundcloud.com/example/cover',
    thumbnail: 'https://example.com/cover.jpg',
    metadata: null,
    setMetadata() {},
  };
  let selectedMetadata;
  const original = {
    title: 'Never Gonna Give You Up',
    author: 'Rick Astley',
    durationMS: 214_000,
    url: 'https://soundcloud.com/example/original',
    thumbnail: 'https://example.com/original.jpg',
    metadata: null,
    setMetadata(value) {
      selectedMetadata = value;
      this.metadata = value;
    },
  };
  const searches = [];
  let playedTrack;
  const player = {
    async search(query, options) {
      searches.push({ query, engine: options.searchEngine });
      if (options.searchEngine === QueryType.SPOTIFY_SEARCH) {
        return { playlist: null, tracks: [spotifyTrack] };
      }
      return { playlist: null, tracks: [cover, original] };
    },
    async play(_channel, track) {
      playedTrack = track;
      return { track };
    },
  };
  const interaction = {
    user: { id: 'user' },
    channelId: 'text-channel',
  };

  await playQuery(player, interaction, { id: 'voice-channel' }, 'Never Gonna Give You Up');

  assert.deepEqual(
    searches.map(({ engine }) => engine),
    [QueryType.SPOTIFY_SEARCH, QueryType.SOUNDCLOUD_SEARCH],
  );
  assert.equal(playedTrack, original);
  assert.equal(playedTrack.title, spotifyTrack.title);
  assert.equal(selectedMetadata.catalogUrl, spotifyTrack.url);
});

test('URL playlist Spotify tetap diproses sebagai playlist', async () => {
  const playlistUrl = 'https://open.spotify.com/playlist/example';
  let playedQuery;
  const player = {
    async search() {
      return {
        playlist: { title: 'Playlist' },
        tracks: [{ title: 'Track pertama' }],
      };
    },
    async play(_channel, query) {
      playedQuery = query;
      return { track: null };
    },
  };

  await playQuery(
    player,
    { user: { id: 'user' }, channelId: 'text-channel' },
    { id: 'voice-channel' },
    playlistUrl,
  );

  assert.equal(playedQuery, playlistUrl);
});
