import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetHeaderProps {
  title: string;
  onAction?: () => void;
  showArrow?: boolean;
  showPlus?: boolean;
  className?: string;
}

export function WidgetHeader({ 
  title, 
  onAction, 
  showArrow = true, 
  showPlus = false,
  className 
}: WidgetHeaderProps) {
  return (
    <div className={cn("widget-header", className)}>
      <div className="flex items-center gap-1">
        <span className="widget-title">{title}</span>
        {showArrow && (
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>
      {showPlus && onAction && (
        <button 
          onClick={onAction}
          className="add-button"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
