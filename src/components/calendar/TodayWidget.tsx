import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";

interface TodayWidgetProps {
  assignmentsToday?: number;
}

export function TodayWidget({ assignmentsToday = 0 }: TodayWidgetProps) {
  const today = new Date();
  const dayName = format(today, "EEEE").toUpperCase();
  const dayNumber = format(today, "d");
  const monthName = format(today, "MMMM").toUpperCase();

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-widget-header">
        <span className="calendar-widget-title">Today</span>
      </div>

      {/* Content */}
      <div className="today-widget-content">
        <p className="today-day-name">{dayName}</p>
        <p className="today-day-number">{dayNumber}</p>
        <p className="today-month">{monthName}</p>
      </div>

      {/* Footer */}
      <div className="today-widget-footer">
        {assignmentsToday === 0 ? (
          <p className="today-status">
            <CheckCircle2 className="inline-block w-4 h-4 mr-2 text-emerald-500" />
            Nothing due today
          </p>
        ) : (
          <p className="today-status">
            <span className="text-amber-400 font-medium">{assignmentsToday}</span> assignment{assignmentsToday > 1 ? 's' : ''} due today
          </p>
        )}
      </div>
    </div>
  );
}
