import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  progress?: number;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  progress,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("glass-widget overflow-hidden", className)}>
      {/* Header with divider - Compact */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="widget-title">{title}</span>
        {Icon && <Icon className={cn("w-3.5 h-3.5", iconColor)} />}
      </div>
      
      {/* Content - Compact */}
      <div className="px-4 py-4">
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-light text-foreground leading-tight">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground ml-0.5">{subtitle}</span>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-2.5">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              {Math.round(progress)}% complete
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
