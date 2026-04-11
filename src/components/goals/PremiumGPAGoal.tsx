import { cn } from "@/lib/utils";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { useAuth } from "@/hooks/useAuth";
import { calculateGPA } from "@/lib/gradeUtils";

interface PremiumGPAGoalProps {
  className?: string;
}

export function PremiumGPAGoal({ className }: PremiumGPAGoalProps) {
  const { courses } = useSemesterStore();
  const { profile } = useAuth();

  const currentGPA = courses.length > 0 ? calculateGPA(courses) : 3.72;
  const targetGPA = profile?.gpa_goal ?? 3.80;
  const progress = Math.min((currentGPA / targetGPA) * 100, 100);
  const gpaGap = targetGPA - currentGPA;
  
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("gpa-goal-widget", className)}>
      <div className="goals-widget-header">
        <h3 className="goals-widget-title">GPA Goal</h3>
      </div>
      
      {/* Progress ring */}
      <div className="relative w-[180px] h-[180px] mx-auto mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          {/* Track */}
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            strokeWidth="8"
            className="stroke-border/20 dark:stroke-white/10"
          />
          {/* Progress */}
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-primary"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              filter: 'drop-shadow(0 0 12px hsl(var(--primary) / 0.4))',
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="text-[48px] font-extralight tracking-tight text-foreground"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {currentGPA.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {targetGPA.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center">
        {gpaGap > 0 ? (
          <p className="text-sm text-muted-foreground">
            You need an average of{" "}
            <span className="font-semibold text-primary">
              {Math.min(4.0, currentGPA + gpaGap * 0.5).toFixed(2)}
            </span>{" "}
            this semester
          </p>
        ) : (
          <p className="text-sm text-emerald-500 font-medium">
            🎉 You've reached your goal!
          </p>
        )}
      </div>
    </div>
  );
}
