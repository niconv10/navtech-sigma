import { useMemo } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  FlaskConical, 
  ClipboardCheck, 
  UserCheck,
  FileText,
  FolderKanban,
  MessageSquare,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import type { Assignment, AssignmentType } from "@/types";

interface UpcomingDeadlinesWidgetProps {
  assignments: Assignment[];
  onViewAll?: () => void;
}

const TYPE_ICONS: Record<AssignmentType, React.ElementType> = {
  exam: GraduationCap,
  homework: BookOpen,
  lab: FlaskConical,
  quiz: ClipboardCheck,
  participation: UserCheck,
  paper: FileText,
  project: FolderKanban,
  discussion: MessageSquare,
  presentation: UserCheck,
  midterm: GraduationCap,
  final: GraduationCap,
  other: MoreHorizontal,
};

export function UpcomingDeadlinesWidget({ assignments, onViewAll }: UpcomingDeadlinesWidgetProps) {
  const upcomingAssignments = useMemo(() => {
    const now = new Date();
    return assignments
      .filter(a => a.score === null && a.dueDate && isAfter(new Date(a.dueDate), now))
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [assignments]);

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = addDays(now, 1);
    
    if (isBefore(date, addDays(now, 1)) && isAfter(date, now)) {
      return "Tomorrow";
    }
    if (isBefore(date, addDays(now, 7))) {
      return format(date, "EEEE");
    }
    return format(date, "MMM d");
  };

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Upcoming Deadlines</span>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="widget-header-action"
          >
            View All
          </button>
        )}
      </div>
      <div className="px-5 pb-5">
        {upcomingAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No upcoming deadlines
            </p>
            <p className="text-xs text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div>
            {upcomingAssignments.map((assignment, index) => {
              const Icon = TYPE_ICONS[assignment.type] || MoreHorizontal;
              const isLast = index === upcomingAssignments.length - 1;
              return (
                <div 
                  key={assignment.id} 
                  className={`flex items-center gap-3 py-3 ${!isLast ? 'border-b border-border/50 dark:border-white/[0.06]' : ''}`}
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {assignment.name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {assignment.dueDate && formatDueDate(assignment.dueDate)}
                  </span>
                  <span className="text-xs font-medium text-foreground shrink-0">
                    {assignment.weight}%
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
