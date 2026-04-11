import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, List, Plus } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { Button } from "@/components/ui/button";
import { getCategoryIcon, categorizeAssignment } from "@/lib/assignmentUtils";
import { hexToRgba } from "@/lib/courseColors";

interface Assignment {
  id: string | number;
  name: string;
  course: string;
  color: string;
  date: Date;
  weight?: number;
  type?: string;
}

interface CalendarGridProps {
  assignments: Assignment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  viewMode: "calendar" | "list";
  onViewModeChange: (mode: "calendar" | "list") => void;
}

export function CalendarGrid({
  assignments,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  viewMode,
  onViewModeChange,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAssignmentsForDate = (date: Date) => 
    assignments.filter((a) => isSameDay(a.date, date));

  const getTotalWeight = (date: Date) => {
    const dayAssignments = getAssignmentsForDate(date);
    return dayAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  };

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-widget-header">
        <span className="calendar-widget-title">
          Workload in {format(currentMonth, "MMMM")}
        </span>
        <div className="calendar-widget-actions">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "calendar-action-btn",
              viewMode === "calendar" && "active"
            )}
            onClick={() => onViewModeChange("calendar")}
          >
            <CalendarDays className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "calendar-action-btn",
              viewMode === "list" && "active"
            )}
            onClick={() => onViewModeChange("list")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="calendar-action-btn"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="calendar-month-nav">
        <Button
          variant="ghost"
          size="icon"
          className="calendar-nav-btn"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="calendar-month-title">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="calendar-nav-btn"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-container">
        {/* Weekday Headers */}
        <div className="calendar-weekdays">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, i) => (
            <div key={i} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="calendar-days">
          {days.map((day) => {
            const dayAssignments = getAssignmentsForDate(day);
            const totalWeight = getTotalWeight(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "calendar-day",
                  !isCurrentMonth && "other-month",
                  isToday && "today",
                  isSelected && "selected",
                  dayAssignments.length > 0 && "has-events"
                )}
              >
                <span className="calendar-day-number">
                  {format(day, "d")}
                </span>
                
                {/* Event indicators - use course colors */}
                {dayAssignments.length > 0 && isCurrentMonth && (
                  <>
                    <div className="calendar-day-events">
                      {dayAssignments.slice(0, 4).map((a, i) => (
                        <span 
                          key={i} 
                          className="event-dot"
                          style={{ backgroundColor: a.color }}
                        />
                      ))}
                    </div>
                    {totalWeight > 0 && (
                      <span className="calendar-day-points">
                        {Math.round(totalWeight * 100) / 100}pts
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
