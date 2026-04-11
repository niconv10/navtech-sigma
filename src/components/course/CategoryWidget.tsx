import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  ChevronDown, 
  Plus,
  Check,
  Circle,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { CATEGORY_ICONS, CATEGORY_NAMES } from "@/lib/assignmentUtils";
import { getAssignmentStatus, formatPoints } from "@/lib/gradeUtils";
import type { Assignment, AssignmentType } from "@/types";
import { format } from "date-fns";
import { CategoryAnalytics } from "./CategoryAnalytics";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CategoryWidgetProps {
  type: AssignmentType;
  assignments: Assignment[];
  courseColor: string;
  onAddAssignment: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onScoreAssignment?: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string, name: string) => void;
  onUpdateDueDate?: (assignmentId: string, dueDate: Date) => void;
}

export function CategoryWidget({
  type,
  assignments,
  courseColor,
  onAddAssignment,
  onEditAssignment,
  onScoreAssignment,
  onDeleteAssignment,
  onUpdateDueDate,
}: CategoryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const Icon = CATEGORY_ICONS[type] || CATEGORY_ICONS.other;
  const categoryName = CATEGORY_NAMES[type] || type;

  // Calculate category stats
  const stats = useMemo(() => {
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);
    const gradedAssignments = assignments.filter(a => a.score !== null);
    const totalGraded = gradedAssignments.length;
    
    let avgScore = 0;
    if (totalGraded > 0) {
      avgScore = gradedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / totalGraded;
    }

    // Calculate points earned
    const pointsEarned = gradedAssignments.reduce((sum, a) => sum + (a.weight * (a.score || 0) / 100), 0);
    const pointsPossible = assignments.reduce((sum, a) => sum + a.weight, 0);

    return {
      count: assignments.length,
      totalWeight,
      avgScore,
      gradedCount: totalGraded,
      pointsEarned,
      pointsPossible,
    };
  }, [assignments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <Check className="w-4 h-4 text-success" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-error" />;
      case "due-soon":
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="category-widget">
      {/* Header - Always visible */}
      <div 
        className="category-header group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Arrow */}
          <button className="p-1 hover:bg-muted/50 dark:hover:bg-white/5 rounded transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Category Icon */}
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${courseColor}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: courseColor }} />
          </div>

          {/* Title and Stats */}
          <div className="flex-1">
            <h3 className="category-title flex items-center gap-2">
              {categoryName}
              {assignments.length > 1 && "S"}
            </h3>
            <p className="category-stats">
              {stats.count} item{stats.count !== 1 ? "s" : ""} • {formatPoints(stats.totalWeight)}% of grade
              {stats.gradedCount > 0 && ` • Avg: ${formatPoints(stats.avgScore)}%`}
            </p>
          </div>
        </div>

        {/* Add Button */}
        <button 
          className="add-button opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onAddAssignment();
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="category-content animate-fade-in">
          {/* Analytics Section */}
          <CategoryAnalytics 
            assignments={assignments}
            courseColor={courseColor}
          />

          {/* Assignment List */}
          <div className="category-list">
            <div className="category-list-header">
              <span className="w-10">Status</span>
              <span className="flex-1">Name</span>
              <span className="w-16 text-right">Weight</span>
              <span className="w-20 text-right">Due</span>
              <span className="w-16 text-right">Score</span>
              <span className="w-20 text-center">Actions</span>
            </div>

            {assignments.map((assignment, index) => {
              const status = getAssignmentStatus(assignment);
              return (
                <div 
                  key={assignment.id} 
                  className={cn(
                    "category-list-item",
                    index !== assignments.length - 1 && "border-b border-border/50 dark:border-white/[0.06]"
                  )}
                >
                  <span className="w-10">{getStatusIcon(status)}</span>
                  <span className="flex-1 text-foreground font-medium truncate">
                    {assignment.name}
                  </span>
                  <span className="w-16 text-right text-muted-foreground">
                    {formatPoints(assignment.weight)}%
                  </span>
                  <span className="w-20 text-right text-muted-foreground">
                    {assignment.dueDate ? (
                      format(new Date(assignment.dueDate), "MMM d")
                    ) : onUpdateDueDate ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:bg-muted dark:hover:bg-white/10 transition-colors">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={undefined}
                            onSelect={(date) => {
                              if (date) {
                                onUpdateDueDate(assignment.id, date);
                              }
                            }}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="w-16 text-right">
                    <button
                      onClick={() => (onScoreAssignment || onEditAssignment)(assignment)}
                      className={cn(
                        "px-2 py-1 rounded text-sm font-medium transition-colors",
                        assignment.score !== null
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10"
                      )}
                    >
                      {assignment.score !== null ? `${formatPoints(assignment.score)}%` : "Enter"}
                    </button>
                  </span>
                  <span className="w-20 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditAssignment(assignment)}
                      className="h-7 w-7"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteAssignment(assignment.id, assignment.name)}
                      className="h-7 w-7 text-muted-foreground hover:text-error"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
