import { Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightCardProps {
  insight: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AIInsightCard({ insight, actionLabel = "Ask AI", onAction }: AIInsightCardProps) {
  return (
    <div className="insight-card animate-fade-in">
      <div className="widget-header !border-b-primary/20">
        <div className="flex items-center gap-1">
          <span className="widget-title">AI INSIGHT</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight}
          </p>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onAction}
        className="mt-4 w-full justify-between hover:bg-primary/10 text-primary"
      >
        {actionLabel}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
