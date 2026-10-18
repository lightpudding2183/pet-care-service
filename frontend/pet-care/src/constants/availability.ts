// dayOfWeek follows JS convention: 0 = Sunday ... 6 = Saturday
export const DAYS = [
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday' },
  { dow: 6, label: 'Saturday' },
  { dow: 0, label: 'Sunday' },
];

export const DEFAULT_START = '09:00';
export const DEFAULT_END = '17:00';

const hhmm = (t: string) => String(t).slice(0, 5); // Postgres TIME comes back as HH:MM:SS

export function emptySchedule() {
  return Object.fromEntries(DAYS.map((d) => [d.dow, { enabled: false, start: DEFAULT_START, end: DEFAULT_END }]));
}

const normalize = (s: any) => ({
  dayOfWeek: s.dayOfWeek ?? null,
  specificDate: s.specificDate ?? null,
  startTime: hhmm(s.startTime),
  endTime: hhmm(s.endTime),
  isRecurring: s.isRecurring ?? true,
});

// The editor shows one weekly range per day. Anything it can't represent
// (extra ranges on a day, one-off dates) is kept in `preserved` so saving never drops it.
export function slotsToSchedule(slots: any[]) {
  const schedule = emptySchedule();
  const preserved = [];
  for (const s of slots) {
    const n = normalize(s);
    const day = n.isRecurring ? schedule[n.dayOfWeek] : undefined;
    if (day && !day.enabled) schedule[n.dayOfWeek] = { enabled: true, start: n.startTime, end: n.endTime };
    else preserved.push(n);
  }
  return { schedule, preserved };
}

export function scheduleToSlots(schedule: Record<number, { enabled: boolean; start: string; end: string }>, preserved: any[]) {
  const weekly = DAYS.filter((d) => schedule[d.dow].enabled).map((d) => ({
    dayOfWeek: d.dow,
    specificDate: null,
    startTime: schedule[d.dow].start,
    endTime: schedule[d.dow].end,
    isRecurring: true,
  }));
  return [...weekly, ...preserved];
}

// Returns { [dow]: message } for enabled days whose end is not after start
export function validateSchedule(schedule: Record<number, { enabled: boolean; start: string; end: string }>) {
  const errors: Record<number, string> = {};
  for (const d of DAYS) {
    const day = schedule[d.dow];
    if (day.enabled && day.end <= day.start) errors[d.dow] = 'End time must be after start time';
  }
  return errors;
}