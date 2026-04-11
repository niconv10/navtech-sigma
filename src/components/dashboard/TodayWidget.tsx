import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TodayWidget() {
  const navigate = useNavigate();
  const today = new Date();

  return (
    <div 
      className="glass-widget overflow-hidden cursor-pointer hover:border-border transition-colors"
      onClick={() => navigate('/calendar')}
    >
      {/* Header with divider */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="widget-title">Today</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
      </div>

      {/* Content - Compact */}
      <div className="px-4 py-5 text-center">
        {/* Day of week */}
        <div className="text-[10px] font-medium tracking-[2px] uppercase text-muted-foreground mb-1.5">
          {format(today, "EEEE")}
        </div>

        {/* Day number */}
        <div className="text-[40px] sm:text-[56px] font-extralight text-foreground leading-none my-2">
          {format(today, "d")}
        </div>

        {/* Month */}
        <div className="text-[10px] font-medium tracking-[2px] uppercase text-muted-foreground mt-1.5">
          {format(today, "MMMM")}
        </div>
      </div>
    </div>
  );
}
