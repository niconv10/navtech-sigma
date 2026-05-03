import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

interface GPAChartWidgetProps {
  currentGPA: number;
  targetGPA: number;
}

const timeFilters = ["1W", "1M", "3M", "SEM", "ALL"] as const;
type TimeFilter = typeof timeFilters[number];

// Get X-axis labels based on selected time filter
const getXAxisLabels = (filter: TimeFilter): string[] => {
  switch (filter) {
    case '1W':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    case '1M':
      return ['W1', 'W2', 'W3', 'W4'];
    case '3M':
      return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    case 'SEM':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    case 'ALL':
      return ['Fall 24', 'Spr 25', 'Fall 25', 'Spr 26'];
    default:
      return ['W1', 'W2', 'W3', 'W4'];
  }
};

export function GPAChartWidget({ currentGPA, targetGPA }: GPAChartWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("SEM");
  const [isOpen, setIsOpen] = useState(true);
  const { resolvedMode } = useTheme();
  const isDark = resolvedMode === "dark";

  // Generate mock GPA data based on filter
  const chartData = useMemo(() => {
    const labels = getXAxisLabels(activeFilter);
    const baseGPA = Math.max(2.0, currentGPA - 0.8);
    
    return labels.map((label, i) => {
      const progress = i / (labels.length - 1);
      // Create an S-curve growth
      const sCurve = progress < 0.3 
        ? progress * 1.5 
        : progress < 0.7 
          ? 0.45 + (progress - 0.3) * 1.2
          : 0.93 + (progress - 0.7) * 0.23;
      
      const gpa = baseGPA + (currentGPA - baseGPA) * sCurve;
      
      return {
        label,
        gpa: Math.min(4.0, Math.max(0, gpa)),
      };
    });
  }, [currentGPA, activeFilter]);

  const gpaChange = currentGPA - (chartData[0]?.gpa || currentGPA);
  const isPositive = gpaChange >= 0;

  // Theme-aware colors
  const chartLineColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(26, 26, 26, 0.8)";
  const chartGridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)";
  const chartTickColor = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.5)";
  const gradientStartColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 26, 26, 0.1)";
  const gradientEndColor = isDark ? "rgba(255, 255, 255, 0)" : "rgba(26, 26, 26, 0)";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="glass-widget overflow-hidden">
      {/* Header with divider */}
      <div className={`px-6 py-4 ${isOpen ? 'border-b border-border' : ''} flex items-center justify-between`}>
        <span className="widget-title">GPA Journey</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? '+' : ''}{gpaChange.toFixed(2)}
          </span>
          <CollapsibleTrigger asChild>
            <button className="p-1 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
            </button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        {/* Content - More prominent */}
        <div className="p-4 sm:p-6">
          {/* Main GPA Value - Larger like Origin's NET WORTH */}
          <div className="mb-4 sm:mb-6">
            <span className="text-[38px] sm:text-[56px] font-light text-foreground tracking-tight leading-none">
              {currentGPA.toFixed(2)}
            </span>
            <span className="text-muted-foreground/60 ml-2 text-base sm:text-lg">/ 4.00</span>
          </div>

        {/* Chart - Taller for more prominence */}
        <div className="h-52 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientStartColor} />
                  <stop offset="100%" stopColor={gradientEndColor} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartGridColor}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: chartTickColor }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 4]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: chartTickColor }}
                ticks={[0, 1, 2, 3, 4]}
                width={35}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [value.toFixed(2), 'GPA']}
              />
              <Area
                type="monotone"
                dataKey="gpa"
                stroke={chartLineColor}
                strokeWidth={2}
                fill="url(#gpaGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time Filters */}
        <div className="flex items-center justify-center gap-1 mt-4">
          {timeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${
                activeFilter === filter
                  ? 'bg-secondary border-border text-foreground'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

          {/* Target indicator */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Target GPA</span>
            <span className="text-sm font-medium text-foreground">{targetGPA.toFixed(2)}</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
