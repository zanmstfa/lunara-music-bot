const IGNORED_WORDS = new Set([
  'audio',
  'explicit',
  'hd',
  'hq',
  'lyrics',
  'lyric',
  'music',
  'official',
  'video',
]);

const VERSION_TERMS = [
  'acoustic',
  'bootleg',
  'cover',
  'edit',
  'instrumental',
  'karaoke',
  'live',
  'nightcore',
  'remix',
  'reverb',
  'slowed',
  'sped up',
];

export function normalizeTrackText(value = '') {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !IGNORED_WORDS.has(word))
    .join(' ');
}

function tokenSet(value) {
  return new Set(normalizeTrackText(value).split(' ').filter(Boolean));
}

export function tokenSimilarity(left, right) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }

  return (2 * intersection) / (leftTokens.size + rightTokens.size);
}

function titleSimilarity(reference, candidate) {
  const referenceTitle = normalizeTrackText(reference);
  const candidateTitle = normalizeTrackText(candidate);
  if (!referenceTitle || !candidateTitle) return 0;
  if (referenceTitle === candidateTitle) return 1;
  if (candidateTitle.includes(referenceTitle)) return 0.97;
  return tokenSimilarity(referenceTitle, candidateTitle);
}

function durationSimilarity(referenceMs, candidateMs) {
  if (!referenceMs || !candidateMs) return 0.5;
  const difference = Math.abs(referenceMs - candidateMs);
  if (difference <= 2_000) return 1;
  if (difference <= 5_000) return 0.9;
  if (difference <= 10_000) return 0.72;
  if (difference <= 20_000) return 0.4;
  return 0;
}

function versionPenalty(referenceTitle, candidateTitle) {
  const reference = normalizeTrackText(referenceTitle);
  const candidate = normalizeTrackText(candidateTitle);
  const unexpectedTerms = VERSION_TERMS.filter((term) => (
    candidate.includes(term) && !reference.includes(term)
  ));
  return Math.min(0.4, unexpectedTerms.length * 0.12);
}

function hasHighQualityTranscoding(track) {
  const source = track?.metadata ?? track?.raw?.engine ?? track?.raw;
  return source?.media?.transcodings?.some((item) => item.quality === 'hq') ?? false;
}

export function scoreCandidate(reference, candidate) {
  const title = titleSimilarity(reference?.title, candidate?.title);
  const author = tokenSimilarity(reference?.author, candidate?.author);
  const duration = durationSimilarity(reference?.durationMS, candidate?.durationMS);
  const quality = hasHighQualityTranscoding(candidate) ? 1 : 0.5;
  const penalty = versionPenalty(reference?.title, candidate?.title);
  const score = (title * 0.55) + (author * 0.15) + (duration * 0.25) + (quality * 0.05) - penalty;

  return {
    track: candidate,
    score: Math.max(0, Math.min(1, score)),
    signals: { title, author, duration, quality, penalty },
  };
}

export function rankCandidates(reference, candidates, limit = 10) {
  return candidates
    .slice(0, limit)
    .map((candidate) => scoreCandidate(reference, candidate))
    .sort((left, right) => right.score - left.score);
}

export function selectBestCandidate(reference, candidates) {
  const [best] = rankCandidates(reference, candidates);
  if (!best || best.score < 0.45 || best.signals.title < 0.5) return null;
  return best;
}

export function applyCatalogMetadata(match, catalogTrack) {
  const playableTrack = match.track;
  const audioSourceUrl = playableTrack.url;
  const audioThumbnail = playableTrack.thumbnail;

  playableTrack.title = catalogTrack.title;
  playableTrack.author = catalogTrack.author;
  playableTrack.thumbnail = catalogTrack.thumbnail || audioThumbnail;
  playableTrack.description = `${catalogTrack.title} by ${catalogTrack.author}`;
  playableTrack.cleanTitle = catalogTrack.cleanTitle || catalogTrack.title;
  playableTrack.setMetadata({
    catalogSource: 'spotify',
    catalogUrl: catalogTrack.url,
    audioSource: 'soundcloud',
    audioSourceUrl,
    matchScore: match.score,
  });

  return playableTrack;
}
