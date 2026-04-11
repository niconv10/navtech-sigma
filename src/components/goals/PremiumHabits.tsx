import { Check, Flame, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalsStore } from "@/stores/useGoalsStore";

interface PremiumHabitsProps {
  className?: string;
}

export function PremiumHabits({ className }: PremiumHabitsProps) {
  const { goalsData, toggleHabit } = useGoalsStore();
  const habits = goalsData.habits;
  
  const completedCount = habits.filter(h => h.completed).length;
  const progress = (completedCount / habits.length) * 100;

  return (
    <div className={cn("habits-widget", className)}>
      <div className="goals-widget-header">
        <h3 className="goals-widget-title">Daily Habits</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{habits.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-border/20 dark:bg-white/10 overflow-hidden mb-6">
        <div 
          className="h-full rounded-full transition-all duration-700"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #14B8A6, #0EA5E9)',
            boxShadow: '0 0 12px rgba(20, 184, 166, 0.4)',
          }}
        />
      </div>

      {/* Habits list */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <div
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300",
              habit.completed 
                ? "bg-emerald-500/10 dark:bg-emerald-500/15" 
                : "bg-secondary/30 hover:bg-secondary/50"
            )}
          >
            <button
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                habit.completed
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
            >
              {habit.completed && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            
            <span className="text-lg">{habit.emoji}</span>
            
            <span className={cn(
              "flex-1 text-sm font-medium transition-colors duration-300",
              habit.completed && "text-muted-foreground line-through"
            )}>
              {habit.name}
            </span>
            
            <div className="flex items-center gap-1.5 text-amber-500">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-semibold">{habit.streak}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add habit button */}
      <button className="w-full mt-4 p-3 rounded-xl border-2 border-dashed border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium">
        <Plus className="w-4 h-4" />
        Add Habit
      </button>
    </div>
  );
}
