import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import type { Assignment } from "@/types";

interface QuickStatsWidgetProps {
  assignments: Assignment[];
  currentGrade: number;
  gradingScale: Record<string, number>;
}

export function QuickStatsWidget({ assignments, currentGrade, gradingScale }: QuickStatsWidgetProps) {
  const stats = useMemo(() => {
    // Defensive normalization
    const normalizedScale: Record<string, number> = {};
    for (const [key, value] of Object.entries(gradingScale)) {
      normalizedScale[key] = typeof value === 'number' ? value : typeof value === 'object' && value && 'min' in value ? Number((value as any).min) || 0 : 0;
    }
    const now = new Date();
    const ungradedAssignments = assignments.filter(a => a.score === null);
    
    // Find the final exam or last assignment
    const sortedByDate = assignments
      .filter(a => a.dueDate)
      .sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime());
    
    const lastAssignment = sortedByDate[0];
    const daysUntilFinal = lastAssignment 
      ? Math.max(0, differenceInDays(new Date(lastAssignment.dueDate!), now))
      : null;

    // Calculate remaining points
    const remainingPoints = ungradedAssignments.reduce((sum, a) => sum + a.weight, 0);

    // Calculate rank based on grading scale
    const sortedGrades = Object.entries(normalizedScale).sort((a, b) => b[1] - a[1]);
    const currentLetterIndex = sortedGrades.findIndex(([_, min]) => currentGrade >= min);
    const totalGrades = sortedGrades.length;
    const rankPercentile = currentGrade > 0 
      ? Math.round(((totalGrades - currentLetterIndex) / totalGrades) * 100)
      : null;

    return {
      daysUntilFinal,
      assignmentsRemaining: ungradedAssignments.length,
      pointsAvailable: remainingPoints,
      rankPercentile,
    };
  }, [assignments, currentGrade, gradingScale]);

  const statRows = [
    stats.daysUntilFinal !== null && {
      label: "Days until final",
      value: stats.daysUntilFinal,
    },
    {
      label: "Assignments remaining",
      value: stats.assignmentsRemaining,
    },
    {
      label: "Points available",
      value: `${stats.pointsAvailable}%`,
    },
    stats.rankPercentile !== null && {
      label: "Current rank*",
      value: `Top ${stats.rankPercentile}%`,
    },
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Quick Stats</span>
      </div>
      <div className="px-5 pb-5">
        <div>
          {statRows.map((stat, index) => {
            const isLast = index === statRows.length - 1 && !stats.rankPercentile;
            return (
              <div 
                key={stat.label} 
                className={`flex justify-between py-3 ${!isLast ? 'border-b border-border/50 dark:border-white/[0.06]' : ''}`}
              >
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-medium text-foreground">{stat.value}</span>
              </div>
            );
          })}
        </div>
        {stats.rankPercentile !== null && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 dark:border-white/[0.06]">
            *Based on grading scale
          </p>
        )}
      </div>
    </div>
  );
}
