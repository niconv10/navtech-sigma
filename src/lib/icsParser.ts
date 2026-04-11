/**
 * icsParser.ts
 *
 * Lightweight, zero-dependency .ics (iCalendar RFC 5545) parser.
 * Extracts VEVENT blocks and maps them to a minimal event shape.
 * Handles both DATE and DATETIME values (with or without timezone offset).
 */

export interface IcsEvent {
  uid: string;
  summary: string;
  /** ISO date string, e.g. "2025-04-15" */
  date: string;
  description?: string;
  /** Course code extracted from CATEGORIES or summary prefix */
  courseHint?: string;
}

// ─── Line unfolding (RFC 5545 §3.1) ─────────────────────────────────────────

function unfold(raw: string): string {
  // CRLF or LF followed by a space/tab = continuation line
  return raw.replace(/\r?\n[ \t]/g, '');
}

// ─── Property value extraction ────────────────────────────────────────────────

function extractProp(lines: string[], name: string): string | undefined {
  const upper = name.toUpperCase();
  for (const line of lines) {
    // Matches "NAME", "NAME;PARAM=VALUE", "NAME;TZID=…"
    if (line.startsWith(upper + ':') || line.startsWith(upper + ';')) {
      return line.slice(line.indexOf(':') + 1).trim();
    }
  }
  return undefined;
}

// ─── Date parsing ────────────────────────────────────────────────────────────

/**
 * Parse iCal date/datetime value to ISO date string "yyyy-MM-dd".
 * Supports: 20250415, 20250415T235900, 20250415T235900Z
 */
function parseIcsDate(val: string): string | null {
  const cleaned = val.replace(/[TZ]/g, '').slice(0, 8); // first 8 digits = YYYYMMDD
  if (!/^\d{8}$/.test(cleaned)) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
}

// ─── Course hint extraction ──────────────────────────────────────────────────

const COURSE_CODE_RE = /\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i;

function extractCourseHint(summary: string, categories?: string): string | undefined {
  // Try CATEGORIES first (Canvas often puts course code there)
  if (categories) {
    const m = COURSE_CODE_RE.exec(categories);
    if (m) return m[1].replace(/\s+/, ' ');
  }
  // Fall back to summary prefix
  const m = COURSE_CODE_RE.exec(summary);
  if (m) return m[1].replace(/\s+/, ' ');
  return undefined;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * Parse the text content of an .ics file and return all VEVENT entries.
 * Returns an empty array if the file is not a valid iCalendar.
 */
export function parseIcs(icsText: string): IcsEvent[] {
  const unfolded = unfold(icsText);
  const lines = unfolded.split(/\r?\n/);

  const events: IcsEvent[] = [];
  let inEvent = false;
  let eventLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === 'BEGIN:VEVENT') {
      inEvent = true;
      eventLines = [];
    } else if (line.trim() === 'END:VEVENT') {
      inEvent = false;

      const uid     = extractProp(eventLines, 'UID') ?? crypto.randomUUID();
      const summary = extractProp(eventLines, 'SUMMARY') ?? '(No title)';
      const dtstart = extractProp(eventLines, 'DTSTART');
      const categories = extractProp(eventLines, 'CATEGORIES');
      const description = extractProp(eventLines, 'DESCRIPTION')?.replace(/\\n/g, '\n').replace(/\\,/g, ',');

      if (!dtstart) continue; // skip events with no date

      const date = parseIcsDate(dtstart);
      if (!date) continue;

      events.push({
        uid,
        summary: summary.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, ' '),
        date,
        description: description || undefined,
        courseHint: extractCourseHint(summary, categories),
      });
    } else if (inEvent) {
      eventLines.push(line);
    }
  }

  return events;
}
