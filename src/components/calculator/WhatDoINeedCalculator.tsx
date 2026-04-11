import { useState, useMemo } from "react";
import {
  Target,
  ChevronDown,
  Check,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Calculator,
  ArrowRight,
  Zap,
  Calendar,
  Star,
  Sparkles,
  ChevronRight,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { percentageToLetter } from "@/lib/gradeUtils";
import type { Assignment } from "@/types";
import { DEFAULT_GRADING_SCALE } from "@/types";

interface WhatDoINeedCalculatorProps {
  assignments: Assignment[];
  courseColor: string;
  courseCode: string;
  courseName: string;
  gradingScale?: Record<string, number>;
  onSwitchToWhatIf?: () => void;
}

interface NeededScore {
  assignmentId: string;
  assignmentName: string;
  type: string;
  weight: number;
  neededScore: number;
  optimizedTarget: number; // Smarter individual target
  difficulty: "guaranteed" | "easy" | "achievable" | "hard" | "very-hard" | "impossible";
  dueDate?: string;
  priorityScore: number; // Higher = more important to focus on
  daysUntilDue: number | null;
}

// Grade targets
const GRADE_OPTIONS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "Pass"];

// Helper to get difficulty from score
const getDifficulty = (score: number): NeededScore["difficulty"] => {
  if (score <= 0) return "guaranteed";
  if (score <= 70) return "easy";
  if (score <= 85) return "achievable";
  if (score <= 95) return "hard";
  if (score <= 100) return "very-hard";
  return "impossible";
};

// Get next lower grade
const getNextLowerGrade = (grade: string): string => {
  const grades = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
  const index = grades.indexOf(grade);
  return index < grades.length - 1 ? grades[index + 1] : "F";
};

// Format due date
const formatDueDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays} days`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Get days until due
const getDaysUntilDue = (dateString?: string): number | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// Calculate priority score (higher weight + sooner due = higher priority)
const calculatePriorityScore = (weight: number, daysUntilDue: number | null): number => {
  const weightScore = weight * 10; // Weight matters a lot

  if (daysUntilDue === null) {
    return weightScore; // No due date, just use weight
  }

  // Urgency multiplier: closer due dates get higher scores
  let urgencyMultiplier = 1;
  if (daysUntilDue <= 0)
    urgencyMultiplier = 3; // Overdue
  else if (daysUntilDue <= 2) urgencyMultiplier = 2.5;
  else if (daysUntilDue <= 7) urgencyMultiplier = 2;
  else if (daysUntilDue <= 14) urgencyMultiplier = 1.5;

  return weightScore * urgencyMultiplier;
};

export function WhatDoINeedCalculator({
  assignments,
  courseColor,
  courseCode,
  courseName,
  gradingScale,
  onSwitchToWhatIf,
}: WhatDoINeedCalculatorProps) {
  const [targetGrade, setTargetGrade] = useState<string>("B");

  const scale = gradingScale || DEFAULT_GRADING_SCALE;

  // Calculate what's needed
  const calculation = useMemo(() => {
    // Get completed and remaining assignments
    const completedAssignments = assignments.filter((a) => a.score !== null);
    const remainingAssignments = assignments.filter((a) => a.score === null);

    // Calculate completed weight and points
    const completedWeight = completedAssignments.reduce((sum, a) => sum + a.weight, 0);
    const remainingWeight = remainingAssignments.reduce((sum, a) => sum + a.weight, 0);
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);

    // Current grade from graded work
    const earnedPoints = completedAssignments.reduce((sum, a) => {
      return sum + (a.score! * a.weight) / 100;
    }, 0);

    const currentGrade = completedWeight > 0 ? (earnedPoints / completedWeight) * 100 : 0;

    // Target percentage based on grade
    let targetPercentage = scale[targetGrade as keyof typeof scale] || 83;
    if (targetGrade === "Pass") targetPercentage = 60;

    // Points needed from remaining work
    const pointsNeeded = (targetPercentage / 100) * totalWeight;
    const pointsStillNeeded = pointsNeeded - earnedPoints;

    // Average score needed on remaining assignments
    const avgNeededScore = remainingWeight > 0 ? (pointsStillNeeded / remainingWeight) * 100 : 0;

    // Is it possible?
    const isPossible = avgNeededScore <= 100;
    const isGuaranteed = avgNeededScore <= 0;

    // Calculate optimized targets based on weight
    // Higher-weight assignments get slightly higher targets, lower-weight get buffer
    const totalRemainingWeight = remainingAssignments.reduce((sum, a) => sum + a.weight, 0);

    const neededScores: NeededScore[] = remainingAssignments.map((assignment) => {
      const daysUntilDue = getDaysUntilDue(assignment.dueDate);
      const priorityScore = calculatePriorityScore(assignment.weight, daysUntilDue);

      // Calculate optimized target
      // High-weight items: aim higher (you get more bang for your buck)
      // Low-weight items: can be lower (buffer room)
      const weightRatio = assignment.weight / (totalRemainingWeight || 1);
      const avgWeightRatio = 1 / (remainingAssignments.length || 1);

      let optimizedTarget: number;
      if (isGuaranteed) {
        optimizedTarget = 0;
      } else if (!isPossible) {
        optimizedTarget = 100;
      } else {
        // Adjust target based on weight importance
        // High-weight items: aim 5-10% above average
        // Low-weight items: can be 5-10% below average
        const adjustment = (weightRatio - avgWeightRatio) * 100 * 0.5;
        optimizedTarget = Math.max(0, Math.min(100, avgNeededScore + adjustment));
      }

      const difficulty = getDifficulty(optimizedTarget);

      return {
        assignmentId: assignment.id,
        assignmentName: assignment.name,
        type: assignment.type,
        weight: assignment.weight,
        neededScore: Math.max(0, avgNeededScore),
        optimizedTarget,
        difficulty: avgNeededScore > 100 ? "impossible" : difficulty,
        dueDate: assignment.dueDate,
        priorityScore,
        daysUntilDue,
      };
    });

    // Sort by priority score (highest first)
    neededScores.sort((a, b) => b.priorityScore - a.priorityScore);

    // Determine overall difficulty
    let overallDifficulty: "guaranteed" | "easy" | "achievable" | "hard" | "very-hard" | "impossible";
    if (isGuaranteed) overallDifficulty = "guaranteed";
    else if (avgNeededScore <= 70) overallDifficulty = "easy";
    else if (avgNeededScore <= 85) overallDifficulty = "achievable";
    else if (avgNeededScore <= 95) overallDifficulty = "hard";
    else if (avgNeededScore <= 100) overallDifficulty = "very-hard";
    else overallDifficulty = "impossible";

    // Find next due assignment
    const sortedByDue = [...neededScores]
      .filter((a) => a.daysUntilDue !== null)
      .sort((a, b) => (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999));
    const nextDue = sortedByDue[0] || null;

    // Calculate "what if you ace the next one" scenario
    let aceNextScenario = null;
    if (neededScores.length > 1 && isPossible && !isGuaranteed) {
      const topPriority = neededScores[0];
      const aceScore = 95; // Assume "acing" means 95%
      const pointsFromAce = (aceScore * topPriority.weight) / 100;
      const remainingPointsNeeded = pointsStillNeeded - pointsFromAce;
      const remainingWeightAfterAce = remainingWeight - topPriority.weight;
      const newAvgNeeded = remainingWeightAfterAce > 0 ? (remainingPointsNeeded / remainingWeightAfterAce) * 100 : 0;

      aceNextScenario = {
        assignment: topPriority,
        aceScore,
        newAvgNeeded: Math.max(0, newAvgNeeded),
        improvement: avgNeededScore - newAvgNeeded,
      };
    }

    return {
      currentGrade,
      targetPercentage,
      targetLetter: targetGrade,
      completedWeight,
      remainingWeight,
      totalWeight,
      earnedPoints,
      pointsStillNeeded,
      avgNeededScore: Math.max(0, avgNeededScore),
      isPossible,
      isGuaranteed,
      overallDifficulty,
      neededScores,
      completedCount: completedAssignments.length,
      remainingCount: remainingAssignments.length,
      nextDue,
      aceNextScenario,
    };
  }, [assignments, targetGrade, scale]);

  // Generate motivational message
  const motivationalMessage = useMemo(() => {
    const { avgNeededScore, overallDifficulty, currentGrade, targetPercentage, isGuaranteed, isPossible } = calculation;

    if (isGuaranteed) {
      return {
        emoji: "🎉",
        message: "You've locked in your target grade!",
        subtext: "Keep up the momentum for an even higher finish.",
      };
    }

    if (!isPossible) {
      return {
        emoji: "💪",
        message: "Time to adjust expectations",
        subtext: `Consider targeting a ${getNextLowerGrade(calculation.targetLetter)} instead.`,
      };
    }

    const gap = targetPercentage - currentGrade;

    if (gap <= 1) {
      return {
        emoji: "🔥",
        message: "You're right on the edge!",
        subtext: "One solid performance puts you over the top.",
      };
    }

    if (overallDifficulty === "easy") {
      return {
        emoji: "✨",
        message: "Smooth sailing ahead",
        subtext: "Stay consistent and you'll hit your goal easily.",
      };
    }

    if (overallDifficulty === "achievable") {
      return {
        emoji: "📈",
        message: "Solid effort will get you there",
        subtext: "Focus on the high-weight assignments first.",
      };
    }

    if (overallDifficulty === "hard") {
      return {
        emoji: "🎯",
        message: "It's a stretch, but doable",
        subtext: "Prioritize your study time on what matters most.",
      };
    }

    return {
      emoji: "⚡",
      message: "You'll need your A-game",
      subtext: "Every assignment counts. Start with the biggest ones.",
    };
  }, [calculation]);

  // Generate AI insight
  const aiInsight = useMemo(() => {
    const { avgNeededScore, neededScores, isGuaranteed, isPossible, aceNextScenario } = calculation;

    if (isGuaranteed) {
      return "You're in an excellent position — your current grades already secure your target. Consider aiming higher or use this buffer to balance other courses.";
    }

    if (!isPossible) {
      return `Even with perfect scores on all remaining work, reaching a ${calculation.targetLetter} isn't mathematically possible. I'd recommend adjusting your target to a ${getNextLowerGrade(calculation.targetLetter)}, which is still achievable.`;
    }

    // Check high-weight items
    const highWeightItems = neededScores.filter((a) => a.weight >= 10);
    const urgentItems = neededScores.filter((a) => a.daysUntilDue !== null && a.daysUntilDue <= 7);

    if (highWeightItems.length > 0 && avgNeededScore > 80) {
      const topItem = highWeightItems[0];
      return `Your path to a ${calculation.targetLetter} runs through "${topItem.assignmentName}" (${topItem.weight}% of your grade). Scoring well here dramatically reduces pressure on everything else. Consider allocating extra study time to this one.`;
    }

    if (urgentItems.length > 0) {
      const urgent = urgentItems[0];
      return `"${urgent.assignmentName}" is coming up ${urgent.daysUntilDue === 0 ? "today" : urgent.daysUntilDue === 1 ? "tomorrow" : `in ${urgent.daysUntilDue} days`}. It's worth ${urgent.weight}% of your grade — make it count.`;
    }

    if (aceNextScenario && aceNextScenario.improvement > 5) {
      return `Here's a strategic insight: if you score ${aceNextScenario.aceScore}% on "${aceNextScenario.assignment.assignmentName}", your required average on everything else drops from ${avgNeededScore.toFixed(0)}% to just ${aceNextScenario.newAvgNeeded.toFixed(0)}%. That's a ${aceNextScenario.improvement.toFixed(0)}% swing.`;
    }

    if (avgNeededScore <= 75) {
      return `You're in a comfortable position. An average of ${avgNeededScore.toFixed(0)}% is well within reach — just maintain your current study habits and don't slack off on the remaining assignments.`;
    }

    return `To reach your ${calculation.targetLetter}, focus on the high-priority assignments listed above. They offer the best return on your study time investment.`;
  }, [calculation]);

  // Get top priority items for "Focus First" panel
  const focusFirst = calculation.neededScores.slice(0, 3);

  return (
    <div className="what-need-calculator-v2">
      {/* Header */}
      <div className="calculator-header-v2">
        <div>
          <h2 className="calculator-title-v2">What Do I Need?</h2>
          <p className="calculator-subtitle-v2">Calculate exactly what you need to hit your target grade</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="calculator-layout">
        {/* Left Column - Main Calculator */}
        <div className="calculator-main">
          {/* Target Grade Selector */}
          <div className="grade-selector-card">
            <label className="selector-label">TARGET GRADE</label>
            <div className="grade-options-v2">
              {GRADE_OPTIONS.map((grade) => (
                <button
                  key={grade}
                  className={cn("grade-option-v2", targetGrade === grade && "active")}
                  onClick={() => setTargetGrade(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Current vs Target Status */}
          <div className="status-comparison-card">
            <div className="status-block current">
              <span className="status-block-label">Current</span>
              <span className="status-block-value">{calculation.currentGrade.toFixed(1)}%</span>
              <span className="status-block-letter">
                {calculation.currentGrade > 0 ? percentageToLetter(calculation.currentGrade) : "—"}
              </span>
            </div>

            <div className="status-arrow">
              <ArrowRight size={20} />
            </div>

            <div className="status-block target">
              <span className="status-block-label">Target</span>
              <span className="status-block-value">{calculation.targetPercentage}%</span>
              <span className="status-block-letter">{calculation.targetLetter}</span>
            </div>

            <div className="status-block gap">
              <span className="status-block-label">You Need</span>
              <span
                className={cn(
                  "status-block-value gap-value",
                  calculation.avgNeededScore <= 75 && "text-success",
                  calculation.avgNeededScore > 75 && calculation.avgNeededScore <= 90 && "text-warning",
                  calculation.avgNeededScore > 90 && "text-danger",
                )}
              >
                {calculation.isGuaranteed ? "Secured!" : `${calculation.avgNeededScore.toFixed(0)}% avg`}
              </span>
              <span className="status-block-sublabel">on {calculation.remainingWeight}% remaining</span>
            </div>
          </div>

          {/* Result Card */}
          <div className={cn("result-card-v2", calculation.overallDifficulty)}>
            {calculation.isGuaranteed ? (
              <>
                <div className="result-icon-wrapper success">
                  <CheckCircle size={24} />
                </div>
                <div className="result-content-v2">
                  <h3 className="result-title-v2">Grade Secured! 🎉</h3>
                  <p className="result-description-v2">
                    Even scoring 0% on remaining work, you'll still get a {calculation.targetLetter}.
                  </p>
                </div>
              </>
            ) : calculation.isPossible ? (
              <>
                <div className={cn("result-icon-wrapper", calculation.overallDifficulty)}>
                  {calculation.overallDifficulty === "easy" && <CheckCircle size={24} />}
                  {calculation.overallDifficulty === "achievable" && <TrendingUp size={24} />}
                  {calculation.overallDifficulty === "hard" && <AlertTriangle size={24} />}
                  {calculation.overallDifficulty === "very-hard" && <Flame size={24} />}
                </div>
                <div className="result-content-v2">
                  <h3 className="result-title-v2">
                    {calculation.overallDifficulty === "easy" && "Easily Achievable"}
                    {calculation.overallDifficulty === "achievable" && "Achievable with Effort"}
                    {calculation.overallDifficulty === "hard" && "Challenging"}
                    {calculation.overallDifficulty === "very-hard" && "Very Difficult"}
                  </h3>
                  <p className="result-description-v2">
                    Average <strong>{calculation.avgNeededScore.toFixed(0)}%</strong> on your{" "}
                    {calculation.remainingCount} remaining assignments ({calculation.remainingWeight}% of grade)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="result-icon-wrapper danger">
                  <XCircle size={24} />
                </div>
                <div className="result-content-v2">
                  <h3 className="result-title-v2">Not Possible</h3>
                  <p className="result-description-v2">
                    Even with 100% on everything, you can't reach a {calculation.targetLetter}. Try targeting a{" "}
                    <button
                      className="inline-grade-link"
                      onClick={() => setTargetGrade(getNextLowerGrade(targetGrade))}
                    >
                      {getNextLowerGrade(targetGrade)}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Assignments List */}
          {calculation.isPossible && !calculation.isGuaranteed && calculation.neededScores.length > 0 && (
            <div className="assignments-card">
              <div className="assignments-card-header">
                <h3 className="assignments-card-title">ASSIGNMENT TARGETS</h3>
                <span className="assignments-card-subtitle">
                  Sorted by priority • {calculation.remainingCount} remaining
                </span>
              </div>

              <div className="assignments-list-v2">
                {calculation.neededScores.map((item, index) => (
                  <div key={item.assignmentId} className={cn("assignment-row-v2", index < 3 && "high-priority")}>
                    <div className="assignment-priority-indicator">
                      {index < 3 ? (
                        <div className="priority-badge">
                          <Zap size={12} />
                        </div>
                      ) : (
                        <span className="priority-number">{index + 1}</span>
                      )}
                    </div>

                    <div className="assignment-details">
                      <span className="assignment-name-v2">{item.assignmentName}</span>
                      <div className="assignment-meta-v2">
                        <span className="weight-badge">{item.weight}%</span>
                        {item.dueDate && (
                          <span className="due-badge">
                            <Calendar size={12} />
                            {formatDueDate(item.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="assignment-target">
                      <span className="target-score">{item.optimizedTarget.toFixed(0)}%</span>
                      <span className={cn("target-difficulty", item.difficulty)}>
                        {item.difficulty === "guaranteed" && "Any score"}
                        {item.difficulty === "easy" && "Easy"}
                        {item.difficulty === "achievable" && "Doable"}
                        {item.difficulty === "hard" && "Push"}
                        {item.difficulty === "very-hard" && "Stretch"}
                        {item.difficulty === "impossible" && "Max out"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Strategy Panel */}
        <div className="strategy-panel">
          {/* Quick Stats */}
          <div className="strategy-card stats-card">
            <h4 className="strategy-card-title">QUICK STATS</h4>
            <div className="quick-stats-list">
              <div className="quick-stat-item">
                <span className="quick-stat-label">Average needed</span>
                <span className="quick-stat-value">
                  {calculation.isGuaranteed ? "—" : `${calculation.avgNeededScore.toFixed(0)}%`}
                </span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">Grade weight left</span>
                <span className="quick-stat-value">{calculation.remainingWeight}%</span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">Assignments left</span>
                <span className="quick-stat-value">{calculation.remainingCount}</span>
              </div>
              {calculation.nextDue && (
                <div className="quick-stat-item">
                  <span className="quick-stat-label">Next due</span>
                  <span className="quick-stat-value accent">
                    {calculation.nextDue.daysUntilDue === 0
                      ? "Today"
                      : calculation.nextDue.daysUntilDue === 1
                        ? "Tomorrow"
                        : `${calculation.nextDue.daysUntilDue} days`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Focus First */}
          {calculation.isPossible && !calculation.isGuaranteed && focusFirst.length > 0 && (
            <div className="strategy-card focus-card">
              <div className="strategy-card-header">
                <Zap size={16} className="strategy-icon" />
                <h4 className="strategy-card-title">FOCUS FIRST</h4>
              </div>
              <p className="strategy-card-description">These have the biggest impact on your grade</p>
              <div className="focus-items">
                {focusFirst.map((item, index) => (
                  <div key={item.assignmentId} className="focus-item">
                    <span className="focus-rank">{index + 1}</span>
                    <div className="focus-info">
                      <span className="focus-name">{item.assignmentName}</span>
                      <span className="focus-meta">
                        {item.weight}% weight • Aim for {item.optimizedTarget.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What If Preview */}
          {calculation.aceNextScenario && calculation.aceNextScenario.improvement > 2 && (
            <div className="strategy-card whatif-preview-card">
              <div className="strategy-card-header">
                <Sparkles size={16} className="strategy-icon" />
                <h4 className="strategy-card-title">WHAT IF...</h4>
              </div>
              <div className="whatif-preview-content">
                <p className="whatif-scenario">
                  You score <strong>{calculation.aceNextScenario.aceScore}%</strong> on "
                  {calculation.aceNextScenario.assignment.assignmentName}"?
                </p>
                <div className="whatif-result">
                  <div className="whatif-before">
                    <span className="whatif-label">Current avg needed</span>
                    <span className="whatif-value">{calculation.avgNeededScore.toFixed(0)}%</span>
                  </div>
                  <ChevronRight size={16} className="whatif-arrow" />
                  <div className="whatif-after">
                    <span className="whatif-label">New avg needed</span>
                    <span className="whatif-value success">{calculation.aceNextScenario.newAvgNeeded.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="whatif-improvement">
                  −{calculation.aceNextScenario.improvement.toFixed(0)}% easier
                </span>
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className={cn("strategy-card motivation-card", calculation.overallDifficulty)}>
            <div className="motivation-emoji">{motivationalMessage.emoji}</div>
            <h4 className="motivation-title">{motivationalMessage.message}</h4>
            <p className="motivation-subtext">{motivationalMessage.subtext}</p>
          </div>

          {/* AI Insight */}
          <div className="strategy-card ai-insight-card-v2">
            <div className="strategy-card-header">
              <div className="ai-badge-v2">
                <Star size={12} />
                AI INSIGHT
              </div>
            </div>
            <p className="ai-insight-text-v2">{aiInsight}</p>
          </div>

          {/* Action Button */}
          {onSwitchToWhatIf && (
            <button className="whatif-action-btn" onClick={onSwitchToWhatIf}>
              <Calculator size={18} />
              Try What-If Scenarios
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
