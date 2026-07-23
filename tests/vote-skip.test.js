import test from 'node:test';
import assert from 'node:assert/strict';
import { skipVotes } from '../src/state.js';
import { castSkipVote } from '../src/utils/vote-skip.js';

function mockQueue({ listeners = 4, requesterId = 'requester' } = {}) {
  let skipped = false;
  const members = new Map(
    Array.from({ length: listeners }, (_, index) => [
      String(index),
      { user: { bot: false } },
    ]),
  );
  members.filter = (predicate) => new Map([...members].filter(([, value]) => predicate(value)));

  return {
    guild: { id: `guild-${Math.random()}` },
    currentTrack: {
      id: 'track-1',
      requestedBy: { id: requesterId },
    },
    channel: { members },
    node: {
      skip() {
        skipped = true;
      },
    },
    wasSkipped: () => skipped,
  };
}

test('peminta lagu dapat skip langsung', () => {
  const queue = mockQueue();
  const result = castSkipVote(queue, { id: 'requester' });
  assert.equal(result.status, 'skipped');
  assert.equal(result.forced, true);
  assert.equal(queue.wasSkipped(), true);
});

test('vote skip membutuhkan setengah pendengar', () => {
  const queue = mockQueue({ listeners: 4 });
  const first = castSkipVote(queue, { id: 'a' });
  const second = castSkipVote(queue, { id: 'b' });

  assert.deepEqual(first, { status: 'voted', votes: 1, required: 2 });
  assert.equal(second.status, 'skipped');
  assert.equal(queue.wasSkipped(), true);
  skipVotes.clear();
});

test('pengguna tidak dapat vote dua kali', () => {
  const queue = mockQueue({ listeners: 5 });
  castSkipVote(queue, { id: 'a' });
  const duplicate = castSkipVote(queue, { id: 'a' });

  assert.equal(duplicate.status, 'duplicate');
  assert.equal(duplicate.votes, 1);
  skipVotes.clear();
});
