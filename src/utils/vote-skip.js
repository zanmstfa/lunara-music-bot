import { clearTrackState, skipVotes } from '../state.js';

export function castSkipVote(queue, user) {
  const track = queue.currentTrack;
  if (!track) return { status: 'empty' };

  if (track.requestedBy?.id === user.id) {
    clearTrackState(queue.guild.id);
    queue.node.skip();
    return { status: 'skipped', forced: true };
  }

  const listeners = queue.channel?.members?.filter((member) => !member.user.bot);
  const required = Math.max(1, Math.ceil((listeners?.size ?? 1) / 2));
  const current = skipVotes.get(queue.guild.id);
  const vote = current?.trackId === track.id
    ? current
    : { trackId: track.id, voters: new Set() };

  if (vote.voters.has(user.id)) {
    return { status: 'duplicate', votes: vote.voters.size, required };
  }

  vote.voters.add(user.id);
  skipVotes.set(queue.guild.id, vote);

  if (vote.voters.size >= required) {
    clearTrackState(queue.guild.id);
    queue.node.skip();
    return { status: 'skipped', forced: false, votes: vote.voters.size, required };
  }

  return { status: 'voted', votes: vote.voters.size, required };
}
