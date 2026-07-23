import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePrefixCommand } from '../src/prefix/parser.js';

test('mengabaikan pesan biasa', () => {
  assert.equal(parsePrefixCommand('halo semuanya'), null);
});

test('prefix kosong membuka bantuan', () => {
  assert.deepEqual(parsePrefixCommand('l!'), {
    commandName: 'help',
    options: {},
  });
});

test('l!p mengambil seluruh judul sebagai query', () => {
  assert.deepEqual(parsePrefixCommand('l!p never gonna give you up'), {
    commandName: 'play',
    options: {
      query: 'never gonna give you up',
      sumber: 'auto',
    },
  });
});

test('l!s selalu berarti skip dan l!stop berarti stop', () => {
  assert.equal(parsePrefixCommand('l!s').commandName, 'skip');
  assert.equal(parsePrefixCommand('l!stop').commandName, 'stop');
});

test('alias antrean dan now playing dipetakan dengan benar', () => {
  assert.deepEqual(parsePrefixCommand('l!q 2'), {
    commandName: 'queue',
    options: { halaman: 2 },
  });
  assert.equal(parsePrefixCommand('l!np').commandName, 'nowplaying');
});

test('nilai angka dan pilihan command divalidasi', () => {
  assert.deepEqual(parsePrefixCommand('l!vol 85'), {
    commandName: 'volume',
    options: { persen: 85 },
  });
  assert.match(parsePrefixCommand('l!vol 101').error, /1-100/);
  assert.match(parsePrefixCommand('l!loop selamanya').error, /off\|track/);
  assert.match(parsePrefixCommand('l!filter turbo').error, /filter/);
});

test('remove dan move menghasilkan posisi angka', () => {
  assert.deepEqual(parsePrefixCommand('l!rm 3'), {
    commandName: 'remove',
    options: { posisi: 3 },
  });
  assert.deepEqual(parsePrefixCommand('l!move 4 1'), {
    commandName: 'move',
    options: { dari: 4, ke: 1 },
  });
});

test('prefix bisa diganti lewat konfigurasi', () => {
  assert.equal(parsePrefixCommand('l!p song', '?'), null);
  assert.equal(parsePrefixCommand('?p song', '?').commandName, 'play');
});
