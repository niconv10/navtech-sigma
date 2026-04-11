import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import { format, isAfter, isSameDay } from "date-fns";
import { getCategoryIcon, categorizeAssignment, CATEGORY_COLORS } from "@/lib/assignmentUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assignment {
  id: string | number;
  name: string;
  course: string;
  color: string;
  date: Date;
  weight?: number;
  type?: string;
  time?: string;
}

interface UpcomingSidebarProps {
  assignments: Assignment[];
  maxItems?: number;
}

export function UpcomingSidebar({ assignments, maxItems = 6 }: UpcomingSidebarProps) {
  const today = new Date();
  
  const upcomingAssignments = assignments
    .filter((a) => isAfter(a.date, today) || isSameDay(a.date, today))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxItems);

  return (
    <div className="glass-widget overflow-hidden h-full">
      {/* Header with divider */}
      <div className="calendar-widget-header px-6 pt-6">
        <span className="calendar-widget-title">Upcoming Assignments</span>
      </div>

      {/* List */}
      <div className="px-4">
        {upcomingAssignments.length > 0 ? (
          upcomingAssignments.map((assignment) => {
            const type = assignment.type || categorizeAssignment(assignment.name);
            const Icon = getCategoryIcon(type as any);
            const colorClass = CATEGORY_COLORS[type as keyof typeof CATEGORY_COLORS] || "bg-gray-500";
            const dueDate = format(assignment.date, "MMM d");
            
            return (
              <div
                key={assignment.id}
                className="list-item flex items-center gap-3 hover:bg-secondary/50 transition-colors -mx-2 px-2 rounded-lg"
              >
                {/* Icon */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                  colorClass
                )}>
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {assignment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.course} • Due {dueDate}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-accent">
                    {assignment.weight || 0} pts
                  </p>
                </div>

                {/* Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No upcoming assignments</p>
          </div>
        )}
      </div>
    </div>
  );
}
