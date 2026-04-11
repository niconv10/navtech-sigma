import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface AssignmentRowProps {
  name: string;
  course: string;
  courseColor: string;
  dueDate: string;
  dueTime: string;
  status: "upcoming" | "due-soon" | "overdue" | "completed";
  className?: string;
}

const statusConfig = {
  upcoming: {
    icon: Clock,
    label: "Upcoming",
    color: "text-info bg-info-light",
  },
  "due-soon": {
    icon: AlertCircle,
    label: "Due Soon",
    color: "text-warning bg-warning-light",
  },
  overdue: {
    icon: AlertCircle,
    label: "Overdue",
    color: "text-error bg-error-light",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-success bg-success-light",
  },
};

export function AssignmentRow({
  name,
  course,
  courseColor,
  dueDate,
  dueTime,
  status,
  className,
}: AssignmentRowProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      "list-item flex items-center gap-4 hover:bg-secondary/30 transition-colors rounded-lg px-2 -mx-2",
      className
    )}>
      <div
        className="w-2 h-10 rounded-full shrink-0"
        style={{ backgroundColor: courseColor }}
      />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{name}</p>
        <p className="text-sm text-secondary-content">{course}</p>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-foreground">{dueDate}</p>
        <p className="text-xs text-muted-content">{dueTime}</p>
      </div>
      
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0",
        config.color
      )}>
        <StatusIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{config.label}</span>
      </div>
    </div>
  );
}
