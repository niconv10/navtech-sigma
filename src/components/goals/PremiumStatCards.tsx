import { Clock, BookOpen, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalsStore } from "@/stores/useGoalsStore";

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: 'cyan' | 'purple' | 'amber' | 'green';
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colorConfig = {
    cyan: {
      gradient: 'from-cyan-500/10 to-cyan-500/20',
      textColor: 'text-cyan-500',
    },
    purple: {
      gradient: 'from-violet-500/10 to-violet-500/20',
      textColor: 'text-violet-500',
    },
    amber: {
      gradient: 'from-amber-500/10 to-amber-500/20',
      textColor: 'text-amber-500',
    },
    green: {
      gradient: 'from-emerald-500/10 to-emerald-500/20',
      textColor: 'text-emerald-500',
    },
  };

  const { gradient, textColor } = colorConfig[color];

  return (
    <div 
      className={cn(
        "p-6 rounded-[20px] text-center transition-all duration-300 hover:scale-105 bg-gradient-to-br",
        gradient
      )}
    >
      <div className={cn("text-2xl mb-2", textColor)}>
        {icon}
      </div>
      <p 
        className={cn("text-[32px] font-extralight tracking-tight", textColor)}
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mt-2">
        {label}
      </p>
    </div>
  );
}

interface PremiumStatCardsProps {
  className?: string;
}

export function PremiumStatCards({ className }: PremiumStatCardsProps) {
  const { goalsData } = useGoalsStore();
  
  const totalHours = Math.round(goalsData.totalFocusMinutes / 60);
  const sessionCount = goalsData.focusSessions.length;
  const studyStreak = goalsData.studyStreak;

  return (
    <div className={cn("goals-widget p-6", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6 mx-auto" />}
          value={`${totalHours || 24}h`}
          label="Total Focus Time"
          color="cyan"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6 mx-auto" />}
          value={sessionCount || 48}
          label="Sessions Completed"
          color="purple"
        />
        <StatCard
          icon={<Flame className="w-6 h-6 mx-auto" />}
          value={studyStreak || 12}
          label="Day Streak"
          color="amber"
        />
        <StatCard
          icon={<Zap className="w-6 h-6 mx-auto" />}
          value={580}
          label="XP Earned"
          color="green"
        />
      </div>
    </div>
  );
}
