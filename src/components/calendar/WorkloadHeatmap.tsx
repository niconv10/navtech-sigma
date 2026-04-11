import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { WidgetHeader } from "@/components/ui/widget-header";

interface Assignment {
  id: string | number;
  name: string;
  course: string;
  color: string;
  date: Date;
  weight?: number;
}

interface WorkloadHeatmapProps {
  assignments: Assignment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function WorkloadHeatmap({
  assignments,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: WorkloadHeatmapProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAssignmentsForDate = (date: Date) => 
    assignments.filter((a) => isSameDay(a.date, date));

  const getTotalWeight = (date: Date) => {
    const dayAssignments = getAssignmentsForDate(date);
    return dayAssignments.reduce((sum, a) => sum + (a.weight || 100), 0);
  };

  const getHeatIntensity = (weight: number) => {
    if (weight === 0) return "bg-transparent";
    if (weight <= 50) return "bg-primary/20";
    if (weight <= 100) return "bg-primary/40";
    if (weight <= 200) return "bg-primary/60";
    return "bg-primary/80";
  };

  const monthAssignmentCount = assignments.filter(a => 
    isSameMonth(a.date, currentMonth)
  ).length;

  return (
    <div className="glass-widget p-6">
      <WidgetHeader 
        title={`WORKLOAD IN ${format(currentMonth, "MMMM").toUpperCase()}`} 
        showPlus 
      />

      {/* Big number */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{monthAssignmentCount}</span>
        <span className="text-muted-foreground ml-2">assignments</span>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              onMonthChange(new Date());
              onSelectDate(new Date());
            }}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
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
                "aspect-square p-1 rounded-lg flex flex-col items-center justify-center transition-all text-xs relative",
                isCurrentMonth ? "hover:bg-secondary" : "opacity-30",
                isSelected && "ring-2 ring-primary bg-primary/20",
                isToday && !isSelected && "ring-1 ring-primary/50",
                dayAssignments.length > 0 && isCurrentMonth && getHeatIntensity(totalWeight)
              )}
            >
              <span className={cn(
                "font-medium",
                isSelected ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </span>
              
              {/* Points indicator */}
              {dayAssignments.length > 0 && isCurrentMonth && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {totalWeight} pts
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <div className="w-3 h-3 rounded bg-primary/40" />
          <div className="w-3 h-3 rounded bg-primary/60" />
          <div className="w-3 h-3 rounded bg-primary/80" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
