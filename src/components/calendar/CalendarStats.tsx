import { cn } from "@/lib/utils";

interface CalendarStatsProps {
  examCount: number;
  assignmentCount: number;
  totalPoints: number;
}

export function CalendarStats({ examCount, assignmentCount, totalPoints }: CalendarStatsProps) {
  // Round points to 2 decimal places
  const formattedPoints = Math.round(totalPoints * 100) / 100;
  const displayPoints = formattedPoints % 1 === 0 ? formattedPoints.toString() : formattedPoints.toFixed(2).replace(/\.?0+$/, '');
  
  return (
    <div className="grid grid-cols-3 glass-widget overflow-hidden">
      <div className="p-6 text-center border-r border-white/6">
        <p className="text-3xl font-bold text-foreground">{examCount}</p>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Exams</p>
      </div>
      <div className="p-6 text-center border-r border-white/6">
        <p className="text-3xl font-bold text-foreground">{assignmentCount}</p>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Assignments</p>
      </div>
      <div className="p-6 text-center">
        <p className="text-3xl font-bold text-cyan-400">{displayPoints} pts</p>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Total Points</p>
      </div>
    </div>
  );
}
