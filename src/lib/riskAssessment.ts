// lib/riskAssessment.ts - Grade Risk Assessment System

import { Assignment, Course } from '@/types';
import { calculateCourseGrade } from '@/lib/gradeUtils';
import { capitalize } from '@/lib/utils';

export interface RiskFactor {
  name: string;
  impact: number; // 0-100
  description: string;
  actionable: boolean;
}

export interface CourseRisk {
  courseId: string;
  courseCode: string;
  courseName: string;
  courseColor: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  primaryConcern: string;
  recommendation: string;
  trend: 'improving' | 'stable' | 'declining';
  daysUntilNextDeadline: number | null;
  upcomingWeight: number; // Weight of upcoming assignments
  currentGrade: number;
}

interface GradeHistoryEntry {
  date: string;
  grade: number;
}

// Generate synthetic grade history based on assignment dates
function generateGradeHistory(assignments: Assignment[]): GradeHistoryEntry[] {
  const gradedAssignments = assignments
    .filter(a => a.score !== null && a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  
  if (gradedAssignments.length < 2) return [];
  
  const history: GradeHistoryEntry[] = [];
  let runningAssignments: Assignment[] = [];
  
  for (const assignment of gradedAssignments) {
    runningAssignments.push(assignment);
    const grade = calculateCourseGrade(runningAssignments);
    history.push({
      date: assignment.dueDate!,
      grade,
    });
  }
  
  return history;
}

export function calculateCourseRisk(course: Course): CourseRisk {
  const factors: RiskFactor[] = [];
  let totalRisk = 0;
  
  const currentGrade = calculateCourseGrade(course.assignments);
  const passingGrade = 60; // Default passing grade
  const targetGrade = 80; // Default target (B)
  const assignments = course.assignments;
  const gradeHistory = generateGradeHistory(assignments);
  
  // Get completed and remaining assignments
  const completedAssignments = assignments.filter(a => a.score !== null);
  const remainingAssignments = assignments.filter(a => a.score === null);
  const completedWeight = completedAssignments.reduce((sum, a) => sum + a.weight, 0);
  const remainingWeight = remainingAssignments.reduce((sum, a) => sum + a.weight, 0);
  
  // ============================================
  // RISK FACTOR 1: Current Grade Position
  // ============================================
  if (currentGrade > 0) {
    if (currentGrade < passingGrade) {
      // Below passing - CRITICAL
      const severity = Math.min((passingGrade - currentGrade) * 3, 40);
      factors.push({
        name: 'Below Passing',
        impact: severity,
        description: `Currently ${(passingGrade - currentGrade).toFixed(1)}% below passing grade`,
        actionable: true,
      });
      totalRisk += severity;
    } else if (currentGrade < passingGrade + 5) {
      // Dangerously close to failing
      factors.push({
        name: 'Near Failing Threshold',
        impact: 25,
        description: `Only ${(currentGrade - passingGrade).toFixed(1)}% above passing`,
        actionable: true,
      });
      totalRisk += 25;
    } else if (currentGrade < 70) {
      // D range
      factors.push({
        name: 'D Range Grade',
        impact: 15,
        description: 'Grade is in the D range',
        actionable: true,
      });
      totalRisk += 15;
    } else if (currentGrade < 80) {
      // C range - minor concern
      factors.push({
        name: 'C Range Grade',
        impact: 5,
        description: 'Grade is in the C range',
        actionable: true,
      });
      totalRisk += 5;
    }
  }
  
  // ============================================
  // RISK FACTOR 2: Grade Trend
  // ============================================
  const trend = calculateTrend(gradeHistory);
  
  if (trend === 'declining') {
    const recentGrades = gradeHistory.slice(-3);
    if (recentGrades.length >= 2) {
      const decline = recentGrades[0].grade - recentGrades[recentGrades.length - 1].grade;
      if (decline > 0) {
        const severity = Math.min(decline * 2, 25);
        factors.push({
          name: 'Declining Performance',
          impact: severity,
          description: `Grade has dropped ${decline.toFixed(1)}% recently`,
          actionable: true,
        });
        totalRisk += severity;
      }
    }
  }
  
  // ============================================
  // RISK FACTOR 3: Upcoming High-Weight Assignments
  // ============================================
  const upcomingHighWeight = remainingAssignments.filter(a => a.weight >= 15);
  
  // Check for imminent high-stakes assignments
  const now = new Date();
  const imminentHighWeight = upcomingHighWeight.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });
  
  if (imminentHighWeight.length > 0) {
    const totalImminentWeight = imminentHighWeight.reduce((sum, a) => sum + a.weight, 0);
    const severity = Math.min(totalImminentWeight * 0.8, 20);
    
    const assignmentNames = imminentHighWeight.map(a => a.name).join(', ');
    factors.push({
      name: 'High-Stakes Deadline Approaching',
      impact: severity,
      description: `${assignmentNames} (${totalImminentWeight}% weight) due within 7 days`,
      actionable: true,
    });
    totalRisk += severity;
  }
  
  // ============================================
  // RISK FACTOR 4: Category Weakness + Upcoming Category
  // ============================================
  const categoryPerformance = getCategoryPerformance(completedAssignments);
  const upcomingCategories = [...new Set(remainingAssignments.map(a => a.type))];
  
  // Check if weak category has upcoming assignments
  for (const category of upcomingCategories) {
    const avgInCategory = categoryPerformance[category];
    if (avgInCategory && avgInCategory < 75) {
      const upcomingInCategory = remainingAssignments.filter(a => a.type === category);
      const upcomingCategoryWeight = upcomingInCategory.reduce((sum, a) => sum + a.weight, 0);
      
      if (upcomingCategoryWeight >= 10) {
        const severity = Math.min((75 - avgInCategory) * 0.5 + upcomingCategoryWeight * 0.3, 20);
        factors.push({
          name: `Weak in ${capitalize(category)}s`,
          impact: severity,
          description: `${avgInCategory.toFixed(0)}% avg in ${category}s, ${upcomingCategoryWeight}% upcoming`,
          actionable: true,
        });
        totalRisk += severity;
      }
    }
  }
  
  // ============================================
  // RISK FACTOR 5: Low Course Completion
  // ============================================
  if (completedWeight < 30 && remainingWeight > 50) {
    factors.push({
      name: 'Early Semester Uncertainty',
      impact: 10,
      description: `Only ${completedWeight.toFixed(0)}% of grade determined so far`,
      actionable: false,
    });
    totalRisk += 10;
  }
  
  // ============================================
  // RISK FACTOR 6: Gap to Target Grade
  // ============================================
  if (currentGrade > 0 && targetGrade > currentGrade) {
    const gap = targetGrade - currentGrade;
    if (gap > 15) {
      factors.push({
        name: 'Far From Target',
        impact: Math.min(gap * 0.5, 15),
        description: `${gap.toFixed(1)}% below your target grade of ${targetGrade}%`,
        actionable: true,
      });
      totalRisk += Math.min(gap * 0.5, 15);
    }
  }
  
  // ============================================
  // RISK FACTOR 7: Missing Assignments
  // ============================================
  const missingAssignments = assignments.filter(a => {
    if (!a.dueDate || a.score !== null) return false;
    return new Date(a.dueDate) < now;
  });
  
  if (missingAssignments.length > 0) {
    const missingWeight = missingAssignments.reduce((sum, a) => sum + a.weight, 0);
    factors.push({
      name: 'Missing Assignments',
      impact: Math.min(missingWeight * 2, 30),
      description: `${missingAssignments.length} overdue assignment(s) worth ${missingWeight}%`,
      actionable: true,
    });
    totalRisk += Math.min(missingWeight * 2, 30);
  }
  
  // ============================================
  // Cap total risk at 100
  // ============================================
  totalRisk = Math.min(totalRisk, 100);
  
  // Determine risk level
  let riskLevel: CourseRisk['riskLevel'];
  if (totalRisk >= 70) riskLevel = 'critical';
  else if (totalRisk >= 45) riskLevel = 'high';
  else if (totalRisk >= 25) riskLevel = 'medium';
  else riskLevel = 'low';
  
  // Sort factors by impact
  factors.sort((a, b) => b.impact - a.impact);
  
  // Generate primary concern and recommendation
  const primaryConcern = factors.length > 0 
    ? factors[0].description 
    : 'No major concerns';
    
  const recommendation = generateRecommendation(factors, course, riskLevel);
  
  // Calculate days until next deadline
  const nextDeadline = remainingAssignments
    .filter(a => a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
  
  const daysUntilNextDeadline = nextDeadline?.dueDate
    ? Math.ceil((new Date(nextDeadline.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return {
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    courseColor: course.color,
    riskScore: Math.round(totalRisk),
    riskLevel,
    factors,
    primaryConcern,
    recommendation,
    trend,
    daysUntilNextDeadline,
    upcomingWeight: remainingWeight,
    currentGrade,
  };
}

// Helper functions
function calculateTrend(history: GradeHistoryEntry[]): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(-5);
  const firstGrade = recent[0].grade;
  const lastGrade = recent[recent.length - 1].grade;
  const change = lastGrade - firstGrade;
  
  if (change > 3) return 'improving';
  if (change < -3) return 'declining';
  return 'stable';
}

function getCategoryPerformance(assignments: Assignment[]): Record<string, number> {
  const byCategory: Record<string, number[]> = {};
  
  for (const a of assignments) {
    if (a.score === null) continue;
    if (!byCategory[a.type]) byCategory[a.type] = [];
    byCategory[a.type].push(a.score);
  }
  
  const result: Record<string, number> = {};
  for (const [category, scores] of Object.entries(byCategory)) {
    result[category] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
  
  return result;
}

function generateRecommendation(
  factors: RiskFactor[], 
  course: Course, 
  riskLevel: CourseRisk['riskLevel']
): string {
  if (riskLevel === 'critical') {
    return `Immediate action required. Focus all available study time on ${course.code}. Consider office hours, tutoring, or study groups.`;
  }
  
  if (riskLevel === 'high') {
    if (factors.some(f => f.name.includes('Declining'))) {
      return `Your performance is trending down. Review recent material and identify gaps. Increase study time this week.`;
    }
    if (factors.some(f => f.name.includes('Deadline'))) {
      return `High-stakes assignment approaching. Create a focused study plan and start preparation immediately.`;
    }
    return `This course needs attention. Prioritize it in your study schedule and aim for strong scores on upcoming work.`;
  }
  
  if (riskLevel === 'medium') {
    return `Monitor this course closely. Maintain consistent study habits and don't let assignments pile up.`;
  }
  
  return `You're on track. Continue your current approach and stay consistent.`;
}

// Calculate risk for all courses and sort by priority
export function calculateAllCourseRisks(courses: Course[]): CourseRisk[] {
  return courses
    .map(course => calculateCourseRisk(course))
    .sort((a, b) => b.riskScore - a.riskScore);
}

// Get risk level color
/** Returns a CSS variable color string that respects the active theme. */
export function getRiskLevelColor(level: CourseRisk['riskLevel']): string {
  switch (level) {
    case 'critical': return 'var(--error, #EF4444)';
    case 'high': return 'var(--warning, #F59E0B)';
    case 'medium': return 'var(--chart-4, #EAB308)';
    case 'low': return 'var(--success, #10B981)';
    default: return 'var(--success, #10B981)';
  }
}

/** Returns a Tailwind text-color class for the risk level. */
export function getRiskLevelClass(level: CourseRisk['riskLevel']): string {
  switch (level) {
    case 'critical': return 'text-error';
    case 'high': return 'text-warning';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-success';
    default: return 'text-success';
  }
}
