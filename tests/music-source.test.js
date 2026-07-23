import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryType } from 'discord-player';
import { resolveSearchEngine } from '../src/services/music.js';

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
