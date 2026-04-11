import { format } from "date-fns";
import { categorizeAssignment, CATEGORY_COLORS } from "@/lib/assignmentUtils";
import { ASSIGNMENT_TYPE_COLORS } from "@/lib/chartPalette";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string | number;
  name: string;
  weight?: number;
  type?: string;
}

interface MonthSummaryWidgetProps {
  month: Date;
  assignments: Assignment[];
  examCount: number;
}

export function MonthSummaryWidget({ month, assignments, examCount }: MonthSummaryWidgetProps) {
  const monthName = format(month, "MMMM").toUpperCase();
  
  // Calculate stats
  const totalPoints = assignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  const formattedPoints = Math.round(totalPoints * 100) / 100;
  
  // Group by category
  const categoryStats = assignments.reduce((acc, a) => {
    const type = a.type || categorizeAssignment(a.name);
    if (!acc[type]) {
      acc[type] = { count: 0, points: 0 };
    }
    acc[type].count++;
    acc[type].points += a.weight || 0;
    return acc;
  }, {} as Record<string, { count: number; points: number }>);

  const maxPoints = Math.max(...Object.values(categoryStats).map(c => c.points), 1);

  const getCategoryColor = (type: string) =>
    ASSIGNMENT_TYPE_COLORS[type] ?? ASSIGNMENT_TYPE_COLORS.other;

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-widget-header">
        <span className="calendar-widget-title">{monthName} Summary</span>
      </div>

      {/* Stats Row */}
      <div className="summary-stats-row">
        <div className="summary-stat">
          <p className="summary-stat-value">{examCount}</p>
          <p className="summary-stat-label">Exams</p>
        </div>
        <div className="summary-stat">
          <p className="summary-stat-value">{assignments.length}</p>
          <p className="summary-stat-label">Assignments</p>
        </div>
        <div className="summary-stat">
          <p className="summary-stat-value points">{formattedPoints}</p>
          <p className="summary-stat-label">Total Pts</p>
        </div>
      </div>

      {/* Categories */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="summary-categories">
          <p className="summary-categories-title">By Category</p>
          {Object.entries(categoryStats).map(([type, stats]) => (
            <div key={type} className="category-bar">
              <span 
                className="category-dot" 
                style={{ backgroundColor: getCategoryColor(type) }}
              />
              <span className="category-name">
                {type.charAt(0).toUpperCase() + type.slice(1)} ({stats.count})
              </span>
              <div className="category-progress">
                <div 
                  className="category-progress-fill"
                  style={{ 
                    width: `${(stats.points / maxPoints) * 100}%`,
                    backgroundColor: getCategoryColor(type)
                  }}
                />
              </div>
              <span className="category-points">{Math.round(stats.points * 100) / 100} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
