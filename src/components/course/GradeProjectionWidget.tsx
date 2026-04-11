import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { percentageToLetter } from "@/lib/gradeUtils";
import type { Assignment } from "@/types";

interface GradeProjectionWidgetProps {
  assignments: Assignment[];
  currentGrade: number;
  targetGrade?: number;
}

export function GradeProjectionWidget({ assignments, currentGrade, targetGrade = 90 }: GradeProjectionWidgetProps) {
  const projection = useMemo(() => {
    const gradedAssignments = assignments.filter(a => a.score !== null);
    const ungradedAssignments = assignments.filter(a => a.score === null);
    
    const gradedWeight = gradedAssignments.reduce((sum, a) => sum + a.weight, 0);
    const ungradedWeight = ungradedAssignments.reduce((sum, a) => sum + a.weight, 0);
    
    if (ungradedWeight === 0) {
      return {
        projectedGrade: currentGrade,
        projectedLetter: percentageToLetter(currentGrade),
        neededScore: 0,
        isPossible: true,
        hasRemaining: false,
      };
    }

    // Project if maintaining current performance
    const projectedGrade = currentGrade;
    const projectedLetter = percentageToLetter(projectedGrade);

    // Calculate what's needed on remaining to reach target
    const earnedPoints = gradedAssignments.reduce((sum, a) => sum + (a.weight * (a.score || 0) / 100), 0);
    const neededPoints = (targetGrade / 100) * (gradedWeight + ungradedWeight);
    const remainingNeeded = neededPoints - earnedPoints;
    const neededScore = ungradedWeight > 0 ? (remainingNeeded / ungradedWeight) * 100 : 0;
    const isPossible = neededScore <= 100;

    return {
      projectedGrade,
      projectedLetter,
      neededScore: Math.max(0, neededScore),
      isPossible,
      hasRemaining: ungradedWeight > 0,
    };
  }, [assignments, currentGrade, targetGrade]);

  const targetLetter = percentageToLetter(targetGrade);

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Grade Projection</span>
      </div>
      <div className="px-5 pb-5 space-y-4">
        {/* Projected Final */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">If you maintain current performance:</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Final Grade</span>
            <span className="text-lg font-semibold text-foreground">
              {projection.projectedLetter} ({projection.projectedGrade.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 dark:border-white/[0.06]" />

        {/* What's needed for target */}
        {projection.hasRemaining && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">To reach target ({targetLetter}):</p>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Needed on remaining</span>
              {projection.isPossible ? (
                <span className="text-lg font-semibold text-foreground">
                  {projection.neededScore.toFixed(0)}% avg
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not possible
                </span>
              )}
            </div>
          </div>
        )}

        {!projection.hasRemaining && (
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">All assignments graded!</span>
          </div>
        )}
      </div>
    </div>
  );
}
