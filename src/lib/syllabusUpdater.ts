/**
 * Syllabus Update / Diff Engine
 *
 * Computes the diff between existing course assignments and a newly parsed
 * syllabus, allowing students to review changes before applying them.
 */

import type { Assignment } from '@/types';

export type DiffStatus = 'new' | 'updated' | 'removed' | 'unchanged';

export interface FieldChanges {
  name?: boolean;
  weight?: boolean;
  type?: boolean;
  dueDate?: boolean;
  description?: boolean;
}

export interface AssignmentDiff {
  /** Categorisation of this item relative to the existing syllabus */
  status: DiffStatus;
  /** Current assignment in the database (absent for 'new') */
  existing?: Assignment;
  /** Assignment parsed from the new syllabus (absent for 'removed') */
  incoming?: Assignment;
  /** Which fields changed — only populated for 'updated' items */
  changes?: FieldChanges;
  /**
   * For 'removed' items that already have a grade entered:
   * the assignment will be archived rather than deleted so the grade is kept.
   */
  willArchive?: boolean;
}

export interface SyllabusDiff {
  items: AssignmentDiff[];
  counts: {
    new: number;
    updated: number;
    removed: number;
    unchanged: number;
  };
}

// ─── Fuzzy name matching ───────────────────────────────────────────────────

/** Normalize a name for comparison: lowercase, no punctuation, collapsed spaces */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/** Levenshtein edit distance */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Build row-by-row to keep memory O(n)
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr: number[] = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * Similarity score in [0, 1].
 * 1.0 = identical after normalisation, 0.0 = completely different.
 */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1.0;
  if (!na || !nb) return 0.0;
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}

/** Minimum similarity for two names to be considered the same assignment */
export const MATCH_THRESHOLD = 0.6;

interface RawMatch {
  existingIdx: number;
  incomingIdx: number;
  score: number;
}

/**
 * Greedy best-match pairing: produces a one-to-one mapping between existing
 * and incoming assignments, maximising total similarity.
 */
export function greedyMatch(
  existing: Assignment[],
  incoming: Assignment[],
): RawMatch[] {
  const candidates: RawMatch[] = [];
  for (let ei = 0; ei < existing.length; ei++) {
    for (let ii = 0; ii < incoming.length; ii++) {
      const score = nameSimilarity(existing[ei].name, incoming[ii].name);
      if (score >= MATCH_THRESHOLD) {
        candidates.push({ existingIdx: ei, incomingIdx: ii, score });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const usedExisting = new Set<number>();
  const usedIncoming = new Set<number>();
  const matches: RawMatch[] = [];
  for (const c of candidates) {
    if (!usedExisting.has(c.existingIdx) && !usedIncoming.has(c.incomingIdx)) {
      matches.push(c);
      usedExisting.add(c.existingIdx);
      usedIncoming.add(c.incomingIdx);
    }
  }
  return matches;
}

/** Returns the set of fields that differ between a matched pair, or null if unchanged */
function detectChanges(
  existing: Assignment,
  incoming: Assignment,
): FieldChanges | null {
  const c: FieldChanges = {};
  if (normalizeName(existing.name) !== normalizeName(incoming.name)) c.name = true;
  if (existing.weight !== incoming.weight) c.weight = true;
  if (existing.type !== incoming.type) c.type = true;
  if ((existing.dueDate ?? '') !== (incoming.dueDate ?? '')) c.dueDate = true;
  if ((existing.description ?? '') !== (incoming.description ?? '')) c.description = true;
  return Object.keys(c).length > 0 ? c : null;
}

const DIFF_ORDER: Record<DiffStatus, number> = {
  updated: 0,
  new: 1,
  removed: 2,
  unchanged: 3,
};

/**
 * Compute the full diff between a course's existing assignments and the
 * assignments extracted from a newly uploaded syllabus.
 *
 * Archived assignments (archived=true) are excluded from the comparison so
 * they don't show up as "removed" every time.
 */
export function computeSyllabusDiff(
  existing: Assignment[],
  incoming: Assignment[],
): SyllabusDiff {
  // Exclude already-archived assignments — they shouldn't participate in diff
  const activeExisting = existing.filter((a) => !a.archived);

  const matches = greedyMatch(activeExisting, incoming);
  const matchedExistingIdx = new Set(matches.map((m) => m.existingIdx));
  const matchedIncomingIdx = new Set(matches.map((m) => m.incomingIdx));

  const items: AssignmentDiff[] = [];

  for (const match of matches) {
    const ex = activeExisting[match.existingIdx];
    const inc = incoming[match.incomingIdx];
    const changes = detectChanges(ex, inc);
    items.push(
      changes
        ? { status: 'updated', existing: ex, incoming: inc, changes }
        : { status: 'unchanged', existing: ex, incoming: inc },
    );
  }

  for (let i = 0; i < activeExisting.length; i++) {
    if (!matchedExistingIdx.has(i)) {
      const ex = activeExisting[i];
      items.push({
        status: 'removed',
        existing: ex,
        willArchive: ex.score !== null,
      });
    }
  }

  for (let i = 0; i < incoming.length; i++) {
    if (!matchedIncomingIdx.has(i)) {
      items.push({ status: 'new', incoming: incoming[i] });
    }
  }

  items.sort((a, b) => DIFF_ORDER[a.status] - DIFF_ORDER[b.status]);

  const counts = { new: 0, updated: 0, removed: 0, unchanged: 0 };
  for (const item of items) counts[item.status]++;

  return { items, counts };
}
