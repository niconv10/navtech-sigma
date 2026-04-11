import { AlertTriangle, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  type: 'priority' | 'pattern' | 'success';
  label: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function InsightCard({ type, label, title, description, actionLabel, onAction }: InsightCardProps) {
  const config = {
    priority: {
      icon: AlertTriangle,
      gradient: 'from-card to-red-500/10 dark:to-red-500/15',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      iconShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
      labelColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      buttonShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
    },
    pattern: {
      icon: TrendingUp,
      gradient: 'from-card to-violet-500/10 dark:to-violet-500/15',
      iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600',
      iconShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
      labelColor: 'text-violet-500',
      buttonBg: 'bg-violet-500 hover:bg-violet-600',
      buttonShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
    },
    success: {
      icon: Sparkles,
      gradient: 'from-card to-emerald-500/10 dark:to-emerald-500/15',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
      labelColor: 'text-emerald-500',
      buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
      buttonShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
    },
  };

  const { icon: Icon, gradient, iconBg, iconShadow, labelColor, buttonBg, buttonShadow } = config[type];

  return (
    <div 
      className={cn(
        "p-6 rounded-[20px] bg-gradient-to-br flex items-start gap-5 transition-all duration-300 hover:translate-x-1",
        gradient
      )}
    >
      <div 
        className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", iconBg)}
        style={{ boxShadow: iconShadow }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("text-[10px] font-semibold tracking-[0.15em] uppercase mb-1", labelColor)}>
          {label}
        </p>
        <h4 className="text-[17px] font-semibold text-foreground mb-1">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && (
        <button 
          onClick={onAction}
          className={cn(
            "px-5 py-2.5 rounded-full text-sm font-semibold text-white flex-shrink-0 transition-all duration-300 hover:scale-105",
            buttonBg
          )}
          style={{ boxShadow: buttonShadow }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface PremiumAIInsightsProps {
  className?: string;
}

export function PremiumAIInsights({ className }: PremiumAIInsightsProps) {
  const insights = [
    {
      type: 'priority' as const,
      label: 'Priority',
      title: 'Physics exam tomorrow',
      description: 'You have 3 topics left to review. Start with Electromagnetic Waves – it carries 25% weight.',
      actionLabel: 'Start Review',
    },
    {
      type: 'pattern' as const,
      label: 'Pattern Detected',
      title: 'Peak performance at 9-11 AM',
      description: 'Your focus sessions are 40% more effective during morning hours. Consider scheduling difficult topics then.',
    },
    {
      type: 'success' as const,
      label: 'Achievement',
      title: 'Data Structures mastery',
      description: 'Your grades in algorithm-related assignments have improved 15% over the last month. Keep it up!',
    },
  ];

  return (
    <div className={cn("ai-insights-widget", className)}>
      <div className="goals-widget-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="goals-widget-title">AI Insights</h3>
        </div>
        <button className="goals-widget-action">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <InsightCard key={index} {...insight} />
        ))}
      </div>
    </div>
  );
}
