export function parseTime(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input) return null;

  if (/^\d+$/.test(input)) {
    return Number(input) * 1_000;
  }

  const parts = input.split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  const numbers = parts.map(Number);
  const seconds = numbers.pop();
  const minutes = numbers.pop() ?? 0;
  const hours = numbers.pop() ?? 0;

  if (seconds > 59 || minutes > 59) return null;
  return ((hours * 3_600) + (minutes * 60) + seconds) * 1_000;
}

export function formatTime(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '00:00';
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3_600);
  const base = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours ? `${hours}:${base}` : base;
}

export function truncate(text, maxLength) {
  const value = String(text ?? '');
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}
