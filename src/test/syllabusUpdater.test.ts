import { describe, it, expect } from 'vitest';
import {
  normalizeName,
  levenshtein,
  nameSimilarity,
  MATCH_THRESHOLD,
  greedyMatch,
  computeSyllabusDiff,
} from '@/lib/syllabusUpdater';
import type { Assignment } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAssignment(overrides: Partial<Assignment> & { name: string }): Assignment {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name,
    type: overrides.type ?? 'homework',
    weight: overrides.weight ?? 10,
    score: overrides.score ?? null,
    archived: overrides.archived ?? false,
  };
}

// ─── normalizeName ────────────────────────────────────────────────────────────

describe('normalizeName', () => {
  it('lowercases', () => expect(normalizeName('Midterm Exam')).toBe('midterm exam'));
  it('trims whitespace', () => expect(normalizeName('  quiz  ')).toBe('quiz'));
  it('removes punctuation', () => expect(normalizeName('Homework #3!')).toBe('homework 3'));
  it('collapses spaces', () => expect(normalizeName('Final   Exam')).toBe('final exam'));
});

// ─── levenshtein ──────────────────────────────────────────────────────────────

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => expect(levenshtein('abc', 'abc')).toBe(0));
  it('returns string length for empty vs non-empty', () => expect(levenshtein('', 'abc')).toBe(3));
  it('returns 1 for single substitution', () => expect(levenshtein('cat', 'bat')).toBe(1));
  it('returns 1 for single insertion', () => expect(levenshtein('cat', 'cats')).toBe(1));
  it('returns 1 for single deletion', () => expect(levenshtein('cats', 'cat')).toBe(1));
  it('handles longer strings', () => expect(levenshtein('kitten', 'sitting')).toBe(3));
});

// ─── nameSimilarity ───────────────────────────────────────────────────────────

describe('nameSimilarity', () => {
  it('returns 1.0 for identical names', () => {
    expect(nameSimilarity('Midterm Exam', 'Midterm Exam')).toBe(1.0);
  });
  it('returns 1.0 for same name different case/punctuation', () => {
    expect(nameSimilarity('Midterm Exam', 'midterm exam')).toBe(1.0);
    expect(nameSimilarity('Homework #1', 'homework 1')).toBe(1.0);
  });
  it('returns high score for minor typo', () => {
    const score = nameSimilarity('Homework 3', 'Homework 4');
    expect(score).toBeGreaterThan(0.7);
  });
  it('returns score above threshold for near-identical name (plural)', () => {
    // 'final project' vs 'final projects': edit distance 1, sim = 1 - 1/14 ≈ 0.93
    const score = nameSimilarity('Final Project', 'Final Projects');
    expect(score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });
  it('returns score below threshold when only first word matches', () => {
    // 'Final Exam' vs 'Final Examination': sim ≈ 0.59 — intentionally below threshold
    const score = nameSimilarity('Final Exam', 'Final Examination');
    expect(score).toBeGreaterThan(0.5); // similar, but algorithm correctly keeps them distinct
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });
  it('returns low score for completely different names', () => {
    const score = nameSimilarity('Quiz 1', 'Final Exam');
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });
  it('returns 0 for empty strings', () => {
    expect(nameSimilarity('', '')).toBe(1.0); // both normalized to '' → equal
    expect(nameSimilarity('Exam', '')).toBe(0.0);
  });
});

// ─── greedyMatch ─────────────────────────────────────────────────────────────

describe('greedyMatch', () => {
  it('matches identical names', () => {
    const existing = [makeAssignment({ name: 'Homework 1' })];
    const incoming = [makeAssignment({ name: 'Homework 1' })];
    const matches = greedyMatch(existing, incoming);
    expect(matches).toHaveLength(1);
    expect(matches[0].existingIdx).toBe(0);
    expect(matches[0].incomingIdx).toBe(0);
  });

  it('produces a one-to-one mapping', () => {
    const existing = [
      makeAssignment({ name: 'Midterm Exam' }),
      makeAssignment({ name: 'Final Exam' }),
    ];
    const incoming = [
      makeAssignment({ name: 'Final Exam' }),
      makeAssignment({ name: 'Midterm Exam' }),
    ];
    const matches = greedyMatch(existing, incoming);
    expect(matches).toHaveLength(2);
    const existingIdxs = new Set(matches.map((m) => m.existingIdx));
    const incomingIdxs = new Set(matches.map((m) => m.incomingIdx));
    expect(existingIdxs.size).toBe(2);
    expect(incomingIdxs.size).toBe(2);
  });

  it('leaves unmatched items with no match', () => {
    const existing = [makeAssignment({ name: 'Quiz 1' })];
    const incoming = [makeAssignment({ name: 'Final Project' })];
    const matches = greedyMatch(existing, incoming);
    expect(matches).toHaveLength(0);
  });

  it('prefers the highest-similarity pair when names are close', () => {
    const existing = [
      makeAssignment({ name: 'Homework 1', id: 'ex1' }),
      makeAssignment({ name: 'Homework 2', id: 'ex2' }),
    ];
    const incoming = [
      makeAssignment({ name: 'Homework 2', id: 'in1' }),
      makeAssignment({ name: 'Homework 1', id: 'in2' }),
    ];
    const matches = greedyMatch(existing, incoming);
    expect(matches).toHaveLength(2);
    // Each existing should match its own counterpart (exact name match score = 1.0)
    const ex1Match = matches.find((m) => m.existingIdx === 0);
    const ex2Match = matches.find((m) => m.existingIdx === 1);
    expect(ex1Match?.score).toBe(1.0);
    expect(ex2Match?.score).toBe(1.0);
  });
});

// ─── computeSyllabusDiff ─────────────────────────────────────────────────────

describe('computeSyllabusDiff', () => {
  it('marks identical assignments as unchanged', () => {
    const a = makeAssignment({ name: 'Homework 1', weight: 10 });
    const diff = computeSyllabusDiff([a], [makeAssignment({ name: 'Homework 1', weight: 10 })]);
    expect(diff.counts.unchanged).toBe(1);
    expect(diff.counts.new).toBe(0);
    expect(diff.counts.updated).toBe(0);
    expect(diff.counts.removed).toBe(0);
  });

  it('detects new assignments', () => {
    const existing = [makeAssignment({ name: 'Midterm', weight: 30 })];
    const incoming = [
      makeAssignment({ name: 'Midterm', weight: 30 }),
      makeAssignment({ name: 'Quiz 1', weight: 10 }),
    ];
    const diff = computeSyllabusDiff(existing, incoming);
    expect(diff.counts.new).toBe(1);
    expect(diff.counts.unchanged).toBe(1);
    const newItem = diff.items.find((i) => i.status === 'new');
    expect(newItem?.incoming?.name).toBe('Quiz 1');
  });

  it('detects removed assignments', () => {
    const existing = [
      makeAssignment({ name: 'Midterm', weight: 30 }),
      makeAssignment({ name: 'Extra Credit', weight: 5 }),
    ];
    const incoming = [makeAssignment({ name: 'Midterm', weight: 30 })];
    const diff = computeSyllabusDiff(existing, incoming);
    expect(diff.counts.removed).toBe(1);
    expect(diff.items.find((i) => i.status === 'removed')?.existing?.name).toBe('Extra Credit');
  });

  it('marks graded removed assignment as willArchive=true', () => {
    const existing = [
      makeAssignment({ name: 'Midterm', weight: 30, score: 88 }),
    ];
    const diff = computeSyllabusDiff(existing, []);
    expect(diff.counts.removed).toBe(1);
    expect(diff.items[0].willArchive).toBe(true);
  });

  it('marks ungraded removed assignment as willArchive=false', () => {
    const existing = [makeAssignment({ name: 'Midterm', weight: 30, score: null })];
    const diff = computeSyllabusDiff(existing, []);
    expect(diff.items[0].willArchive).toBe(false);
  });

  it('detects updated weight', () => {
    const existing = [makeAssignment({ name: 'Final Exam', weight: 40 })];
    const incoming = [makeAssignment({ name: 'Final Exam', weight: 50 })];
    const diff = computeSyllabusDiff(existing, incoming);
    expect(diff.counts.updated).toBe(1);
    expect(diff.items[0].changes?.weight).toBe(true);
  });

  it('detects updated type', () => {
    const existing = [makeAssignment({ name: 'Midterm', type: 'exam', weight: 30 })];
    const incoming = [makeAssignment({ name: 'Midterm', type: 'quiz', weight: 30 })];
    const diff = computeSyllabusDiff(existing, incoming);
    expect(diff.counts.updated).toBe(1);
    expect(diff.items[0].changes?.type).toBe(true);
  });

  it('excludes already-archived assignments from diff', () => {
    const existing = [
      makeAssignment({ name: 'Old Assignment', weight: 10, archived: true, score: 85 }),
      makeAssignment({ name: 'Current HW', weight: 15 }),
    ];
    const incoming = [makeAssignment({ name: 'Current HW', weight: 15 })];
    const diff = computeSyllabusDiff(existing, incoming);
    // The archived one should not appear as 'removed' again
    expect(diff.counts.removed).toBe(0);
    expect(diff.counts.unchanged).toBe(1);
  });

  it('sorts items: updated → new → removed → unchanged', () => {
    const existing = [
      makeAssignment({ name: 'HW 1', weight: 10 }),
      makeAssignment({ name: 'HW 2', weight: 10 }),
      makeAssignment({ name: 'Midterm', weight: 30 }),
    ];
    const incoming = [
      makeAssignment({ name: 'HW 1', weight: 15 }), // updated
      makeAssignment({ name: 'Final Exam', weight: 30 }), // new
      // Midterm and HW 2 are removed
    ];
    const diff = computeSyllabusDiff(existing, incoming);
    const statuses = diff.items.map((i) => i.status);
    const firstUpdatedIdx = statuses.indexOf('updated');
    const firstNewIdx = statuses.indexOf('new');
    const firstRemovedIdx = statuses.indexOf('removed');
    if (firstUpdatedIdx !== -1 && firstNewIdx !== -1) {
      expect(firstUpdatedIdx).toBeLessThan(firstNewIdx);
    }
    if (firstNewIdx !== -1 && firstRemovedIdx !== -1) {
      expect(firstNewIdx).toBeLessThan(firstRemovedIdx);
    }
  });

  it('handles empty existing list (all new)', () => {
    const incoming = [
      makeAssignment({ name: 'Homework 1', weight: 10 }),
      makeAssignment({ name: 'Midterm', weight: 30 }),
    ];
    const diff = computeSyllabusDiff([], incoming);
    expect(diff.counts.new).toBe(2);
    expect(diff.counts.removed).toBe(0);
  });

  it('handles empty incoming list (all removed)', () => {
    const existing = [
      makeAssignment({ name: 'Homework 1', weight: 10, score: 95 }),
      makeAssignment({ name: 'Quiz 1', weight: 5, score: null }),
    ];
    const diff = computeSyllabusDiff(existing, []);
    expect(diff.counts.removed).toBe(2);
    const hw = diff.items.find((i) => i.existing?.name === 'Homework 1');
    const quiz = diff.items.find((i) => i.existing?.name === 'Quiz 1');
    expect(hw?.willArchive).toBe(true);
    expect(quiz?.willArchive).toBe(false);
  });
});
