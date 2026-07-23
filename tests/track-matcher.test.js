import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCatalogMetadata,
  normalizeTrackText,
  selectBestCandidate,
  tokenSimilarity,
} from '../src/services/track-matcher.js';

const track = (overrides = {}) => ({
  title: 'Never Gonna Give You Up',
  author: 'Rick Astley',
  durationMS: 213_000,
  url: 'https://example.com/audio',
  thumbnail: 'https://example.com/audio.jpg',
  metadata: {
    media: {
      transcodings: [{ quality: 'hq' }],
    },
  },
  ...overrides,
});

test('normalisasi membuang label umum tanpa merusak judul', () => {
  assert.equal(
    normalizeTrackText('Never Gonna Give You Up (Official Video)'),
    'never gonna give you up',
  );
});

test('kemiripan token tidak bergantung pada urutan kata', () => {
  assert.equal(tokenSimilarity('Rick Astley', 'Astley Rick'), 1);
});

test('versi asli dipilih di atas cover dan versi live', () => {
  const reference = track();
  const original = track({ author: 'Rick Astley Official' });
  const cover = track({
    title: 'Never Gonna Give You Up Cover',
    author: 'Random Singer',
  });
  const live = track({
    title: 'Never Gonna Give You Up Live',
    durationMS: 260_000,
  });

  assert.equal(
    selectBestCandidate(reference, [cover, live, original]).track,
    original,
  );
});

test('durasi membantu membedakan judul yang sama', () => {
  const reference = track();
  const wrongDuration = track({ durationMS: 300_000 });
  const correctDuration = track({ durationMS: 214_000 });

  assert.equal(
    selectBestCandidate(reference, [wrongDuration, correctDuration]).track,
    correctDuration,
  );
});

test('metadata Spotify dipakai untuk tampilan tanpa mengganti URL audio', () => {
  const playable = track();
  let storedMetadata;
  playable.setMetadata = (value) => {
    storedMetadata = value;
  };
  const catalog = track({
    url: 'https://open.spotify.com/track/example',
    thumbnail: 'https://example.com/spotify.jpg',
  });

  const result = applyCatalogMetadata({ track: playable, score: 0.93 }, catalog);
  assert.equal(result.url, 'https://example.com/audio');
  assert.equal(result.thumbnail, 'https://example.com/spotify.jpg');
  assert.equal(storedMetadata.catalogUrl, 'https://open.spotify.com/track/example');
  assert.equal(storedMetadata.audioSource, 'soundcloud');
});
