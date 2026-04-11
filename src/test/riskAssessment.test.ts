import { describe, it, expect } from 'vitest';
import { calculateCourseRisk, calculateAllCourseRisks, getRiskLevelColor, getRiskLevelClass } from '@/lib/riskAssessment';
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

function makeCourse(id: string, assignments: Assignment[]): Course {
  return {
    id,
    semesterId: 'spring-2026',
    code: `TST ${id}`,
    name: `Course ${id}`,
    credits: 3,
    color: '#7C3AED',
    assignments,
  };
}

describe('calculateCourseRisk', () => {
  it('returns a valid risk shape', () => {
    const course = makeCourse('1', [makeAssignment('a', 100, 85)]);
    const risk = calculateCourseRisk(course);
    expect(risk.courseId).toBe('1');
    expect(['low', 'medium', 'high', 'critical']).toContain(risk.riskLevel);
    expect(risk.riskScore).toBeGreaterThanOrEqual(0);
    expect(risk.riskScore).toBeLessThanOrEqual(100);
  });

  it('assigns low risk to a high-performing course', () => {
    const course = makeCourse('1', [
      makeAssignment('a', 50, 96, '2026-01-01'),
      makeAssignment('b', 50, 94, '2026-01-15'),
    ]);
    const risk = calculateCourseRisk(course);
    expect(risk.riskLevel).toBe('low');
  });

  it('assigns critical or high risk to a failing course', () => {
    const course = makeCourse('1', [
      makeAssignment('a', 50, 40, '2026-01-01'),
      makeAssignment('b', 50, 35, '2026-01-15'),
    ]);
    const risk = calculateCourseRisk(course);
    expect(['critical', 'high']).toContain(risk.riskLevel);
  });

  it('detects missing (overdue) assignments as a risk factor', () => {
    const course = makeCourse('1', [
      makeAssignment('a', 40, 80, '2026-01-01'),
      makeAssignment('b', 40, null, '2020-01-01'), // overdue, ungraded
      makeAssignment('c', 20, null),
    ]);
    const risk = calculateCourseRisk(course);
    const hassMissingFactor = risk.factors.some(f => f.name.includes('Missing'));
    expect(hassMissingFactor).toBe(true);
  });

  it('trend is improving, stable, or declining', () => {
    const course = makeCourse('1', [makeAssignment('a', 100, 85)]);
    const risk = calculateCourseRisk(course);
    expect(['improving', 'stable', 'declining']).toContain(risk.trend);
  });

  it('risk score is capped at 100', () => {
    // Worst case: failing, missing assignments, declining trend
    const course = makeCourse('1', [
      makeAssignment('a', 20, 10, '2026-01-01'),
      makeAssignment('b', 20, 20, '2026-01-05'),
      makeAssignment('c', 60, null, '2020-01-01'), // overdue
    ]);
    const risk = calculateCourseRisk(course);
    expect(risk.riskScore).toBeLessThanOrEqual(100);
  });

  it('empty assignments defaults to low risk with no factors', () => {
    const course = makeCourse('1', []);
    const risk = calculateCourseRisk(course);
    expect(risk.riskScore).toBe(0);
    expect(risk.riskLevel).toBe('low');
  });

  it('currentGrade matches the weighted average from graded assignments', () => {
    const course = makeCourse('1', [
      makeAssignment('a', 60, 80, '2026-01-01'),
      makeAssignment('b', 40, 90, '2026-01-15'),
    ]);
    // 80*60 + 90*40 = 4800+3600 = 8400 / 100 = 84
    const risk = calculateCourseRisk(course);
    expect(risk.currentGrade).toBeCloseTo(84, 1);
  });
});

describe('calculateAllCourseRisks', () => {
  it('returns results sorted by riskScore descending', () => {
    const courses = [
      makeCourse('low', [makeAssignment('a', 100, 95)]),
      makeCourse('high', [makeAssignment('b', 100, 35)]),
      makeCourse('medium', [makeAssignment('c', 100, 72)]),
    ];
    const risks = calculateAllCourseRisks(courses);
    for (let i = 0; i < risks.length - 1; i++) {
      expect(risks[i].riskScore).toBeGreaterThanOrEqual(risks[i + 1].riskScore);
    }
  });
});

describe('getRiskLevelColor', () => {
  it('returns a CSS var string for critical', () => {
    expect(getRiskLevelColor('critical')).toContain('var(--error');
  });
  it('returns a CSS var string for high', () => {
    expect(getRiskLevelColor('high')).toContain('var(--warning');
  });
  it('returns a CSS var string for low', () => {
    expect(getRiskLevelColor('low')).toContain('var(--success');
  });
});

describe('getRiskLevelClass', () => {
  it('returns text-error for critical', () => {
    expect(getRiskLevelClass('critical')).toBe('text-error');
  });
  it('returns text-success for low', () => {
    expect(getRiskLevelClass('low')).toBe('text-success');
  });
});
