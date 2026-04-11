import { format, isSameDay } from "date-fns";
import { WidgetHeader } from "@/components/ui/widget-header";
import { getCategoryIcon, categorizeAssignment } from "@/lib/assignmentUtils";
import { cn } from "@/lib/utils";
import { AssignmentType } from "@/types";

interface Assignment {
  id: string | number;
  name: string;
  course: string;
  color: string;
  date: Date;
  time?: string;
  weight?: number;
  type?: AssignmentType;
}

interface UpcomingAssignmentsListProps {
  assignments: Assignment[];
  selectedDate?: Date;
  maxItems?: number;
}

export function UpcomingAssignmentsList({ 
  assignments, 
  selectedDate,
  maxItems = 10 
}: UpcomingAssignmentsListProps) {
  // Filter and sort assignments
  const upcomingAssignments = assignments
    .filter(a => a.date >= new Date() || (selectedDate && isSameDay(a.date, selectedDate)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxItems);

  return (
    <div className="glass-widget p-6 h-full">
      <WidgetHeader title="UPCOMING ASSIGNMENTS" showPlus />

      <div className="space-y-3">
        {upcomingAssignments.length > 0 ? (
          upcomingAssignments.map((assignment) => {
            // Auto-categorize if no type provided
            const type = assignment.type || categorizeAssignment(assignment.name);
            const IconComponent = getCategoryIcon(type);
            const isSelected = selectedDate && isSameDay(assignment.date, selectedDate);

            return (
              <div
                key={assignment.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-all",
                  isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-secondary/50"
                )}
              >
                {/* Category Icon */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${assignment.color}20` }}
                >
                  <IconComponent 
                    className="w-5 h-5" 
                    style={{ color: assignment.color }} 
                  />
                </div>

                {/* Assignment Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground text-sm truncate">
                      {assignment.name}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">
                      {assignment.weight || 100} pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {assignment.course} • Due {format(assignment.date, "MMM d")}
                    {assignment.time && ` at ${assignment.time}`}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No upcoming assignments</p>
          </div>
        )}
      </div>
    </div>
  );
}
