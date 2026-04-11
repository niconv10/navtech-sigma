import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  iconColor?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = "neutral",
  iconColor = "bg-primary/10 text-primary",
  className,
}: StatCardProps) {
  return (
    <div className={cn("stat-card animate-fade-in", className)}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {change && (
        <p
          className={cn(
            "text-sm font-medium mt-2",
            changeType === "positive" && "text-success",
            changeType === "negative" && "text-error",
            changeType === "neutral" && "text-muted-foreground"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
