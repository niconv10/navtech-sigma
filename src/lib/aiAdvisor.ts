// lib/aiAdvisor.ts - AI Academic Advisor System

import { Course, Assignment } from '@/types';
import { CourseRisk, calculateCourseRisk } from './riskAssessment';
import { GradePrediction, predictFinalGrade } from './gradePrediction';
import { calculateCourseGrade, percentageToLetter } from './gradeUtils';
import { capitalize } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export type InsightType = 
  | 'priority-alert'      // Urgent action needed
  | 'opportunity'         // Extra credit, grade bump possible
  | 'pattern'             // Behavioral pattern detected
  | 'study-recommendation'// Study time allocation
  | 'grade-path'          // Path to target grade
  | 'celebration'         // Positive achievement
  | 'weekly-tip'          // General weekly advice
  | 'deadline-warning'    // Upcoming deadline
  | 'trend-alert';        // Performance trend

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  details?: string;
  courseId?: string;
  courseCode?: string;
  courseColor?: string;
  actionLabel?: string;
  actionLink?: string;
  icon: string;
  timestamp: Date;
  isRead: boolean;
  category: 'grades' | 'study' | 'deadlines' | 'achievements' | 'general';
}

export interface WeeklyDigest {
  weekStart: Date;
  weekEnd: Date;
  summary: {
    studyHours: number;
    assignmentsCompleted: number;
    averageScore: number;
    classesAttended?: number;
  };
  highlights: string[];
  concerns: string[];
  upcomingPriorities: UpcomingPriority[];
  recommendedFocus: RecommendedFocus[];
  overallSentiment: 'excellent' | 'good' | 'needs-attention' | 'critical';
}

export interface UpcomingPriority {
  assignmentId: string;
  assignmentName: string;
  courseCode: string;
  courseColor: string;
  dueDate: Date;
  weight: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface RecommendedFocus {
  courseId: string;
  courseCode: string;
  courseColor: string;
  recommendedHours: number;
  reason: string;
  priority: number;
}

export interface StudyPlan {
  date: Date;
  blocks: StudyBlock[];
  totalHours: number;
}

export interface StudyBlock {
  courseId: string;
  courseCode: string;
  courseColor: string;
  duration: number; // minutes
  focus: string;
  reason: string;
}

interface Pattern {
  id: string;
  title: string;
  message: string;
  suggestion: string;
  isPositive: boolean;
  category: 'grades' | 'study' | 'deadlines' | 'achievements' | 'general';
}

interface StudyData {
  totalHours: number;
  byDay: Record<string, number>;
  byCourse: Record<string, number>;
}

// ============================================
// MAIN INSIGHT GENERATOR
// ============================================

export function generateAIInsights(courses: Course[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date();
  
  // Calculate risk and predictions for all courses
  const courseAnalysis = courses.map(course => ({
    course,
    risk: calculateCourseRisk(course),
    prediction: predictFinalGrade(course),
    currentGrade: calculateCourseGrade(course.assignments),
  }));
  
  // ============================================
  // 1. PRIORITY ALERTS (Critical/High Risk)
  // ============================================
  for (const { course, risk, currentGrade } of courseAnalysis) {
    if (risk.riskLevel === 'critical') {
      insights.push({
        id: `priority-${course.id}-${Date.now()}`,
        type: 'priority-alert',
        priority: 'critical',
        title: `🚨 ${course.code} Needs Immediate Attention`,
        message: `You're at ${currentGrade.toFixed(1)}% in ${course.code}, which puts you at risk of ${currentGrade < 60 ? 'failing' : 'a significant grade drop'}. ${risk.primaryConcern}.`,
        details: risk.recommendation,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        actionLabel: 'View Recovery Plan',
        actionLink: `/courses/${course.id}`,
        icon: '🚨',
        timestamp: now,
        isRead: false,
        category: 'grades',
      });
    } else if (risk.riskLevel === 'high') {
      insights.push({
        id: `priority-${course.id}-${Date.now()}`,
        type: 'priority-alert',
        priority: 'high',
        title: `⚠️ ${course.code} Requires Attention`,
        message: `Your ${course.code} grade (${currentGrade.toFixed(1)}%) needs focus. ${risk.primaryConcern}.`,
        details: risk.recommendation,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        actionLabel: 'See What You Need',
        actionLink: `/courses/${course.id}`,
        icon: '⚠️',
        timestamp: now,
        isRead: false,
        category: 'grades',
      });
    }
  }
  
  // ============================================
  // 2. DEADLINE WARNINGS
  // ============================================
  const allAssignments = courses.flatMap(course => 
    course.assignments
      .filter(a => a.score === null && a.dueDate)
      .map(a => ({ ...a, courseCode: course.code, courseColor: course.color, courseId: course.id }))
  );
  
  const upcomingHighWeight = allAssignments
    .filter(a => {
      const dueDate = new Date(a.dueDate!);
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0 && a.weight >= 10;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  
  for (const assignment of upcomingHighWeight.slice(0, 3)) {
    const dueDate = new Date(assignment.dueDate!);
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const urgency: InsightPriority = daysUntil <= 2 ? 'critical' : daysUntil <= 4 ? 'high' : 'medium';
    const timeText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    
    insights.push({
      id: `deadline-${assignment.id}-${Date.now()}`,
      type: 'deadline-warning',
      priority: urgency,
      title: `📅 ${assignment.name} Due ${timeText}`,
      message: `Your ${assignment.courseCode} ${assignment.name} (${assignment.weight}% of grade) is due ${timeText}. ${urgency === 'critical' ? 'This is a high-priority item!' : 'Make sure to allocate time for this.'}`,
      courseId: assignment.courseId,
      courseCode: assignment.courseCode,
      courseColor: assignment.courseColor,
      actionLabel: 'View Assignment',
      actionLink: `/courses/${assignment.courseId}`,
      icon: '📅',
      timestamp: now,
      isRead: false,
      category: 'deadlines',
    });
  }
  
  // ============================================
  // 3. OPPORTUNITIES (Grade Bumps, Extra Credit)
  // ============================================
  for (const { course, prediction, currentGrade } of courseAnalysis) {
    // Check if close to next letter grade
    const currentLetter = percentageToLetter(currentGrade);
    const nextGradeThreshold = getNextGradeThreshold(currentGrade);
    const gap = nextGradeThreshold - currentGrade;
    
    if (gap > 0 && gap <= 3 && currentGrade > 0) {
      const nextLetter = percentageToLetter(nextGradeThreshold);
      insights.push({
        id: `opportunity-${course.id}-${Date.now()}`,
        type: 'opportunity',
        priority: 'medium',
        title: `💡 ${course.code}: ${nextLetter} Within Reach`,
        message: `You're only ${gap.toFixed(1)}% away from a ${nextLetter} in ${course.code}! Strong performance on upcoming assignments could push you over.`,
        details: `Current: ${currentGrade.toFixed(1)}% (${currentLetter}) → Target: ${nextGradeThreshold}% (${nextLetter})`,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        actionLabel: 'Calculate What You Need',
        actionLink: `/courses/${course.id}`,
        icon: '💡',
        timestamp: now,
        isRead: false,
        category: 'grades',
      });
    }
    
    // Check for improving trend
    if (prediction.trend === 'improving' && prediction.trendStrength > 3) {
      insights.push({
        id: `trend-${course.id}-${Date.now()}`,
        type: 'celebration',
        priority: 'info',
        title: `📈 Great Progress in ${course.code}!`,
        message: `Your ${course.code} grade has been steadily improving. Keep up the momentum! You're on track for a ${prediction.mostLikely.letter}.`,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        icon: '📈',
        timestamp: now,
        isRead: false,
        category: 'achievements',
      });
    }
  }
  
  // ============================================
  // 4. PATTERN RECOGNITION
  // ============================================
  const patterns = detectPatterns(courses);
  
  for (const pattern of patterns) {
    insights.push({
      id: `pattern-${pattern.id}-${Date.now()}`,
      type: 'pattern',
      priority: pattern.isPositive ? 'info' : 'medium',
      title: pattern.title,
      message: pattern.message,
      details: pattern.suggestion,
      icon: pattern.isPositive ? '📊' : '🔍',
      timestamp: now,
      isRead: false,
      category: pattern.category,
    });
  }
  
  // ============================================
  // 5. STUDY RECOMMENDATIONS
  // ============================================
  const studyRecommendation = generateStudyRecommendation(courseAnalysis);
  
  if (studyRecommendation) {
    insights.push({
      id: `study-rec-${Date.now()}`,
      type: 'study-recommendation',
      priority: 'medium',
      title: '⏱️ This Week\'s Study Focus',
      message: studyRecommendation.summary,
      details: studyRecommendation.breakdown,
      actionLabel: 'View Full Plan',
      actionLink: '/advisor?tab=study',
      icon: '⏱️',
      timestamp: now,
      isRead: false,
      category: 'study',
    });
  }
  
  // ============================================
  // 6. WEEKLY TIP
  // ============================================
  const weeklyTip = getWeeklyTip();
  insights.push({
    id: `weekly-tip-${Date.now()}`,
    type: 'weekly-tip',
    priority: 'low',
    title: '💭 Tip of the Week',
    message: weeklyTip,
    icon: '💭',
    timestamp: now,
    isRead: false,
    category: 'general',
  });
  
  // Sort by priority
  const priorityOrder: Record<InsightPriority, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return insights;
}

// ============================================
// WEEKLY DIGEST GENERATOR
// ============================================

export function generateWeeklyDigest(courses: Course[]): WeeklyDigest {
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  
  const courseAnalysis = courses.map(course => ({
    course,
    risk: calculateCourseRisk(course),
    prediction: predictFinalGrade(course),
  }));
  
  // Calculate summary
  const completedThisWeek = courses.flatMap(c => 
    c.assignments.filter(a => 
      a.score !== null && a.dueDate && new Date(a.dueDate) >= weekStart
    )
  );
  
  const avgScore = completedThisWeek.length > 0
    ? completedThisWeek.reduce((sum, a) => sum + (a.score || 0), 0) / completedThisWeek.length
    : 0;
  
  // Highlights & concerns
  const highlights: string[] = [];
  const concerns: string[] = [];
  
  for (const { course, prediction } of courseAnalysis) {
    if (prediction.trend === 'improving') {
      highlights.push(`📈 ${course.code} is trending upward - great work!`);
    }
    if (prediction.trend === 'declining') {
      concerns.push(`📉 ${course.code} needs attention - your performance is declining`);
    }
  }
  
  const highScores = completedThisWeek.filter(a => (a.score || 0) >= 90);
  if (highScores.length > 0) {
    highlights.push(`🌟 You scored 90%+ on ${highScores.length} assignment${highScores.length > 1 ? 's' : ''}!`);
  }
  
  const atRiskCourses = courseAnalysis.filter(c => 
    c.risk.riskLevel === 'critical' || c.risk.riskLevel === 'high'
  );
  if (atRiskCourses.length > 0) {
    concerns.push(`⚠️ ${atRiskCourses.length} course${atRiskCourses.length > 1 ? 's need' : ' needs'} immediate attention`);
  }
  
  // Upcoming priorities
  const upcomingPriorities: UpcomingPriority[] = courses
    .flatMap(course => 
      course.assignments
        .filter(a => a.score === null && a.dueDate)
        .map(a => {
          const dueDate = new Date(a.dueDate!);
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          let priority: UpcomingPriority['priority'] = 'low';
          let reason = '';
          
          if (daysUntil <= 2 && a.weight >= 10) {
            priority = 'critical';
            reason = `Due very soon, worth ${a.weight}%`;
          } else if (daysUntil <= 5 && a.weight >= 15) {
            priority = 'high';
            reason = `High-weight assignment due this week`;
          } else if (a.weight >= 20) {
            priority = 'high';
            reason = `Major assignment worth ${a.weight}%`;
          } else if (daysUntil <= 7) {
            priority = 'medium';
            reason = `Due within a week`;
          }
          
          return {
            assignmentId: a.id,
            assignmentName: a.name,
            courseCode: course.code,
            courseColor: course.color,
            dueDate,
            weight: a.weight,
            priority,
            reason,
          };
        })
    )
    .filter(p => p.priority !== 'low')
    .sort((a, b) => {
      const priorityOrder: Record<UpcomingPriority['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);
  
  // Recommended focus
  const recommendedFocus: RecommendedFocus[] = courseAnalysis
    .map(({ course, risk, prediction }) => {
      let recommendedHours = course.credits * 2;
      let reason = '';
      let priority = 3;
      
      if (risk.riskLevel === 'critical') {
        recommendedHours *= 2;
        reason = 'Critical risk - needs intensive focus';
        priority = 1;
      } else if (risk.riskLevel === 'high') {
        recommendedHours *= 1.5;
        reason = 'High risk - increased study recommended';
        priority = 2;
      } else if (prediction.trend === 'declining') {
        recommendedHours *= 1.3;
        reason = 'Declining trend - needs stabilization';
        priority = 2;
      } else if (risk.upcomingWeight > 20) {
        recommendedHours *= 1.25;
        reason = `Major assignment (${risk.upcomingWeight}%) upcoming`;
        priority = 2;
      } else {
        reason = 'Maintenance - stay consistent';
        priority = 3;
      }
      
      return {
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        recommendedHours: Math.round(recommendedHours * 10) / 10,
        reason,
        priority,
      };
    })
    .sort((a, b) => a.priority - b.priority);
  
  // Overall sentiment
  let overallSentiment: WeeklyDigest['overallSentiment'];
  const criticalCount = atRiskCourses.filter(c => c.risk.riskLevel === 'critical').length;
  const highCount = atRiskCourses.filter(c => c.risk.riskLevel === 'high').length;
  
  if (criticalCount > 0) {
    overallSentiment = 'critical';
  } else if (highCount > 1 || concerns.length > highlights.length) {
    overallSentiment = 'needs-attention';
  } else if (highlights.length > concerns.length) {
    overallSentiment = 'excellent';
  } else {
    overallSentiment = 'good';
  }
  
  return {
    weekStart,
    weekEnd,
    summary: {
      studyHours: 0, // Would need study tracking data
      assignmentsCompleted: completedThisWeek.length,
      averageScore: avgScore,
    },
    highlights,
    concerns,
    upcomingPriorities,
    recommendedFocus,
    overallSentiment,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function detectPatterns(courses: Course[]): Pattern[] {
  const patterns: Pattern[] = [];
  
  // Pattern: Weak in specific category across courses
  const categoryScores: Record<string, number[]> = {};
  
  for (const course of courses) {
    for (const assignment of course.assignments) {
      if (assignment.score !== null) {
        const category = assignment.type;
        if (!categoryScores[category]) categoryScores[category] = [];
        categoryScores[category].push(assignment.score);
      }
    }
  }
  
  for (const [category, scores] of Object.entries(categoryScores)) {
    if (scores.length >= 3) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 75) {
        patterns.push({
          id: `weak-${category}`,
          title: `Pattern: Struggling with ${capitalize(category)}s`,
          message: `Your average score on ${category}s is ${avg.toFixed(0)}% across all courses.`,
          suggestion: `Consider different study strategies for ${category}s, such as practice tests, study groups, or office hours.`,
          isPositive: false,
          category: 'grades',
        });
      } else if (avg >= 90) {
        patterns.push({
          id: `strong-${category}`,
          title: `Strength: Excellent at ${capitalize(category)}s`,
          message: `You're averaging ${avg.toFixed(0)}% on ${category}s - that's a real strength!`,
          suggestion: `Keep leveraging this strength. Your ${category} performance is boosting your grades.`,
          isPositive: true,
          category: 'achievements',
        });
      }
    }
  }
  
  return patterns;
}

function generateStudyRecommendation(
  courseAnalysis: { course: Course; risk: CourseRisk; prediction: GradePrediction }[]
): { summary: string; breakdown: string } | null {
  if (courseAnalysis.length === 0) return null;
  
  const recommendations = courseAnalysis
    .map(({ course, risk }) => {
      let hours = course.credits * 2;
      if (risk.riskLevel === 'critical') hours *= 2;
      else if (risk.riskLevel === 'high') hours *= 1.5;
      
      return { code: course.code, hours, risk: risk.riskLevel };
    })
    .sort((a, b) => {
      const order: Record<CourseRisk['riskLevel'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.risk] - order[b.risk];
    });
  
  const totalHours = recommendations.reduce((sum, r) => sum + r.hours, 0);
  const topPriority = recommendations[0];
  
  const summary = `Focus ${Math.round(topPriority.hours / totalHours * 100)}% of your study time on ${topPriority.code} this week. Total recommended: ${totalHours.toFixed(0)} hours.`;
  
  const breakdown = recommendations
    .map(r => `${r.code}: ${r.hours.toFixed(0)}h (${r.risk} priority)`)
    .join('\n');
  
  return { summary, breakdown };
}

function getWeeklyTip(): string {
  const tips = [
    "Review your notes within 24 hours of class to improve retention by up to 60%.",
    "Break study sessions into 25-minute focused blocks with 5-minute breaks (Pomodoro Technique).",
    "Teaching concepts to others (or pretending to) helps identify gaps in your understanding.",
    "Get 7-8 hours of sleep before exams - sleep is crucial for memory consolidation.",
    "Start assignments early to leave time for questions and unexpected challenges.",
    "Use active recall (testing yourself) instead of passive re-reading for better retention.",
    "Form study groups for difficult courses - explaining concepts to peers reinforces learning.",
    "Visit office hours even when you don't have questions - professors appreciate engaged students.",
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}

function getNextGradeThreshold(percentage: number): number {
  const thresholds = [93, 90, 87, 83, 80, 77, 73, 70, 67, 63, 60];
  for (const threshold of thresholds) {
    if (percentage < threshold) return threshold;
  }
  return 100;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
