import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

interface WeekStripProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  assignmentDates?: Date[];
}

export function WeekStrip({ 
  selectedDate = new Date(), 
  onSelectDate,
  assignmentDates = []
}: WeekStripProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hasAssignment = (date: Date) => 
    assignmentDates.some(d => isSameDay(d, date));

  return (
    <div className="flex gap-0">
      {days.map((day, index) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const hasWork = hasAssignment(day);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate?.(day)}
            className={cn(
              "week-day-cell flex-1 flex flex-col items-center py-4 px-2 transition-all",
              index === 0 && "rounded-l-xl",
              index === 6 && "rounded-r-xl",
              isSelected 
                ? "bg-white/10 border border-white/20" 
                : "hover:bg-white/5",
              isToday && !isSelected && "bg-white/[0.05] border border-white/[0.15]"
            )}
          >
            <span className={cn(
              "text-xs font-medium mb-1",
              isSelected ? "text-white/80" : "text-muted-foreground"
            )}>
              {format(day, "EEE")}
            </span>
            <span className={cn(
              "text-lg font-semibold",
              isSelected ? "text-white" : "text-foreground"
            )}>
              {format(day, "d")}
            </span>
            {hasWork && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1",
                isSelected ? "bg-white" : "bg-[#F05A28]"
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}
