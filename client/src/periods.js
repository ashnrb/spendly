// Pure date helpers — the "period engine". No React here.

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function startOfWeek(date) { // Monday-based
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

const FORTNIGHT_ANCHOR = new Date(2024, 0, 1);

export function getPeriod(refDate, type) {
  const d = startOfDay(refDate);
  if (type === 'monthly') {
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
    };
  }
  if (type === 'fortnightly') {
    const ws = startOfWeek(d);
    const weeks = Math.floor((ws - FORTNIGHT_ANCHOR) / (7 * 86400000));
    const blockMs = FORTNIGHT_ANCHOR.getTime() + Math.floor(weeks / 2) * 14 * 86400000;
    return {
      start: startOfDay(new Date(blockMs)),
      end: startOfDay(new Date(blockMs + 13 * 86400000)),
    };
  }
  const start = startOfWeek(d);
  return { start, end: startOfDay(new Date(start.getTime() + 6 * 86400000)) };
}

export function shiftPeriod(period, type, dir) {
  if (type === 'monthly') {
    const b = period.start;
    return getPeriod(new Date(b.getFullYear(), b.getMonth() + dir, 1), type);
  }
  const days = type === 'fortnightly' ? 14 : 7;
  return getPeriod(new Date(period.start.getTime() + dir * days * 86400000), type);
}

export function inPeriod(dateStr, period) {
  const t = startOfDay(dateStr).getTime();
  return t >= period.start.getTime() && t <= period.end.getTime();
}

export function periodLabel(period, type) {
  const md = { month: 'short', day: 'numeric' };
  if (type === 'monthly') return period.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return `${period.start.toLocaleDateString(undefined, md)} – ${period.end.toLocaleDateString(undefined, md)}`;
}

export function toInputDate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}