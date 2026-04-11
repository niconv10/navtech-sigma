import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  color?: "primary" | "accent" | "success" | "warning" | "error" | "gradient";
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  gradient: "gradient-primary",
};

const bgColorMap = {
  primary: "bg-primary/20",
  accent: "bg-accent/20",
  success: "bg-success/20",
  warning: "bg-warning/20",
  error: "bg-error/20",
  gradient: "bg-muted",
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  progress,
  className,
  showLabel = false,
  label,
  color = "primary",
  size = "md",
}: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full overflow-hidden", bgColorMap[color], sizeMap[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            colorMap[color]
          )}
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </div>
  );
}
