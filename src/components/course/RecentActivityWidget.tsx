import { useMemo } from "react";
import { Check, Clock } from "lucide-react";
import type { Assignment } from "@/types";

interface RecentActivityWidgetProps {
  assignments: Assignment[];
}

export function RecentActivityWidget({ assignments }: RecentActivityWidgetProps) {
  const recentlyGraded = useMemo(() => {
    return assignments
      .filter(a => a.score !== null)
      .sort((a, b) => {
        // Sort by due date descending (most recent first)
        if (a.dueDate && b.dueDate) {
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, 5);
  }, [assignments]);

  // Calculate impact (simplified - just showing score relative to weight)
  const calculateImpact = (assignment: Assignment) => {
    const impact = (assignment.weight / 100) * (assignment.score || 0);
    return impact > 0 ? `+${impact.toFixed(1)}%` : '0%';
  };

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Recent Activity</span>
      </div>
      <div className="px-5 pb-5">
        {recentlyGraded.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No graded assignments yet
            </p>
            <p className="text-xs text-muted-foreground">
              Grades will appear here once entered
            </p>
          </div>
        ) : (
          <div>
            {recentlyGraded.map((assignment, index) => {
              const isLast = index === recentlyGraded.length - 1;
              return (
                <div 
                  key={assignment.id} 
                  className={`flex items-center gap-3 py-3 ${!isLast ? 'border-b border-border/50 dark:border-white/[0.06]' : ''}`}
                >
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {assignment.name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">
                    {assignment.score}%
                  </span>
                  <span className="text-xs text-success shrink-0">
                    {calculateImpact(assignment)} impact
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
