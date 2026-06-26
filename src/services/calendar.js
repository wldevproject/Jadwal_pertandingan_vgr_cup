import { APP_NAME, parseScheduleDateTime } from '../utils/competition.js';

function escapeIcs(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    'T',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    'Z',
  ].join('');
}

export function buildCalendar({ title = APP_NAME, days = [] }) {
  const entries = [];

  (days || []).forEach((day, dayIndex) => {
    (day.rows || []).forEach((row, rowIndex) => {
      const target = parseScheduleDateTime(day.date, row.time);
      if (!target) return;
      entries.push({ day, row, dayIndex, rowIndex, target });
    });
  });

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VGR 5 Badminton Cup 2026//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  entries.forEach((entry) => {
    const end = new Date(entry.target.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:vgr5-${entry.dayIndex}-${entry.rowIndex}-${entry.target.getTime()}@vgr5arena.my.id`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(entry.target)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcs(`${title}: ${entry.row.a} vs ${entry.row.b}`)}`,
      `DESCRIPTION:${escapeIcs(`${entry.day.date} ${entry.row.time}`)}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadText(filename, content, type = 'text/calendar') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
