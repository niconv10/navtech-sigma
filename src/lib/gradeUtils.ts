import type { Assignment, Course } from '@/types';

// GPA lookup table — handles all standard letter grades including +/- variants
const GPA_MAP: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

// Percentage to letter grade.
// Pass a custom grading scale (Record<letter, minPercentage>) to override the
// default 10-point +/- scale.  Call sites without a scale continue to work
// identically — the parameter is optional and backward-compatible.
export function percentageToLetter(
  percentage: number,
  gradingScale?: Record<string, number>
): string {
  if (gradingScale && Object.keys(gradingScale).length > 0) {
    // Sort thresholds descending so the first match is the highest grade earned
    const entries = Object.entries(gradingScale).sort(([, a], [, b]) => b - a);
    for (const [letter, min] of entries) {
      if (percentage >= min) return letter;
    }
    return 'F';
  }
  // Default 10-point +/- scale
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

// Grade to GPA conversion.
// Pass the same optional grading scale to compute GPA relative to the course's
// own thresholds rather than the hardcoded default.
export function gradeToGPA(
  percentage: number,
  gradingScale?: Record<string, number>
): number {
  const letter = percentageToLetter(percentage, gradingScale);
  if (letter in GPA_MAP) return GPA_MAP[letter];
  // Unknown letter (e.g., institution-specific like 'S'/'U') — treat as 0
  return 0.0;
}

// Calculate course grade from assignments (weighted)
export function calculateCourseGrade(assignments: Assignment[]): number {
  let totalEarned = 0;
  let totalWeight = 0;

  assignments.forEach((a) => {
    // Skip archived assignments — they've been removed from the syllabus but
    // their grade data is preserved for reference only.
    if (a.archived) return;
    if (a.score !== null && a.score !== undefined) {
      totalEarned += (a.score / 100) * a.weight;
      totalWeight += a.weight;
    }
  });

  return totalWeight > 0 ? (totalEarned / totalWeight) * 100 : 0;
}

// Calculate GPA from multiple courses, respecting each course's custom grading scale
export function calculateGPA(courses: Course[]): number {
  let totalPoints = 0;
  let totalCredits = 0;

  courses.forEach((course) => {
    const gradePercent = calculateCourseGrade(course.assignments);
    // Only count if course has graded assignments
    if (gradePercent > 0 && course.credits > 0) {
      totalPoints += gradeToGPA(gradePercent, course.gradingScale) * course.credits;
      totalCredits += course.credits;
    }
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// Get assignment status based on due date
export function getAssignmentStatus(
  assignment: Assignment
): 'graded' | 'due-soon' | 'overdue' | 'upcoming' {
  if (assignment.score !== null) return 'graded';
  
  if (!assignment.dueDate) return 'upcoming';
  
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'due-soon';
  return 'upcoming';
}

// Calculate course completion percentage
export function calculateCourseProgress(assignments: Assignment[]): number {
  if (assignments.length === 0) return 0;
  const graded = assignments.filter((a) => a.score !== null).length;
  return (graded / assignments.length) * 100;
}

// Get counts by assignment status
export function getAssignmentCounts(courses: Course[]) {
  const allAssignments = courses.flatMap((c) => c.assignments);
  
  return {
    total: allAssignments.length,
    completed: allAssignments.filter((a) => a.score !== null).length,
    dueSoon: allAssignments.filter((a) => getAssignmentStatus(a) === 'due-soon').length,
    overdue: allAssignments.filter((a) => getAssignmentStatus(a) === 'overdue').length,
    upcoming: allAssignments.filter((a) => getAssignmentStatus(a) === 'upcoming').length,
  };
}

// What-if calculation: project final grade with hypothetical scores for UNGRADED assignments only
export function projectFinalGrade(
  assignments: Assignment[],
  hypotheticalScores: Record<string, number>
): number {
  let totalEarned = 0;
  let totalWeight = 0;

  assignments.forEach((a) => {
    if (a.score !== null) {
      // Graded assignment - use actual score (locked)
      totalEarned += (a.weight / 100) * a.score;
      totalWeight += a.weight;
    } else if (hypotheticalScores[a.id] !== undefined) {
      // Ungraded with hypothetical score set
      totalEarned += (a.weight / 100) * hypotheticalScores[a.id];
      totalWeight += a.weight;
    }
    // Ungraded without hypothetical score - don't count
  });

  return totalWeight > 0 ? (totalEarned / totalWeight) * 100 : 0;
}

// Calculate what score is needed on the highest-weight ungraded assignment to reach a target grade
// Uses CURRENT hypothetical slider values for other ungraded assignments
export function calculateRequiredScore(
  assignments: Assignment[],
  targetGrade: number,
  hypotheticalScores: Record<string, number>
): { assignmentName: string; requiredScore: number; possible: boolean } | null {
  // Find ungraded assignments
  const ungradedAssignments = assignments.filter(a => a.score === null);
  if (ungradedAssignments.length === 0) return null;

  // Find the highest-weight ungraded assignment (the one we solve for)
  const targetAssignment = [...ungradedAssignments].sort((a, b) => b.weight - a.weight)[0];

  // Calculate points already EARNED from graded assignments (fixed, doesn't change)
  let earnedPoints = 0;
  for (const a of assignments) {
    if (a.score !== null) {
      earnedPoints += (a.weight / 100) * a.score;
    }
  }

  // Calculate expected points from OTHER ungraded assignments (uses current slider values!)
  let otherExpectedPoints = 0;
  for (const a of ungradedAssignments) {
    if (a.id !== targetAssignment.id) {
      // Use current slider value, default to 85 if not set
      const score = hypotheticalScores[a.id] ?? 85;
      otherExpectedPoints += (a.weight / 100) * score;
    }
  }

  // Formula: targetGrade = earnedPoints + otherExpectedPoints + (targetWeight/100) * requiredScore
  // Solve for requiredScore:
  // requiredScore = (targetGrade - earnedPoints - otherExpectedPoints) / (targetWeight/100)
  
  const pointsNeeded = targetGrade - earnedPoints - otherExpectedPoints;
  const requiredScore = pointsNeeded / (targetAssignment.weight / 100);

  return {
    assignmentName: targetAssignment.name,
    requiredScore: Math.round(requiredScore * 10) / 10,
    possible: requiredScore <= 100 && requiredScore >= 0
  };
}
export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-success';
  if (grade.startsWith('B')) return 'text-info';
  if (grade.startsWith('C')) return 'text-warning';
  return 'text-error';
}

// Format assignment type for display
export function formatAssignmentType(type: string): string {
  const typeMap: Record<string, string> = {
    exam: 'Exam',
    quiz: 'Quiz',
    homework: 'Homework',
    project: 'Project',
    paper: 'Paper',
    lab: 'Lab',
    discussion: 'Discussion',
    participation: 'Participation',
    other: 'Other',
  };
  return typeMap[type] || type;
}

// Round points to 2 decimal places max
export function formatPoints(points: number): string {
  const rounded = Math.round(points * 100) / 100;
  // Remove trailing zeros
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '');
}
