/** Local-date helpers. We key entries by local calendar day (YYYY-MM-DD). */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(dateISO: string, delta: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toISODate(dt);
}

/** Returns the last `n` ISO days, oldest first, ending today. */
export function lastNDays(n: number, endISO = todayISO()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endISO, -i));
  return out;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayShort(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function weekdayLetter(dateISO: string): string {
  return weekdayShort(dateISO).charAt(0);
}

/** e.g. "Monday, Jun 1" */
export function prettyDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const full = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dt.getDay()
  ];
  return `${full}, ${MONTHS[m - 1]} ${d}`;
}

export function relativeDayLabel(dateISO: string): string {
  if (dateISO === todayISO()) return 'Today';
  if (dateISO === addDays(todayISO(), -1)) return 'Yesterday';
  return prettyDate(dateISO);
}
