import type { Course, Assignment } from '@/types';
import { calculateCourseGrade, percentageToLetter } from '@/lib/gradeUtils';
import { capitalize } from '@/lib/utils';

export interface GradePrediction {
  courseId: string;
  courseCode: string;
  courseName: string;
  courseColor: string;
  currentGrade: number;
  currentLetter: string;
  
  // Predictions
  optimistic: PredictionScenario;
  mostLikely: PredictionScenario;
  pessimistic: PredictionScenario;
  
  // Confidence
  confidence: 'low' | 'medium' | 'high';
  confidencePercent: number;
  completedWeight: number;
  remainingWeight: number;
  
  // Factors influencing prediction
  factors: PredictionFactor[];
  
  // Trend
  trend: 'improving' | 'stable' | 'declining';
  trendStrength: number; // -10 to +10
  
  // Category analysis
  categoryPerformance: CategoryPerformance[];
  upcomingCategories: UpcomingCategory[];
  
  // AI insight
  insight: string;
}

export interface PredictionScenario {
  grade: number;
  letter: string;
  probability: number; // 0-100
  description: string;
}

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // How much it affects prediction
  description: string;
}

export interface CategoryPerformance {
  category: string;
  average: number;
  count: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface UpcomingCategory {
  category: string;
  weight: number;
  expectedScore: number;
  confidence: number;
}


function analyzeTrend(assignments: Assignment[]): {
  trend: 'improving' | 'stable' | 'declining';
  trendStrength: number;
} {
  const graded = assignments
    .filter(a => a.score !== null && a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  
  if (graded.length < 3) {
    return { trend: 'stable', trendStrength: 0 };
  }
  
  // Use last 5-8 data points for recent trend
  const recent = graded.slice(-8);
  
  // Calculate linear regression slope
  const n = recent.length;
  const sumX = recent.reduce((sum, _, i) => sum + i, 0);
  const sumY = recent.reduce((sum, a) => sum + (a.score ?? 0), 0);
  const sumXY = recent.reduce((sum, a, i) => sum + i * (a.score ?? 0), 0);
  const sumX2 = recent.reduce((sum, _, i) => sum + i * i, 0);
  
  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  
  // Convert slope to trend strength (-10 to +10)
  const trendStrength = Math.max(-10, Math.min(10, slope * 2));
  
  let trend: 'improving' | 'stable' | 'declining';
  if (trendStrength > 1.5) trend = 'improving';
  else if (trendStrength < -1.5) trend = 'declining';
  else trend = 'stable';
  
  return { trend, trendStrength };
}

function analyzeCategoryPerformance(completed: Assignment[]): CategoryPerformance[] {
  const byCategory: Record<string, { scores: number[]; dates: string[] }> = {};
  
  for (const a of completed) {
    if (a.score === null) continue;
    const type = a.type || 'other';
    if (!byCategory[type]) {
      byCategory[type] = { scores: [], dates: [] };
    }
    byCategory[type].scores.push(a.score);
    if (a.dueDate) byCategory[type].dates.push(a.dueDate);
  }
  
  return Object.entries(byCategory).map(([category, data]) => {
    const average = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
    
    // Calculate trend within category
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (data.scores.length >= 3) {
      const recent = data.scores.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const change = last - first;
      if (change > 5) trend = 'improving';
      else if (change < -5) trend = 'declining';
    }
    
    return {
      category,
      average,
      count: data.scores.length,
      trend,
    };
  });
}

function predictUpcomingCategories(
  remaining: Assignment[],
  categoryPerformance: CategoryPerformance[]
): UpcomingCategory[] {
  // Group remaining by category
  const byCategory: Record<string, number> = {};
  for (const a of remaining) {
    const type = a.type || 'other';
    byCategory[type] = (byCategory[type] || 0) + a.weight;
  }
  
  return Object.entries(byCategory).map(([category, weight]) => {
    const historical = categoryPerformance.find(c => c.category === category);
    
    let expectedScore: number;
    let confidence: number;
    
    if (historical && historical.count >= 2) {
      // Use historical average with trend adjustment
      expectedScore = historical.average;
      if (historical.trend === 'improving') expectedScore += 3;
      else if (historical.trend === 'declining') expectedScore -= 3;
      confidence = Math.min(historical.count * 15, 85);
    } else if (historical) {
      // Only 1 data point - less confident
      expectedScore = historical.average;
      confidence = 40;
    } else {
      // No historical data - use overall average or default
      const overallAvg = categoryPerformance.reduce((sum, c) => sum + c.average, 0) / 
                         (categoryPerformance.length || 1);
      expectedScore = overallAvg || 80;
      confidence = 25;
    }
    
    return {
      category,
      weight,
      expectedScore: Math.max(0, Math.min(100, expectedScore)),
      confidence,
    };
  });
}

function calculateExpectedRemainingPoints(
  upcomingCategories: UpcomingCategory[],
  trend: 'improving' | 'stable' | 'declining',
  trendStrength: number
): { optimistic: number; mostLikely: number; pessimistic: number } {
  let mostLikely = 0;
  let optimistic = 0;
  let pessimistic = 0;
  
  for (const cat of upcomingCategories) {
    const baseScore = cat.expectedScore;
    const weight = cat.weight / 100;
    
    // Apply trend adjustment
    const trendAdjustment = trendStrength * 0.5;
    
    // Most likely
    mostLikely += (baseScore + trendAdjustment) * weight;
    
    // Optimistic: +10% or best historical performance
    optimistic += Math.min(100, baseScore + 10 + Math.max(0, trendAdjustment)) * weight;
    
    // Pessimistic: -10% or regression
    pessimistic += Math.max(0, baseScore - 10 + Math.min(0, trendAdjustment)) * weight;
  }
  
  return { optimistic, mostLikely, pessimistic };
}

function calculateProbability(
  scenario: 'optimistic' | 'mostLikely' | 'pessimistic',
  trend: 'improving' | 'stable' | 'declining',
): number {
  // Base probabilities
  let probs = { optimistic: 20, mostLikely: 60, pessimistic: 20 };
  
  // Adjust based on trend
  if (trend === 'improving') {
    probs = { optimistic: 30, mostLikely: 55, pessimistic: 15 };
  } else if (trend === 'declining') {
    probs = { optimistic: 15, mostLikely: 55, pessimistic: 30 };
  }
  
  return probs[scenario];
}

function generateScenarioDescription(
  scenario: 'optimistic' | 'mostLikely' | 'pessimistic',
  trend: 'improving' | 'stable' | 'declining',
): string {
  if (scenario === 'optimistic') {
    if (trend === 'improving') {
      return 'Continue your upward trend and excel on remaining work';
    }
    return 'Perform above your average on all remaining assignments';
  }
  
  if (scenario === 'pessimistic') {
    if (trend === 'declining') {
      return 'Current declining trend continues through remaining work';
    }
    return 'Perform below your average on remaining assignments';
  }
  
  // Most likely
  if (trend === 'improving') {
    return 'Maintain recent improvement with consistent performance';
  } else if (trend === 'declining') {
    return 'Stabilize at current level with average performance';
  }
  return 'Continue current performance on remaining work';
}

function identifyPredictionFactors(
  categoryPerformance: CategoryPerformance[],
  upcomingCategories: UpcomingCategory[],
  trend: 'improving' | 'stable' | 'declining',
  trendStrength: number
): PredictionFactor[] {
  const factors: PredictionFactor[] = [];
  
  // Trend factor
  if (trend === 'improving') {
    factors.push({
      name: 'Upward Trend',
      impact: 'positive',
      magnitude: Math.abs(trendStrength) * 0.5,
      description: `Your grades have been improving recently (+${Math.abs(trendStrength).toFixed(1)} trend)`,
    });
  } else if (trend === 'declining') {
    factors.push({
      name: 'Downward Trend',
      impact: 'negative',
      magnitude: Math.abs(trendStrength) * 0.5,
      description: `Your grades have been declining recently (${trendStrength.toFixed(1)} trend)`,
    });
  }
  
  // Category strength/weakness factors
  const strongCategories = categoryPerformance.filter(c => c.average >= 85);
  const weakCategories = categoryPerformance.filter(c => c.average < 75);
  
  for (const strong of strongCategories) {
    const upcoming = upcomingCategories.find(u => u.category === strong.category);
    if (upcoming && upcoming.weight >= 10) {
      factors.push({
        name: `Strong in ${capitalize(strong.category)}s`,
        impact: 'positive',
        magnitude: (strong.average - 80) * 0.3,
        description: `${strong.average.toFixed(0)}% average, ${upcoming.weight}% upcoming`,
      });
    }
  }
  
  for (const weak of weakCategories) {
    const upcoming = upcomingCategories.find(u => u.category === weak.category);
    if (upcoming && upcoming.weight >= 10) {
      factors.push({
        name: `Struggling with ${capitalize(weak.category)}s`,
        impact: 'negative',
        magnitude: (75 - weak.average) * 0.3,
        description: `${weak.average.toFixed(0)}% average, ${upcoming.weight}% upcoming`,
      });
    }
  }
  
  // High-weight upcoming factor
  const highWeightUpcoming = upcomingCategories.filter(u => u.weight >= 20);
  for (const hw of highWeightUpcoming) {
    factors.push({
      name: `Major ${capitalize(hw.category)} Remaining`,
      impact: 'neutral',
      magnitude: hw.weight * 0.2,
      description: `${hw.weight}% of grade still to be determined by ${hw.category}s`,
    });
  }
  
  // Sort by magnitude
  factors.sort((a, b) => b.magnitude - a.magnitude);
  
  return factors.slice(0, 5); // Top 5 factors
}

function generatePredictionInsight(
  currentGrade: number,
  mostLikely: PredictionScenario,
  categoryPerformance: CategoryPerformance[],
  upcomingCategories: UpcomingCategory[]
): string {
  const currentLetter = percentageToLetter(currentGrade);
  
  // Find key upcoming category
  const keyUpcoming = upcomingCategories.length > 0 
    ? upcomingCategories.reduce((max, cat) => cat.weight > max.weight ? cat : max, upcomingCategories[0])
    : null;
  
  // Find weakness if any
  const weakness = categoryPerformance.find(c => c.average < 75);
  
  let insight = '';
  
  if (mostLikely.grade > currentGrade + 2) {
    insight = `Your prediction is trending upward. You're projected to finish with a ${mostLikely.letter} (${mostLikely.grade.toFixed(1)}%), which is ${(mostLikely.grade - currentGrade).toFixed(1)}% higher than your current grade.`;
  } else if (mostLikely.grade < currentGrade - 2) {
    insight = `Your prediction shows a slight decline. Without intervention, you may finish at ${mostLikely.letter} (${mostLikely.grade.toFixed(1)}%).`;
  } else {
    insight = `You're on track to maintain your current ${currentLetter}, finishing around ${mostLikely.grade.toFixed(1)}%.`;
  }
  
  // Add actionable advice
  if (keyUpcoming && keyUpcoming.weight >= 15) {
    const historical = categoryPerformance.find(c => c.category === keyUpcoming.category);
    if (historical) {
      insight += ` Your upcoming ${keyUpcoming.category}s (${keyUpcoming.weight}% of grade) will be key—your average in this category is ${historical.average.toFixed(0)}%.`;
    } else {
      insight += ` The upcoming ${keyUpcoming.category}s (${keyUpcoming.weight}% of grade) will significantly impact your final grade.`;
    }
  }
  
  if (weakness && upcomingCategories.some(u => u.category === weakness.category)) {
    insight += ` Consider extra preparation for ${weakness.category}s where you're averaging ${weakness.average.toFixed(0)}%.`;
  }
  
  return insight;
}

export function predictFinalGrade(course: Course): GradePrediction {
  const {
    id,
    code,
    name,
    color,
    assignments,
  } = course;
  
  const currentGrade = calculateCourseGrade(assignments);
  
  // Separate completed and remaining assignments
  const completed = assignments.filter(a => a.score !== null);
  const remaining = assignments.filter(a => a.score === null);
  
  const completedWeight = completed.reduce((sum, a) => sum + a.weight, 0);
  const remainingWeight = remaining.reduce((sum, a) => sum + a.weight, 0);
  
  // Calculate confidence based on how much is completed
  const confidencePercent = Math.min(Math.round(completedWeight * 1.2), 95);
  let confidence: GradePrediction['confidence'];
  if (completedWeight >= 60) confidence = 'high';
  else if (completedWeight >= 35) confidence = 'medium';
  else confidence = 'low';
  
  // Analyze trend
  const { trend, trendStrength } = analyzeTrend(assignments);
  
  // Analyze category performance
  const categoryPerformance = analyzeCategoryPerformance(completed);
  
  // Predict performance on remaining assignments
  const upcomingCategories = predictUpcomingCategories(remaining, categoryPerformance);
  
  // Calculate expected remaining points
  const expectedRemainingPoints = calculateExpectedRemainingPoints(
    upcomingCategories,
    trend,
    trendStrength
  );
  
  // Current earned points (weighted)
  const earnedPoints = completed.reduce((sum, a) => {
    return sum + (a.score ?? 0) * (a.weight / 100);
  }, 0);
  
  // ============================================
  // SCENARIO CALCULATIONS
  // ============================================
  
  // Most Likely: Based on expected performance
  const mostLikelyGrade = earnedPoints + expectedRemainingPoints.mostLikely;
  
  // Optimistic: Student performs above average
  const optimisticGrade = earnedPoints + expectedRemainingPoints.optimistic;
  
  // Pessimistic: Student performs below average
  const pessimisticGrade = earnedPoints + expectedRemainingPoints.pessimistic;
  
  // Clamp values
  const clamp = (val: number) => Math.max(0, Math.min(100, val));
  
  const optimistic: PredictionScenario = {
    grade: clamp(optimisticGrade),
    letter: percentageToLetter(clamp(optimisticGrade)),
    probability: calculateProbability('optimistic', trend),
    description: generateScenarioDescription('optimistic', trend),
  };
  
  const mostLikely: PredictionScenario = {
    grade: clamp(mostLikelyGrade),
    letter: percentageToLetter(clamp(mostLikelyGrade)),
    probability: calculateProbability('mostLikely', trend),
    description: generateScenarioDescription('mostLikely', trend),
  };
  
  const pessimistic: PredictionScenario = {
    grade: clamp(pessimisticGrade),
    letter: percentageToLetter(clamp(pessimisticGrade)),
    probability: calculateProbability('pessimistic', trend),
    description: generateScenarioDescription('pessimistic', trend),
  };
  
  // Identify factors
  const factors = identifyPredictionFactors(
    categoryPerformance,
    upcomingCategories,
    trend,
    trendStrength
  );
  
  // Generate AI insight
  const insight = generatePredictionInsight(
    currentGrade,
    mostLikely,
    categoryPerformance,
    upcomingCategories
  );
  
  return {
    courseId: id,
    courseCode: code,
    courseName: name,
    courseColor: color,
    currentGrade,
    currentLetter: percentageToLetter(currentGrade),
    optimistic,
    mostLikely,
    pessimistic,
    confidence,
    confidencePercent,
    completedWeight,
    remainingWeight,
    factors,
    trend,
    trendStrength,
    categoryPerformance,
    upcomingCategories,
    insight,
  };
}

// Predict all courses
export function predictAllCourses(courses: Course[]): GradePrediction[] {
  return courses.map(course => predictFinalGrade(course));
}
