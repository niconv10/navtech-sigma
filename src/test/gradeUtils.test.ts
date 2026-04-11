import { describe, it, expect } from 'vitest';
import {
  calculateCourseGrade,
  calculateGPA,
  gradeToGPA,
  percentageToLetter,
  projectFinalGrade,
  calculateRequiredScore,
  getAssignmentStatus,
  calculateCourseProgress,
} from '@/lib/gradeUtils';
import type { Assignment, Course } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeAssignment(
  overrides: Partial<Assignment> & { id: string; name: string; type: Assignment['type']; weight: number }
): Assignment {
  return {
    dueDate: undefined,
    description: undefined,
    score: null,
    ...overrides,
  };
}

function makeGradedAssignment(
  id: string,
  weight: number,
  score: number,
  type: Assignment['type'] = 'homework'
): Assignment {
  return makeAssignment({ id, name: `A${id}`, type, weight, score });
}

function makeUngradedAssignment(
  id: string,
  weight: number,
  type: Assignment['type'] = 'homework'
): Assignment {
  return makeAssignment({ id, name: `A${id}`, type, weight, score: null });
}

// ---------------------------------------------------------------------------
// percentageToLetter — boundary tests
// ---------------------------------------------------------------------------
describe('percentageToLetter', () => {
  it('returns A for exactly 93', () => expect(percentageToLetter(93)).toBe('A'));
  it('returns A for 100', () => expect(percentageToLetter(100)).toBe('A'));
  it('returns A- for exactly 90', () => expect(percentageToLetter(90)).toBe('A-'));
  it('returns A- for 92.99', () => expect(percentageToLetter(92.99)).toBe('A-'));
  it('returns B+ for exactly 87', () => expect(percentageToLetter(87)).toBe('B+'));
  it('returns B+ for 89.99', () => expect(percentageToLetter(89.99)).toBe('B+'));
  it('returns B for exactly 83', () => expect(percentageToLetter(83)).toBe('B'));
  it('returns B- for exactly 80', () => expect(percentageToLetter(80)).toBe('B-'));
  it('returns C+ for exactly 77', () => expect(percentageToLetter(77)).toBe('C+'));
  it('returns C for exactly 73', () => expect(percentageToLetter(73)).toBe('C'));
  it('returns C- for exactly 70', () => expect(percentageToLetter(70)).toBe('C-'));
  it('returns D+ for exactly 67', () => expect(percentageToLetter(67)).toBe('D+'));
  it('returns D for exactly 63', () => expect(percentageToLetter(63)).toBe('D'));
  it('returns D- for exactly 60', () => expect(percentageToLetter(60)).toBe('D-'));
  it('returns D- for 60.01', () => expect(percentageToLetter(60.01)).toBe('D-'));
  it('returns F for exactly 59.99', () => expect(percentageToLetter(59.99)).toBe('F'));
  it('returns F for 0', () => expect(percentageToLetter(0)).toBe('F'));
});

// ---------------------------------------------------------------------------
// gradeToGPA
// ---------------------------------------------------------------------------
describe('gradeToGPA', () => {
  it('returns 4.0 for A range (93+)', () => expect(gradeToGPA(95)).toBe(4.0));
  it('returns 4.0 for exactly 93', () => expect(gradeToGPA(93)).toBe(4.0));
  it('returns 3.7 for A- (90–92.99)', () => expect(gradeToGPA(90)).toBe(3.7));
  it('returns 3.3 for B+ (87–89.99)', () => expect(gradeToGPA(87)).toBe(3.3));
  it('returns 3.0 for B (83–86.99)', () => expect(gradeToGPA(83)).toBe(3.0));
  it('returns 2.7 for B- (80–82.99)', () => expect(gradeToGPA(80)).toBe(2.7));
  it('returns 2.3 for C+ (77–79.99)', () => expect(gradeToGPA(77)).toBe(2.3));
  it('returns 2.0 for C (73–76.99)', () => expect(gradeToGPA(73)).toBe(2.0));
  it('returns 1.7 for C- (70–72.99)', () => expect(gradeToGPA(70)).toBe(1.7));
  it('returns 1.3 for D+ (67–69.99)', () => expect(gradeToGPA(67)).toBe(1.3));
  it('returns 1.0 for D (63–66.99)', () => expect(gradeToGPA(63)).toBe(1.0));
  it('returns 0.7 for D- (60–62.99)', () => expect(gradeToGPA(60)).toBe(0.7));
  it('returns 0.0 for F (< 60)', () => expect(gradeToGPA(55)).toBe(0.0));
  it('returns 0.0 for exactly 59.99', () => expect(gradeToGPA(59.99)).toBe(0.0));
});

// ---------------------------------------------------------------------------
// Custom grading scales
// ---------------------------------------------------------------------------
const TEN_POINT_SCALE: Record<string, number> = { A: 90, B: 80, C: 70, D: 60, F: 0 };
const SEVEN_POINT_SCALE: Record<string, number> = { A: 93, B: 86, C: 79, D: 70, F: 0 };
const PLUS_MINUS_SCALE: Record<string, number> = {
  A: 93, 'A-': 90, 'B+': 87, B: 83, 'B-': 80,
  'C+': 77, C: 73, 'C-': 70, 'D+': 67, D: 63, 'D-': 60, F: 0,
};

describe('percentageToLetter — custom grading scale', () => {
  it('uses custom 10-point scale: 90 → A', () =>
    expect(percentageToLetter(90, TEN_POINT_SCALE)).toBe('A'));
  it('uses custom 10-point scale: 89.99 → B', () =>
    expect(percentageToLetter(89.99, TEN_POINT_SCALE)).toBe('B'));
  it('uses custom 10-point scale: 80 → B', () =>
    expect(percentageToLetter(80, TEN_POINT_SCALE)).toBe('B'));
  it('uses custom 10-point scale: 70 → C', () =>
    expect(percentageToLetter(70, TEN_POINT_SCALE)).toBe('C'));
  it('uses custom 10-point scale: 60 → D', () =>
    expect(percentageToLetter(60, TEN_POINT_SCALE)).toBe('D'));
  it('uses custom 10-point scale: 59 → F', () =>
    expect(percentageToLetter(59, TEN_POINT_SCALE)).toBe('F'));
  it('uses custom 7-point scale: 93 → A', () =>
    expect(percentageToLetter(93, SEVEN_POINT_SCALE)).toBe('A'));
  it('uses custom 7-point scale: 85 → C (below B threshold of 86)', () =>
    expect(percentageToLetter(85, SEVEN_POINT_SCALE)).toBe('C'));
  it('uses custom 7-point scale: 86 → B (at B threshold)', () =>
    expect(percentageToLetter(86, SEVEN_POINT_SCALE)).toBe('B'));
  it('falls back to default when scale is empty', () =>
    expect(percentageToLetter(93, {})).toBe('A'));
  it('custom plus-minus scale matches default for 93', () =>
    expect(percentageToLetter(93, PLUS_MINUS_SCALE)).toBe('A'));
  it('custom plus-minus scale matches default for 90', () =>
    expect(percentageToLetter(90, PLUS_MINUS_SCALE)).toBe('A-'));
});

describe('gradeToGPA — custom grading scale', () => {
  it('10-point scale: 90 → 4.0 (A)', () =>
    expect(gradeToGPA(90, TEN_POINT_SCALE)).toBe(4.0));
  it('10-point scale: 89 → 3.0 (B)', () =>
    expect(gradeToGPA(89, TEN_POINT_SCALE)).toBe(3.0));
  it('10-point scale: 70 → 2.0 (C)', () =>
    expect(gradeToGPA(70, TEN_POINT_SCALE)).toBe(2.0));
  it('10-point scale: 60 → 1.0 (D)', () =>
    expect(gradeToGPA(60, TEN_POINT_SCALE)).toBe(1.0));
  it('10-point scale: 59 → 0.0 (F)', () =>
    expect(gradeToGPA(59, TEN_POINT_SCALE)).toBe(0.0));
});

// ---------------------------------------------------------------------------
// calculateCourseGrade
// ---------------------------------------------------------------------------
describe('calculateCourseGrade', () => {
  it('returns 0 when no assignments', () => {
    expect(calculateCourseGrade([])).toBe(0);
  });

  it('returns 0 when no assignments are graded', () => {
    const assignments = [
      makeUngradedAssignment('1', 50),
      makeUngradedAssignment('2', 50),
    ];
    expect(calculateCourseGrade(assignments)).toBe(0);
  });

  it('returns the score for a single graded assignment', () => {
    const assignments = [makeGradedAssignment('1', 100, 85)];
    expect(calculateCourseGrade(assignments)).toBe(85);
  });

  it('computes a weighted average for equal-weight assignments', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 80),
      makeGradedAssignment('2', 50, 90),
    ];
    expect(calculateCourseGrade(assignments)).toBeCloseTo(85, 5);
  });

  it('weights higher-weight assignments more heavily', () => {
    const assignments = [
      makeGradedAssignment('1', 20, 60),  // 60% score, 20% weight
      makeGradedAssignment('2', 80, 100), // 100% score, 80% weight
    ];
    // Expected: (60*20 + 100*80) / 100 = (1200 + 8000) / 100 = 92
    expect(calculateCourseGrade(assignments)).toBeCloseTo(92, 5);
  });

  it('ignores ungraded assignments in the calculation', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 80),
      makeUngradedAssignment('2', 50),
    ];
    // Only graded assignment counts: 80%
    expect(calculateCourseGrade(assignments)).toBeCloseTo(80, 5);
  });

  it('returns 100 when all assignments are perfect', () => {
    const assignments = [
      makeGradedAssignment('1', 40, 100),
      makeGradedAssignment('2', 60, 100),
    ];
    expect(calculateCourseGrade(assignments)).toBe(100);
  });

  it('returns 0 when all grades are 0', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 0),
      makeGradedAssignment('2', 50, 0),
    ];
    expect(calculateCourseGrade(assignments)).toBe(0);
  });

  it('handles assignments with zero weight (should not divide by zero)', () => {
    const assignments = [makeAssignment({ id: '1', name: 'A', type: 'homework', weight: 0, score: 90 })];
    // totalWeight = 0, should return 0 not NaN/Infinity
    expect(calculateCourseGrade(assignments)).toBe(0);
  });

  it('handles mixed graded and ungraded with non-uniform weights', () => {
    const assignments = [
      makeGradedAssignment('1', 30, 75),   // graded
      makeGradedAssignment('2', 20, 90),   // graded
      makeUngradedAssignment('3', 50),     // not graded
    ];
    // normalizes against graded weight only: (75*30 + 90*20) / 50 = (2250+1800)/50 = 81
    expect(calculateCourseGrade(assignments)).toBeCloseTo(81, 5);
  });
});

// ---------------------------------------------------------------------------
// projectFinalGrade
// ---------------------------------------------------------------------------
describe('projectFinalGrade', () => {
  it('returns 0 when no assignments', () => {
    expect(projectFinalGrade([], {})).toBe(0);
  });

  it('uses actual score for graded assignments (locked)', () => {
    const assignments = [makeGradedAssignment('1', 100, 75)];
    // Hypothetical for assignment 1 should be ignored since it's already graded
    expect(projectFinalGrade(assignments, { '1': 100 })).toBeCloseTo(75, 5);
  });

  it('uses hypothetical score for ungraded assignments', () => {
    const assignments = [makeUngradedAssignment('1', 100)];
    expect(projectFinalGrade(assignments, { '1': 90 })).toBeCloseTo(90, 5);
  });

  it('combines actual and hypothetical scores correctly', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 80), // locked at 80
      makeUngradedAssignment('2', 50),   // hypothetical 90
    ];
    // (80*50 + 90*50) / 100 = (4000 + 4500) / 100 = 85
    expect(projectFinalGrade(assignments, { '2': 90 })).toBeCloseTo(85, 5);
  });

  it('excludes ungraded assignments with no hypothetical from denominator', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 80),
      makeUngradedAssignment('2', 50), // no hypothetical set
    ];
    // Only assignment 1 counts: 80
    expect(projectFinalGrade(assignments, {})).toBeCloseTo(80, 5);
  });
});

// ---------------------------------------------------------------------------
// calculateRequiredScore
// ---------------------------------------------------------------------------
describe('calculateRequiredScore', () => {
  it('returns null when all assignments are graded', () => {
    const assignments = [
      makeGradedAssignment('1', 60, 80),
      makeGradedAssignment('2', 40, 90),
    ];
    expect(calculateRequiredScore(assignments, 85, {})).toBeNull();
  });

  it('returns null when there are no assignments', () => {
    expect(calculateRequiredScore([], 85, {})).toBeNull();
  });

  it('calculates the required score for one remaining assignment', () => {
    const assignments = [
      makeGradedAssignment('1', 60, 80), // earned 48 points
      makeUngradedAssignment('2', 40),   // need this to reach target
    ];
    // target = 90, earned = 80 * 0.6 = 48, other = 0
    // required = (90 - 48) / 0.4 = 42 / 0.4 = 105 → impossible
    const result = calculateRequiredScore(assignments, 90, {});
    expect(result).not.toBeNull();
    expect(result!.requiredScore).toBeCloseTo(105, 0);
    expect(result!.possible).toBe(false);
  });

  it('marks as possible when required score is 0–100', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 85),
      makeUngradedAssignment('2', 50),
    ];
    // target = 88, earned = 85*0.5 = 42.5, other = 0
    // required = (88 - 42.5) / 0.5 = 45.5 / 0.5 = 91
    const result = calculateRequiredScore(assignments, 88, {});
    expect(result).not.toBeNull();
    expect(result!.requiredScore).toBeCloseTo(91, 0);
    expect(result!.possible).toBe(true);
  });

  it('targets the highest-weight ungraded assignment', () => {
    const assignments = [
      makeGradedAssignment('1', 20, 90),
      makeUngradedAssignment('2', 30),  // lower weight
      makeUngradedAssignment('3', 50),  // highest weight — this is the target
    ];
    const result = calculateRequiredScore(assignments, 85, {});
    expect(result).not.toBeNull();
    expect(result!.assignmentName).toBe('A3'); // highest weight is A3
  });

  it('uses hypotheticalScores for other ungraded assignments', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 70),       // earned 35 points
      makeUngradedAssignment('2', 25),          // other (default 85)
      makeUngradedAssignment('3', 25),          // target
    ];
    // earned = 70*0.5 = 35
    // other (A2 slider at default 85): 85*0.25 = 21.25
    // target = 90: required = (90 - 35 - 21.25) / 0.25 = 33.75 / 0.25 = 135
    const result = calculateRequiredScore(assignments, 90, {});
    expect(result!.possible).toBe(false);
    // But if we set a lower hypothetical for A2:
    const resultWithSlider = calculateRequiredScore(assignments, 90, { '2': 70 });
    // other = 70*0.25 = 17.5
    // required = (90 - 35 - 17.5) / 0.25 = 37.5 / 0.25 = 150 → still impossible
    expect(resultWithSlider!.possible).toBe(false);
  });

  it('returns a possible score for a low target', () => {
    const assignments = [
      makeGradedAssignment('1', 70, 85),
      makeUngradedAssignment('2', 30),
    ];
    // target = 70, earned = 85*0.7 = 59.5, other = 0
    // required = (70 - 59.5) / 0.3 = 10.5 / 0.3 = 35
    const result = calculateRequiredScore(assignments, 70, {});
    expect(result!.requiredScore).toBeCloseTo(35, 0);
    expect(result!.possible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAssignmentStatus
// ---------------------------------------------------------------------------
describe('getAssignmentStatus', () => {
  it('returns graded when score is set', () => {
    const a = makeGradedAssignment('1', 10, 85);
    expect(getAssignmentStatus(a)).toBe('graded');
  });

  it('returns upcoming when no due date', () => {
    const a = makeUngradedAssignment('1', 10);
    expect(getAssignmentStatus(a)).toBe('upcoming');
  });

  it('returns overdue for past due date', () => {
    const a = makeUngradedAssignment('1', 10);
    a.dueDate = '2020-01-01';
    expect(getAssignmentStatus(a)).toBe('overdue');
  });

  it('returns due-soon for within 2 days', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const a = makeUngradedAssignment('1', 10);
    a.dueDate = tomorrow.toISOString().split('T')[0];
    expect(getAssignmentStatus(a)).toBe('due-soon');
  });

  it('returns upcoming for due date > 2 days away', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const a = makeUngradedAssignment('1', 10);
    a.dueDate = future.toISOString().split('T')[0];
    expect(getAssignmentStatus(a)).toBe('upcoming');
  });
});

// ---------------------------------------------------------------------------
// calculateCourseProgress
// ---------------------------------------------------------------------------
describe('calculateCourseProgress', () => {
  it('returns 0 for empty assignments', () => {
    expect(calculateCourseProgress([])).toBe(0);
  });

  it('returns 50 when half are graded', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 80),
      makeUngradedAssignment('2', 50),
    ];
    expect(calculateCourseProgress(assignments)).toBe(50);
  });

  it('returns 100 when all are graded', () => {
    const assignments = [
      makeGradedAssignment('1', 50, 80),
      makeGradedAssignment('2', 50, 90),
    ];
    expect(calculateCourseProgress(assignments)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// calculateGPA (multi-course)
// ---------------------------------------------------------------------------
describe('calculateGPA', () => {
  function makeCourse(id: string, credits: number, assignments: Assignment[]): Course {
    return {
      id,
      semesterId: 'spring-2026',
      code: `CS${id}`,
      name: `Course ${id}`,
      credits,
      color: '#000',
      assignments,
    };
  }

  it('returns 0 for empty courses list', () => {
    expect(calculateGPA([])).toBe(0);
  });

  it('returns 0 for courses with no graded assignments', () => {
    const courses = [makeCourse('1', 3, [makeUngradedAssignment('a', 100)])];
    expect(calculateGPA(courses)).toBe(0);
  });

  it('returns correct GPA for a single A course', () => {
    const courses = [makeCourse('1', 3, [makeGradedAssignment('a', 100, 95)])];
    expect(calculateGPA(courses)).toBe(4.0);
  });

  it('computes credit-weighted GPA correctly', () => {
    // Course A: 95% = 4.0 GPA, 4 credits
    // Course B: 83% = 3.0 GPA, 2 credits
    // Weighted avg: (4.0*4 + 3.0*2) / 6 = (16+6)/6 = 22/6 ≈ 3.667
    const courses = [
      makeCourse('1', 4, [makeGradedAssignment('a', 100, 95)]),
      makeCourse('2', 2, [makeGradedAssignment('b', 100, 83)]),
    ];
    expect(calculateGPA(courses)).toBeCloseTo(22 / 6, 3);
  });
});
