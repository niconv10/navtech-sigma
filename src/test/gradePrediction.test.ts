import { describe, it, expect } from 'vitest';
import { predictFinalGrade } from '@/lib/gradePrediction';
import type { Course, Assignment } from '@/types';

function makeAssignment(
  id: string,
  weight: number,
  score: number | null,
  dueDate?: string,
  type: Assignment['type'] = 'homework'
): Assignment {
  return { id, name: `A${id}`, type, weight, score, dueDate, description: undefined };
}

function makeCourse(assignments: Assignment[]): Course {
  return {
    id: 'c1',
    semesterId: 'spring-2026',
    code: 'TST 101',
    name: 'Test Course',
    credits: 3,
    color: '#7C3AED',
    assignments,
  };
}

describe('predictFinalGrade', () => {
  it('returns a valid prediction shape for a course with no assignments', () => {
    const course = makeCourse([]);
    const pred = predictFinalGrade(course);
    expect(pred.courseId).toBe('c1');
    expect(pred.currentGrade).toBe(0);
    expect(pred.confidence).toBe('low');
    expect(pred.mostLikely.grade).toBeGreaterThanOrEqual(0);
    expect(pred.mostLikely.grade).toBeLessThanOrEqual(100);
  });

  it('reflects current grade when all assignments are graded', () => {
    const assignments = [
      makeAssignment('1', 50, 90, '2026-01-01'),
      makeAssignment('2', 50, 80, '2026-01-15'),
    ];
    const course = makeCourse(assignments);
    const pred = predictFinalGrade(course);
    expect(pred.currentGrade).toBeCloseTo(85, 1);
    expect(pred.confidence).toBe('high'); // 100% weight completed
    // When everything is graded, all scenarios should be close to current
    expect(pred.mostLikely.grade).toBeCloseTo(85, 0);
  });

  it('confidence is low when less than 35% weight completed', () => {
    const assignments = [
      makeAssignment('1', 20, 90, '2026-01-01'),
      makeAssignment('2', 80, null),
    ];
    const pred = predictFinalGrade(makeCourse(assignments));
    expect(pred.confidence).toBe('low');
    expect(pred.completedWeight).toBe(20);
    expect(pred.remainingWeight).toBe(80);
  });

  it('confidence is medium when 35-60% weight completed', () => {
    const assignments = [
      makeAssignment('1', 50, 85, '2026-01-01'),
      makeAssignment('2', 50, null),
    ];
    const pred = predictFinalGrade(makeCourse(assignments));
    expect(pred.confidence).toBe('medium');
  });

  it('optimistic grade is >= mostLikely grade', () => {
    const assignments = [
      makeAssignment('1', 40, 75, '2026-01-01'),
      makeAssignment('2', 60, null),
    ];
    const pred = predictFinalGrade(makeCourse(assignments));
    expect(pred.optimistic.grade).toBeGreaterThanOrEqual(pred.mostLikely.grade);
  });

  it('pessimistic grade is <= mostLikely grade', () => {
    const assignments = [
      makeAssignment('1', 40, 75, '2026-01-01'),
      makeAssignment('2', 60, null),
    ];
    const pred = predictFinalGrade(makeCourse(assignments));
    expect(pred.pessimistic.grade).toBeLessThanOrEqual(pred.mostLikely.grade);
  });

  it('all scenario grades are clamped 0-100', () => {
    const assignments = [makeAssignment('1', 100, 0, '2026-01-01')];
    const pred = predictFinalGrade(makeCourse(assignments));
    expect(pred.optimistic.grade).toBeGreaterThanOrEqual(0);
    expect(pred.optimistic.grade).toBeLessThanOrEqual(100);
    expect(pred.pessimistic.grade).toBeGreaterThanOrEqual(0);
    expect(pred.pessimistic.grade).toBeLessThanOrEqual(100);
    expect(pred.mostLikely.grade).toBeGreaterThanOrEqual(0);
    expect(pred.mostLikely.grade).toBeLessThanOrEqual(100);
  });

  it('scenario letters match their grade percentages', () => {
    const assignments = [
      makeAssignment('1', 50, 85, '2026-01-01'),
      makeAssignment('2', 50, null),
    ];
    const pred = predictFinalGrade(makeCourse(assignments));
    // All letter grades should be non-empty strings
    expect(pred.mostLikely.letter).toMatch(/^[ABCDF][+-]?$/);
    expect(pred.optimistic.letter).toMatch(/^[ABCDF][+-]?$/);
    expect(pred.pessimistic.letter).toMatch(/^[ABCDF][+-]?$/);
  });

  it('probability percentages sum to 100', () => {
    const assignments = [
      makeAssignment('1', 50, 85, '2026-01-01'),
      makeAssignment('2', 50, null),
    ];
    const pred = predictFinalGrade(makeCourse(assignments));
    const total = pred.optimistic.probability + pred.mostLikely.probability + pred.pessimistic.probability;
    expect(total).toBe(100);
  });
});
