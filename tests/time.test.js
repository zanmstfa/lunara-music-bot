import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, parseTime, truncate } from '../src/utils/time.js';

test('parseTime menerima detik dan format jam', () => {
  assert.equal(parseTime('90'), 90_000);
  assert.equal(parseTime('1:30'), 90_000);
  assert.equal(parseTime('01:02:30'), 3_750_000);
});

test('parseTime menolak input yang tidak valid', () => {
  assert.equal(parseTime(''), null);
  assert.equal(parseTime('1:99'), null);
  assert.equal(parseTime('abc'), null);
});

test('formatTime menampilkan durasi dengan benar', () => {
  assert.equal(formatTime(90_000), '01:30');
  assert.equal(formatTime(3_750_000), '1:02:30');
});

test('truncate hanya memotong teks panjang', () => {
  assert.equal(truncate('Lunara', 10), 'Lunara');
  assert.equal(truncate('Lunara Music', 7), 'Lunara…');
});
