import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Generate activity data (12 weeks x 7 days)
const generateActivityData = () => {
  const data = [];
  for (let week = 0; week < 12; week++) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      weekData.push(Math.floor(Math.random() * 5)); // 0-4 activity level
    }
    data.push(weekData);
  }
  return data;
};

interface PremiumActivityGridProps {
  className?: string;
}

export function PremiumActivityGrid({ className }: PremiumActivityGridProps) {
  const activityData = generateActivityData();

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-secondary/50 dark:bg-white/5';
      case 1:
        return 'bg-primary/20';
      case 2:
        return 'bg-primary/40';
      case 3:
        return 'bg-primary/70';
      case 4:
        return 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]';
      default:
        return 'bg-secondary/50';
    }
  };

  return (
    <div className={cn("activity-widget", className)}>
      <div className="goals-widget-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <h3 className="goals-widget-title">Study Activity</h3>
        </div>
      </div>

      {/* Activity grid */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {activityData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((level, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "w-4 h-4 rounded-sm transition-all duration-300 hover:scale-110",
                  getLevelColor(level)
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-6 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn("w-3 h-3 rounded-sm", getLevelColor(level))}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
