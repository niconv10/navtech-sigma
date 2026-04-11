import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalsStore } from "@/stores/useGoalsStore";

interface PremiumAchievementsProps {
  className?: string;
}

export function PremiumAchievements({ className }: PremiumAchievementsProps) {
  const { goalsData } = useGoalsStore();
  const achievements = goalsData.achievements;

  return (
    <div className={cn("achievements-widget", className)}>
      <div className="goals-widget-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <h3 className="goals-widget-title">Achievements</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "flex flex-col items-center p-5 rounded-2xl transition-all duration-300 hover:scale-105",
              achievement.unlocked
                ? "bg-gradient-to-br from-amber-500/10 to-orange-500/15 border border-amber-500/20"
                : "bg-secondary/30 dark:bg-white/5 opacity-60"
            )}
          >
            <span className={cn(
              "text-4xl mb-3 transition-all duration-300",
              !achievement.unlocked && "grayscale"
            )}>
              {achievement.emoji}
            </span>
            <p className="text-xs font-semibold text-center text-foreground mb-1">
              {achievement.name}
            </p>
            {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
              <div className="w-full mt-3">
                <div className="h-1.5 rounded-full bg-border/30 dark:bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ 
                      width: `${(achievement.progress / achievement.target) * 100}%`,
                      boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {achievement.progress}/{achievement.target}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
