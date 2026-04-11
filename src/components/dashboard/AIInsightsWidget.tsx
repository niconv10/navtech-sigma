import { Sparkles, ChevronRight } from "lucide-react";
import { AIInsight } from "@/lib/aiAdvisor";

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  onViewAll: () => void;
}

export function AIInsightsWidget({ insights, onViewAll }: AIInsightsWidgetProps) {
  // Get the most important insight
  const topInsight = insights.find(i => i.priority === 'critical' || i.priority === 'high') || insights[0];
  
  return (
    <div className="glass-widget overflow-hidden ai-insights-mini">
      <div className="ai-insights-header">
        <div className="ai-insights-icon">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="ai-insights-title-group">
          <div className="ai-insights-title">AI Insights</div>
          <div className="ai-insights-subtitle">
            {insights.length} recommendation{insights.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </div>
      
      <div className="ai-insight-preview">
        {topInsight ? (
          <>
            <p className="ai-insight-message">{topInsight.message}</p>
            <button className="ai-insight-cta" onClick={onViewAll}>
              View all insights
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <p className="ai-insight-message text-muted-foreground">
            Add more assignments to get personalized AI recommendations.
          </p>
        )}
      </div>
    </div>
  );
}
