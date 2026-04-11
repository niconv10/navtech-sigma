import { ProgressRing } from "@/components/ui/progress-ring";
import { TrendingUp } from "lucide-react";

interface GPACardProps {
  currentGPA: number;
  targetGPA: number;
  change: number;
}

export function GPACard({ currentGPA, targetGPA, change }: GPACardProps) {
  const progress = (currentGPA / 4.0) * 100;
  
  return (
    <div className="stat-card animate-fade-in stat-glow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current GPA</p>
          <p className="text-xs text-muted-foreground mt-1">Target: {targetGPA.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-1 text-success text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          +{change.toFixed(2)}
        </div>
      </div>
      
      <div className="flex justify-center">
        <ProgressRing progress={progress} size={140} strokeWidth={10} color="primary">
          <div className="text-center">
            <span className="text-4xl font-bold text-foreground">{currentGPA.toFixed(2)}</span>
            <p className="text-xs text-muted-foreground mt-1">of 4.0</p>
          </div>
        </ProgressRing>
      </div>
    </div>
  );
}
