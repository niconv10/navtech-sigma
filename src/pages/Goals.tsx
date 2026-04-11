import { MainLayout } from "@/components/layout/MainLayout";
import { PremiumFocusTimer } from "@/components/goals/PremiumFocusTimer";
import { PremiumGPAGoal } from "@/components/goals/PremiumGPAGoal";
import { PremiumHabits } from "@/components/goals/PremiumHabits";
import { PremiumAIInsights } from "@/components/goals/PremiumAIInsights";
import { PremiumSemesterJourney } from "@/components/goals/PremiumSemesterJourney";
import { PremiumStatCards } from "@/components/goals/PremiumStatCards";
import { PremiumAchievements } from "@/components/goals/PremiumAchievements";
import { PremiumActivityGrid } from "@/components/goals/PremiumActivityGrid";
import { useGoalsSync } from "@/hooks/useGoalsSync";

export default function Goals() {
  // Syncs goals data with Supabase (load on mount, save on change, migrate localStorage)
  useGoalsSync();

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Goals & Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Stay focused and track your achievements.</p>
      </div>

      {/* Main Grid - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <PremiumGPAGoal />
        <PremiumFocusTimer />
        <PremiumHabits />
      </div>

      {/* AI Insights */}
      <div className="mb-6">
        <PremiumAIInsights />
      </div>

      {/* Semester Journey */}
      <div className="mb-6">
        <PremiumSemesterJourney />
      </div>

      {/* Activity & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PremiumActivityGrid />
        <PremiumAchievements />
      </div>

      {/* Stats Summary */}
      <PremiumStatCards />
    </MainLayout>
  );
}
