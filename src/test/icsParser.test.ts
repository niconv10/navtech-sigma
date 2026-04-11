import { describe, it, expect } from 'vitest';
import { parseIcs } from '@/lib/icsParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeIcs(events: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Test//Test//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function makeEvent(props: Record<string, string>): string {
  const lines = ['BEGIN:VEVENT'];
  for (const [k, v] of Object.entries(props)) lines.push(`${k}:${v}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseIcs', () => {
  it('returns empty array for empty calendar', () => {
    expect(parseIcs(makeIcs([]))).toHaveLength(0);
  });

  it('parses a single event with DATE value', () => {
    const ics = makeIcs([
      makeEvent({
        UID: 'test-001@canvas',
        SUMMARY: 'Homework 1',
        DTSTART: '20250415',
      }),
    ]);
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Homework 1');
    expect(events[0].date).toBe('2025-04-15');
    expect(events[0].uid).toBe('test-001@canvas');
  });

  it('parses a DATETIME value (with time component)', () => {
    const ics = makeIcs([
      makeEvent({
        UID: 'test-002',
        SUMMARY: 'Midterm Exam',
        DTSTART: '20250501T140000',
      }),
    ]);
    const events = parseIcs(ics);
    expect(events[0].date).toBe('2025-05-01');
  });

  it('parses a UTC DATETIME value (with Z suffix)', () => {
    const ics = makeIcs([
      makeEvent({
        UID: 'test-003',
        SUMMARY: 'Final Project',
        DTSTART: '20250601T235900Z',
      }),
    ]);
    const events = parseIcs(ics);
    expect(events[0].date).toBe('2025-06-01');
  });

  it('skips events with no DTSTART', () => {
    const ics = makeIcs([
      makeEvent({
        UID: 'test-004',
        SUMMARY: 'No date event',
      }),
    ]);
    expect(parseIcs(ics)).toHaveLength(0);
  });

  it('parses multiple events', () => {
    const ics = makeIcs([
      makeEvent({ UID: 'a', SUMMARY: 'Quiz 1', DTSTART: '20250301' }),
      makeEvent({ UID: 'b', SUMMARY: 'Quiz 2', DTSTART: '20250315' }),
      makeEvent({ UID: 'c', SUMMARY: 'Final Exam', DTSTART: '20250501' }),
    ]);
    const events = parseIcs(ics);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.summary)).toEqual(['Quiz 1', 'Quiz 2', 'Final Exam']);
  });

  it('extracts course hint from CATEGORIES', () => {
    const ics = makeIcs([
      [
        'BEGIN:VEVENT',
        'UID:canvas-001',
        'SUMMARY:Homework 3',
        'DTSTART:20250410',
        'CATEGORIES:CS 301',
        'END:VEVENT',
      ].join('\r\n'),
    ]);
    const events = parseIcs(ics);
    expect(events[0].courseHint).toBe('CS 301');
  });

  it('extracts course hint from summary when no CATEGORIES', () => {
    const ics = makeIcs([
      makeEvent({
        UID: 'canvas-002',
        SUMMARY: 'MATH 201 - Quiz 2',
        DTSTART: '20250410',
      }),
    ]);
    const events = parseIcs(ics);
    expect(events[0].courseHint).toBe('MATH 201');
  });

  it('handles unfolded long lines (RFC 5545 §3.1)', () => {
    // A long SUMMARY split across two lines with a leading space on continuation
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:fold-001',
      'DTSTART:20250420',
      'SUMMARY:This is a very long assignment name that gets fol',
      ' ded across two lines',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const events = parseIcs(ics);
    expect(events[0].summary).toBe(
      'This is a very long assignment name that gets folded across two lines',
    );
  });

  it('handles LF-only line endings', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:lf-001',
      'SUMMARY:LF Event',
      'DTSTART:20250501',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n'); // LF only, no CR
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('LF Event');
  });

  it('unescapes backslash-comma in summary', () => {
    const ics = makeIcs([
      makeEvent({ UID: 'esc-001', SUMMARY: 'Exam\\, Part 1', DTSTART: '20250501' }),
    ]);
    expect(parseIcs(ics)[0].summary).toBe('Exam, Part 1');
  });

  it('handles DTSTART with TZID parameter', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:tz-001',
      'SUMMARY:Lab Report',
      'DTSTART;TZID=America/New_York:20250510T170000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const events = parseIcs(ics);
    expect(events[0].date).toBe('2025-05-10');
  });
});
