import { Check, BookOpen, FileText, GraduationCap, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilestoneProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: 'done' | 'current' | 'upcoming';
}

function Milestone({ icon, label, sublabel, status }: MilestoneProps) {
  const config = {
    done: {
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
      textColor: 'text-foreground',
      scale: '',
    },
    current: {
      iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      iconShadow: '0 8px 24px rgba(6, 182, 212, 0.5)',
      textColor: 'text-foreground',
      scale: 'scale-110',
    },
    upcoming: {
      iconBg: 'bg-secondary/50 dark:bg-white/5',
      iconShadow: 'none',
      textColor: 'text-muted-foreground',
      scale: '',
    },
  };

  const { iconBg, iconShadow, textColor, scale } = config[status];

  return (
    <div className="flex flex-col items-center w-[16%]">
      <div 
        className={cn(
          "w-16 h-16 rounded-[18px] flex items-center justify-center transition-all duration-500",
          iconBg,
          scale
        )}
        style={{ boxShadow: iconShadow }}
      >
        <div className={cn("w-5 h-5", status === 'upcoming' ? 'text-muted-foreground' : 'text-white')}>
          {icon}
        </div>
      </div>
      <p className={cn("text-sm font-semibold mt-4 text-center", textColor)}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        {sublabel}
      </p>
    </div>
  );
}

interface PremiumSemesterJourneyProps {
  className?: string;
}

export function PremiumSemesterJourney({ className }: PremiumSemesterJourneyProps) {
  const milestones = [
    { icon: <Calendar className="w-full h-full" />, label: "Classes Start", sublabel: "Jan 6", status: 'done' as const },
    { icon: <FileText className="w-full h-full" />, label: "Add/Drop", sublabel: "Jan 10", status: 'done' as const },
    { icon: <BookOpen className="w-full h-full" />, label: "Midterms", sublabel: "Mar 1-8", status: 'current' as const },
    { icon: <Calendar className="w-full h-full" />, label: "Spring Break", sublabel: "Mar 15-22", status: 'upcoming' as const },
    { icon: <GraduationCap className="w-full h-full" />, label: "Finals", sublabel: "Apr 28", status: 'upcoming' as const },
    { icon: <Trophy className="w-full h-full" />, label: "Semester End", sublabel: "May 2", status: 'upcoming' as const },
  ];

  // Calculate progress (40% through semester)
  const progress = 40;

  return (
    <div className={cn("journey-widget p-10", className)}>
      <div className="goals-widget-header mb-10">
        <h3 className="goals-widget-title">Semester Journey</h3>
      </div>

      <div className="relative">
        {/* Track */}
        <div className="absolute top-8 left-[10%] right-[10%] h-1 rounded-full bg-border/20 dark:bg-white/10" />
        
        {/* Progress */}
        <div 
          className="absolute top-8 left-[10%] h-1 rounded-full"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #10B981, #06B6D4)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
          }}
        />

        {/* Milestones */}
        <div className="flex justify-between relative z-10">
          {milestones.map((milestone, index) => (
            <Milestone key={index} {...milestone} />
          ))}
        </div>
      </div>
    </div>
  );
}
