import { cn } from "@/lib/utils";

interface GradingScaleWidgetProps {
  gradingScale: Record<string, number>;
  currentGrade: number;
}

export function GradingScaleWidget({ gradingScale, currentGrade }: GradingScaleWidgetProps) {
  // Defensive normalization in case {min, max} objects slip through
  const normalizedScale: Record<string, number> = {};
  for (const [key, value] of Object.entries(gradingScale)) {
    normalizedScale[key] = typeof value === 'number' ? value : typeof value === 'object' && value && 'min' in value ? Number((value as any).min) || 0 : 0;
  }
  const sortedGrades = Object.entries(normalizedScale).sort((a, b) => b[1] - a[1]);

  // Find the current grade row
  const getCurrentGradeIndex = () => {
    if (currentGrade <= 0) return -1;
    for (let i = 0; i < sortedGrades.length; i++) {
      const [_, min] = sortedGrades[i];
      const nextMin = sortedGrades[i + 1]?.[1] ?? 0;
      if (currentGrade >= min) {
        return i;
      }
    }
    return sortedGrades.length - 1;
  };

  const currentGradeIndex = getCurrentGradeIndex();

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Grading Scale</span>
      </div>
      <div className="p-5">
        <div>
          {sortedGrades.map(([grade, min], index) => {
            const isCurrentGrade = index === currentGradeIndex && currentGrade > 0;
            const isLast = index === sortedGrades.length - 1;
            
            return (
              <div 
                key={grade} 
                className={cn(
                  "flex justify-between py-3 px-3 -mx-3 transition-colors",
                  !isLast && "border-b border-border/50 dark:border-white/[0.06]",
                  isCurrentGrade && "bg-primary/10 rounded-lg"
                )}
              >
                <span className={cn(
                  "text-sm",
                  isCurrentGrade ? "text-primary font-semibold" : "text-foreground"
                )}>
                  {grade}
                </span>
                <span className={cn(
                  "text-sm",
                  isCurrentGrade ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {min}%+
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
