import test from 'node:test';
import assert from 'node:assert/strict';
import { commandData } from '../src/commands/definitions.js';
import { handlers } from '../src/commands/handlers.js';

test('setiap slash command memiliki handler', () => {
  assert.equal(commandData.length, 17);
  for (const command of commandData) {
    assert.equal(handlers.has(command.name), true, `Handler ${command.name} tidak ditemukan`);
  }
});

test('nama slash command unik', () => {
  const names = commandData.map((command) => command.name);
  assert.equal(new Set(names).size, names.length);
});
