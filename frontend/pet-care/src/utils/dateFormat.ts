const DATE_OPTS: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

export const formatDate = (d: Date | string | number): string => new Date(d).toLocaleDateString(undefined, DATE_OPTS);
export const formatTime = (d: Date | string | number): string => new Date(d).toLocaleTimeString(undefined, TIME_OPTS);
export const formatDateTime = (d: Date | string | number): string => `${formatDate(d)}, ${formatTime(d)}`;

export function formatRange(start: Date | string | number, end: Date | string | number): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return `${formatDate(s)}, ${formatTime(s)} – ${formatTime(e)}`;
  return `${formatDateTime(s)} → ${formatDateTime(e)}`;
}