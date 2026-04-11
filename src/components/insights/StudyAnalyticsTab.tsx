import { useState, useMemo } from "react";
import { 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Trophy, 
  Zap, 
  Target,
  ChevronRight,
  Sparkles,
  Timer,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalsStore } from "@/stores/useGoalsStore";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { getColorByIndex } from "@/lib/courseColors";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// Mock study analytics data
const mockStudyData = {
  totalHours: 110,
  totalSessions: 156,
  avgPerWeek: 18.3,
  weeklyChange: 12,
  bestDay: 'Tuesday',
  peakTime: '9-11 AM',
  weeklyPattern: [
    { day: 'Mon', hours: 3.5, highlight: false },
    { day: 'Tue', hours: 4.8, highlight: true },
    { day: 'Wed', hours: 3.2, highlight: false },
    { day: 'Thu', hours: 4.2, highlight: false },
    { day: 'Fri', hours: 2.8, highlight: false },
    { day: 'Sat', hours: 2.0, highlight: false },
    { day: 'Sun', hours: 3.5, highlight: false },
  ],
  hourlyPattern: [
    { hour: '6AM', intensity: 10 },
    { hour: '7AM', intensity: 25 },
    { hour: '8AM', intensity: 60 },
    { hour: '9AM', intensity: 95 },
    { hour: '10AM', intensity: 100 },
    { hour: '11AM', intensity: 85 },
    { hour: '12PM', intensity: 45 },
    { hour: '1PM', intensity: 40 },
    { hour: '2PM', intensity: 70 },
    { hour: '3PM', intensity: 75 },
    { hour: '4PM', intensity: 60 },
    { hour: '5PM', intensity: 35 },
  ],
};

interface StudyAnalyticsTabProps {
  className?: string;
}

export function StudyAnalyticsTab({ className }: StudyAnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('semester');
  const { goalsData } = useGoalsStore();
  const { courses } = useSemesterStore();

  // Calculate course distribution from focus sessions
  const courseDistribution = useMemo(() => {
    const distribution = courses.length > 0 
      ? courses.map((course, index) => ({
          id: course.id,
          code: course.code,
          name: course.name,
          hours: Math.round(Math.random() * 30 + 10),
          color: course.color || getColorByIndex(index),
        }))
      : [
          { id: '1', code: 'COP3530', name: 'Data Structures', hours: 45, color: '#14B8A6' },
          { id: '2', code: 'MAP2302', name: 'Differential Equations', hours: 32, color: '#8B5CF6' },
          { id: '3', code: 'PHY2049', name: 'Physics II', hours: 18, color: '#3B82F6' },
          { id: '4', code: 'STA3032', name: 'Probability & Statistics', hours: 15, color: '#F59E0B' },
        ];
    
    const total = distribution.reduce((sum, c) => sum + c.hours, 0);
    return distribution.map(c => ({ ...c, percent: Math.round((c.hours / total) * 100) }));
  }, [courses]);

  const totalHours = courseDistribution.reduce((sum, c) => sum + c.hours, 0);

  // Correlation data
  const correlationData = [
    { code: 'COP3530', name: 'Data Structures', hours: 45, grade: 94.8, correlation: 'strong', letter: 'A' },
    { code: 'MAP2302', name: 'Differential Equations', hours: 32, grade: 88.0, correlation: 'strong', letter: 'B+' },
    { code: 'PHY2049', name: 'Physics II', hours: 18, grade: 82.0, correlation: 'moderate', letter: 'B-' },
    { code: 'STA3032', name: 'Probability & Statistics', hours: 15, grade: 91.5, correlation: 'weak', letter: 'A-' },
  ];

  const maxBarHeight = 140;

  // Metric cards data with brighter dark mode colors
  const metricsData = [
    { icon: Clock, value: `${mockStudyData.totalHours}h`, label: 'Total Hours', sub: 'This semester', colorClass: 'cyan' },
    { icon: BookOpen, value: String(mockStudyData.totalSessions), label: 'Sessions', sub: 'Completed', colorClass: 'purple' },
    { icon: TrendingUp, value: `${mockStudyData.avgPerWeek}h`, label: 'Avg/Week', sub: `+${mockStudyData.weeklyChange}%`, colorClass: 'green', subPositive: true },
    { icon: Trophy, value: mockStudyData.bestDay, label: 'Best Day', sub: 'Most productive', colorClass: 'amber' },
    { icon: Zap, value: mockStudyData.peakTime, label: 'Peak Time', sub: 'Most focused', colorClass: 'red' },
  ];

  // Light mode colors
  const colorMapLight = {
    cyan: { main: '#06B6D4', bg10: 'rgba(6, 182, 212, 0.1)', bg15: 'rgba(6, 182, 212, 0.15)', bg30: 'rgba(6, 182, 212, 0.3)' },
    purple: { main: '#8B5CF6', bg10: 'rgba(139, 92, 246, 0.1)', bg15: 'rgba(139, 92, 246, 0.15)', bg30: 'rgba(139, 92, 246, 0.3)' },
    green: { main: '#10B981', bg10: 'rgba(16, 185, 129, 0.1)', bg15: 'rgba(16, 185, 129, 0.15)', bg30: 'rgba(16, 185, 129, 0.3)' },
    amber: { main: '#F59E0B', bg10: 'rgba(245, 158, 11, 0.1)', bg15: 'rgba(245, 158, 11, 0.15)', bg30: 'rgba(245, 158, 11, 0.3)' },
    red: { main: '#EF4444', bg10: 'rgba(239, 68, 68, 0.1)', bg15: 'rgba(239, 68, 68, 0.15)', bg30: 'rgba(239, 68, 68, 0.3)' },
  };

  // Dark mode colors - BRIGHTER
  const colorMapDark = {
    cyan: { main: '#22D3EE', bg10: 'rgba(6, 182, 212, 0.15)', bg15: 'rgba(6, 182, 212, 0.2)', bg30: 'rgba(6, 182, 212, 0.35)' },
    purple: { main: '#A78BFA', bg10: 'rgba(139, 92, 246, 0.15)', bg15: 'rgba(139, 92, 246, 0.2)', bg30: 'rgba(139, 92, 246, 0.35)' },
    green: { main: '#34D399', bg10: 'rgba(16, 185, 129, 0.15)', bg15: 'rgba(16, 185, 129, 0.2)', bg30: 'rgba(16, 185, 129, 0.35)' },
    amber: { main: '#FBBF24', bg10: 'rgba(245, 158, 11, 0.15)', bg15: 'rgba(245, 158, 11, 0.2)', bg30: 'rgba(245, 158, 11, 0.35)' },
    red: { main: '#F87171', bg10: 'rgba(239, 68, 68, 0.15)', bg15: 'rgba(239, 68, 68, 0.2)', bg30: 'rgba(239, 68, 68, 0.35)' },
  };

  // Widget base styles for both themes
  const getWidgetStyle = (isDark: boolean) => ({
    background: isDark ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '0.5px solid rgba(0, 0, 0, 0.04)',
    boxShadow: isDark 
      ? '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
      : '0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  });

  // Metric card styles
  const getMetricCardStyle = (isDark: boolean, colorClass: string) => {
    const colors = isDark ? colorMapDark : colorMapLight;
    const colorData = colors[colorClass as keyof typeof colors];
    
    return {
      background: isDark ? 'rgba(30, 30, 32, 0.6)' : 'rgba(255, 255, 255, 0.72)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '0.5px solid rgba(0, 0, 0, 0.04)',
      boxShadow: isDark 
        ? '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    };
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Premium Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white"
            style={{ 
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5)',
            }}
          >
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-[32px] font-semibold text-foreground tracking-tight">
              Study Analytics
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track your study patterns and optimize your learning
            </p>
          </div>
        </div>

        {/* Time Range Selector - Fixed for dark mode */}
        <div 
          className="inline-flex gap-1 p-1 rounded-full border dark:border-white/10 border-black/5"
          style={{ background: 'rgba(128, 128, 128, 0.06)' }}
        >
          {(['week', 'month', 'semester'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                timeRange === range
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground dark:hover:bg-white/10 hover:bg-black/5"
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Premium Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metricsData.map((metric, index) => {
          const colorsLight = colorMapLight[metric.colorClass as keyof typeof colorMapLight];
          const colorsDark = colorMapDark[metric.colorClass as keyof typeof colorMapDark];
          const Icon = metric.icon;
          
          return (
            <div 
              key={index}
              className={cn(
                "relative overflow-hidden rounded-3xl p-6 md:p-7 text-center transition-all duration-[400ms] hover:scale-[1.03] hover:-translate-y-1",
                // Light mode styles
                "bg-white/70 dark:bg-[rgba(30,30,32,0.6)]",
                "backdrop-blur-[40px]",
                "border border-black/[0.04] dark:border-white/[0.08]",
                "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
                "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
              )}
            >
              {/* Gradient overlay - brighter in dark mode */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                  background: `linear-gradient(135deg, transparent 0%, var(--gradient-end) 100%)`,
                  ['--gradient-end' as string]: colorsLight.bg30,
                  opacity: 0.5,
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none rounded-3xl hidden dark:block"
                style={{
                  background: `linear-gradient(135deg, transparent 0%, ${colorsDark.bg30} 100%)`,
                  opacity: 0.8,
                }}
              />
              
              {/* Icon */}
              <div 
                className="relative w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ 
                  background: colorsLight.bg15,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: colorsLight.main }} />
              </div>
              {/* Dark mode icon overlay */}
              <div 
                className="absolute top-6 md:top-7 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl items-center justify-center hidden dark:flex"
                style={{ 
                  background: colorsDark.bg15,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: colorsDark.main }} />
              </div>
              
              {/* Value - brighter in dark mode */}
              <p 
                className="relative text-3xl md:text-4xl font-extralight tracking-tight leading-none mb-2 dark:hidden"
                style={{ 
                  color: colorsLight.main,
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: '-0.03em',
                }}
              >
                {metric.value}
              </p>
              <p 
                className="relative text-3xl md:text-4xl font-extralight tracking-tight leading-none mb-2 hidden dark:block"
                style={{ 
                  color: colorsDark.main,
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: '-0.03em',
                }}
              >
                {metric.value}
              </p>
              
              {/* Label */}
              <p className="relative text-sm font-semibold text-foreground mb-1">
                {metric.label}
              </p>
              
              {/* Sublabel */}
              <p className={cn(
                "relative text-[11px]",
                metric.subPositive ? "text-emerald-500 dark:text-emerald-400 font-medium" : "text-muted-foreground"
              )}>
                {metric.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Distribution & Weekly Pattern Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium Time Distribution Donut */}
        <div 
          className={cn(
            "rounded-3xl p-8 transition-all duration-[400ms]",
            "bg-white/70 dark:bg-[rgba(28,28,30,0.7)]",
            "backdrop-blur-[40px]",
            "border border-black/[0.04] dark:border-white/[0.08]",
            "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
            "dark:shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
            "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
            "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]",
            "dark:hover:bg-[rgba(38,38,40,0.8)] dark:hover:border-white/[0.12]"
        )}
        >
          <div className="insights-widget-header">
            <p className="insights-widget-title">
              Time Distribution
            </p>
          </div>
          
          <div className="flex items-center gap-12">
            {/* Donut chart */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="hours"
                    strokeWidth={0}
                  >
                    {courseDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="transition-all duration-300 hover:opacity-80"
                        style={{ 
                          filter: `drop-shadow(0 4px 12px ${entry.color}60)`,
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span 
                  className="text-[40px] font-extralight text-foreground"
                  style={{ fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em' }}
                >
                  {totalHours}h
                </span>
                <span className="text-xs text-muted-foreground dark:text-white/50 mt-1">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-5">
              {courseDistribution.map((course) => (
                <div 
                  key={course.id} 
                  className={cn(
                    "flex items-center justify-between p-3 -mx-3 rounded-[14px] transition-all duration-300",
                    "hover:bg-secondary/30 dark:hover:bg-white/[0.08]",
                    "hover:translate-x-1"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ 
                        background: course.color,
                        boxShadow: `0 2px 12px ${course.color}60`,
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{course.code}</p>
                      <p className="text-xs text-muted-foreground dark:text-white/50 mt-0.5">{course.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-foreground">{course.hours}h</p>
                    <p className="text-xs text-muted-foreground dark:text-white/50">{course.percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Weekly Pattern */}
        <div 
          className={cn(
            "rounded-3xl p-8 transition-all duration-[400ms]",
            "bg-white/70 dark:bg-[rgba(28,28,30,0.7)]",
            "backdrop-blur-[40px]",
            "border border-black/[0.04] dark:border-white/[0.08]",
            "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
            "dark:shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
            "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
            "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]",
            "dark:hover:bg-[rgba(38,38,40,0.8)] dark:hover:border-white/[0.12]"
        )}
        >
          <div className="insights-widget-header">
            <p className="insights-widget-title">
              Weekly Pattern
            </p>
            <div className="insights-widget-header-right">
              <p className="insights-widget-header-value">24h</p>
              <p className="insights-widget-header-sublabel">This week</p>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-[160px] px-2">
            {mockStudyData.weeklyPattern.map((day, index) => {
              const height = (day.hours / 5) * maxBarHeight;
              return (
                <div key={index} className="flex flex-col items-center gap-3 w-[12%]">
                  <span className="text-[13px] font-semibold text-foreground">{day.hours}h</span>
                  <div 
                    className={cn(
                      "w-full rounded-xl transition-all duration-500 cursor-default",
                      "hover:scale-x-110 hover:scale-y-105"
                    )}
                    style={{ 
                      height: `${height}px`,
                      background: day.highlight 
                        ? 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)'
                        : 'rgba(139, 92, 246, 0.2)',
                      boxShadow: day.highlight 
                        ? '0 8px 24px rgba(139, 92, 246, 0.5)'
                        : 'none',
                    }}
                  />
                  {/* Dark mode bar styles */}
                  <style>{`
                    .dark .bar-normal-dark {
                      background: rgba(139, 92, 246, 0.35) !important;
                    }
                    .dark .bar-normal-dark:hover {
                      background: rgba(139, 92, 246, 0.5) !important;
                    }
                  `}</style>
                  <span className={cn(
                    "text-xs font-medium",
                    day.highlight ? "text-violet-500 dark:text-violet-400 font-semibold" : "text-muted-foreground dark:text-white/50"
                  )}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Insight */}
          <div 
            className="flex items-center gap-3 mt-7 pt-6 border-t border-black/[0.04] dark:border-white/[0.06]"
          >
            <span className="text-xl">💡</span>
            <p className="text-sm text-muted-foreground dark:text-white/60 leading-relaxed">
              You're most productive on <span className="text-violet-500 dark:text-violet-400 font-semibold">Tuesdays</span>. 
              Consider scheduling difficult topics then.
            </p>
          </div>
        </div>
      </div>

      {/* Premium Productivity Heatmap */}
      <div 
        className={cn(
          "rounded-3xl p-8 transition-all duration-[400ms]",
          "bg-white/70 dark:bg-[rgba(28,28,30,0.7)]",
          "backdrop-blur-[40px]",
          "border border-black/[0.04] dark:border-white/[0.08]",
          "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
          "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
          "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:hover:bg-[rgba(38,38,40,0.8)] dark:hover:border-white/[0.12]"
        )}
      >
        <div className="insights-widget-header">
          <p className="insights-widget-title">
            Daily Productivity Pattern
          </p>
          <div 
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              "bg-emerald-500/10 text-emerald-600",
              "dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30"
            )}
          >
            <span>🔥</span>
            Peak: 9-11 AM
          </div>
        </div>
        
        <div className="flex gap-2 justify-center">
          {mockStudyData.hourlyPattern.map((slot, index) => {
            const level = Math.min(Math.floor(slot.intensity / 20), 5);
            
            // Light mode intensity styles
            const intensityStylesLight = [
              { background: 'rgba(0, 0, 0, 0.02)' },
              { background: 'rgba(16, 185, 129, 0.15)' },
              { background: 'rgba(16, 185, 129, 0.3)' },
              { background: 'rgba(16, 185, 129, 0.5)' },
              { background: 'rgba(16, 185, 129, 0.7)' },
              { background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)' },
            ];
            
            // Dark mode intensity styles - BRIGHTER
            const intensityStylesDark = [
              { background: 'rgba(255, 255, 255, 0.05)' },
              { background: 'rgba(16, 185, 129, 0.25)' },
              { background: 'rgba(16, 185, 129, 0.4)' },
              { background: 'rgba(16, 185, 129, 0.55)' },
              { background: 'rgba(16, 185, 129, 0.75)' },
              { background: 'linear-gradient(135deg, #34D399, #10B981)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)' },
            ];
            
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                {/* Light mode cell */}
                <div 
                  className="w-12 h-14 rounded-[10px] transition-all duration-300 hover:scale-110 cursor-default dark:hidden"
                  style={intensityStylesLight[level]}
                />
                {/* Dark mode cell */}
                <div 
                  className="w-12 h-14 rounded-[10px] transition-all duration-300 hover:scale-110 cursor-default hidden dark:block"
                  style={intensityStylesDark[level]}
                />
                <span className="text-[10px] font-medium text-muted-foreground dark:text-white/50">{slot.hour}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-7">
          <span className="text-xs text-muted-foreground dark:text-white/50">Less active</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((level) => {
              const bgStylesLight = [
                { background: 'rgba(0, 0, 0, 0.02)' },
                { background: 'rgba(16, 185, 129, 0.15)' },
                { background: 'rgba(16, 185, 129, 0.3)' },
                { background: 'rgba(16, 185, 129, 0.5)' },
                { background: 'rgba(16, 185, 129, 0.7)' },
                { background: '#10B981' },
              ];
              const bgStylesDark = [
                { background: 'rgba(255, 255, 255, 0.05)' },
                { background: 'rgba(16, 185, 129, 0.25)' },
                { background: 'rgba(16, 185, 129, 0.4)' },
                { background: 'rgba(16, 185, 129, 0.55)' },
                { background: 'rgba(16, 185, 129, 0.75)' },
                { background: 'linear-gradient(90deg, #34D399, #10B981)' },
              ];
              return (
                <div key={level}>
                  <div 
                    className="w-7 h-3.5 rounded dark:hidden"
                    style={bgStylesLight[level]}
                  />
                  <div 
                    className="w-7 h-3.5 rounded hidden dark:block"
                    style={bgStylesDark[level]}
                  />
                </div>
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground dark:text-white/50">More active</span>
        </div>
      </div>

      {/* Premium Study Time vs Grade Correlation */}
      <div 
        className={cn(
          "rounded-3xl p-8 transition-all duration-[400ms]",
          "bg-white/70 dark:bg-[rgba(28,28,30,0.7)]",
          "backdrop-blur-[40px]",
          "border border-black/[0.04] dark:border-white/[0.08]",
          "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
          "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
          "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "dark:hover:bg-[rgba(38,38,40,0.8)] dark:hover:border-white/[0.12]"
        )}
      >
        <div className="insights-widget-header">
          <p className="insights-widget-title">
            Study Time vs. Grade Correlation
          </p>
        </div>
        
        <div className="space-y-4">
          {correlationData.map((course, index) => {
            const correlationColors = {
              strong: { text: 'text-emerald-500 dark:text-emerald-400', bar: '#10B981', barDark: '#34D399' },
              moderate: { text: 'text-amber-500 dark:text-amber-400', bar: '#F59E0B', barDark: '#FBBF24' },
              weak: { text: 'text-red-500 dark:text-red-400', bar: '#EF4444', barDark: '#F87171' },
            };
            const { text, bar, barDark } = correlationColors[course.correlation as keyof typeof correlationColors];
            const courseColor = courseDistribution.find(c => c.code === course.code)?.color || '#14B8A6';
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex items-center gap-6 p-6 rounded-[20px] transition-all duration-[400ms] hover:scale-[1.01]",
                  "bg-black/[0.02] dark:bg-white/[0.04]",
                  "dark:border dark:border-white/[0.06]",
                  "dark:hover:bg-white/[0.08] dark:hover:border-white/[0.1]",
                  "dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                )}
              >
                {/* Course color bar */}
                <div 
                  className="w-[5px] h-[72px] rounded flex-shrink-0"
                  style={{ 
                    background: courseColor,
                    boxShadow: `0 0 16px ${courseColor}60`,
                  }}
                />
                
                {/* Course info */}
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[17px] font-semibold text-foreground mb-1">{course.code}</p>
                  <p className="text-sm text-muted-foreground dark:text-white/60 mb-1.5">{course.name}</p>
                  <p className={cn("text-xs font-semibold", text)}>
                    {course.correlation.charAt(0).toUpperCase() + course.correlation.slice(1)} correlation
                  </p>
                </div>

                {/* Hours */}
                <div className="text-center px-6 min-w-[100px]">
                  <p 
                    className="text-[28px] font-extralight text-foreground"
                    style={{ fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em' }}
                  >
                    {course.hours}h
                  </p>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground dark:text-white/50 mt-1">
                    Studied
                  </p>
                </div>

                {/* Arrow with bar */}
                <div className="flex items-center gap-3 px-4">
                  <div 
                    className="w-20 h-1 rounded-full overflow-hidden bg-black/[0.04] dark:bg-white/10"
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((course.hours / 50) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${courseColor}, ${bar})`,
                      }}
                    />
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: bar }} />
                </div>

                {/* Grade */}
                <div className="text-center px-6 min-w-[100px]">
                  <p 
                    className="text-[28px] font-extralight text-emerald-500 dark:text-emerald-400"
                    style={{ fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em' }}
                  >
                    {course.grade}%
                  </p>
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground dark:text-white/50 mt-1">
                    Grade
                  </p>
                </div>

                {/* Letter grade badge */}
                <div 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                    "bg-white/70 dark:bg-white/[0.08]",
                    "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
                    "dark:border dark:border-white/10"
                  )}
                >
                  <span className="text-xl font-semibold text-foreground">{course.letter}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium AI Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            type: 'improvement',
            icon: <TrendingUp className="w-[22px] h-[22px]" />,
            title: 'Time Investment Pays Off',
            description: 'Courses where you spend 40+ hours show an average grade of 92%. Keep prioritizing COP3530!',
            gradientToLight: 'rgba(16, 185, 129, 0.15)',
            gradientToDark: 'rgba(16, 185, 129, 0.25)',
            iconBgLight: 'rgba(16, 185, 129, 0.15)',
            iconBgDark: 'rgba(16, 185, 129, 0.25)',
            iconColorDark: '#34D399',
            borderDark: 'rgba(16, 185, 129, 0.2)',
          },
          {
            type: 'efficiency',
            icon: <Target className="w-[22px] h-[22px]" />,
            title: 'Efficiency Opportunity',
            description: 'STA3032 has high grades with less time invested. Similar study methods could help Physics II.',
            gradientToLight: 'rgba(245, 158, 11, 0.15)',
            gradientToDark: 'rgba(245, 158, 11, 0.2)',
            iconBgLight: 'rgba(245, 158, 11, 0.15)',
            iconBgDark: 'rgba(245, 158, 11, 0.25)',
            iconColorDark: '#FBBF24',
            borderDark: 'rgba(245, 158, 11, 0.2)',
          },
          {
            type: 'balance',
            icon: <Sparkles className="w-[22px] h-[22px]" />,
            title: 'Rebalance Suggestion',
            description: 'Consider shifting 5 hours/week from Data Structures to Physics II for better overall GPA.',
            gradientToLight: 'rgba(239, 68, 68, 0.15)',
            gradientToDark: 'rgba(239, 68, 68, 0.2)',
            iconBgLight: 'rgba(239, 68, 68, 0.15)',
            iconBgDark: 'rgba(239, 68, 68, 0.25)',
            iconColorDark: '#F87171',
            borderDark: 'rgba(239, 68, 68, 0.2)',
          },
        ].map((insight, index) => (
          <div 
            key={index}
            className={cn(
              "relative overflow-hidden rounded-3xl p-7 transition-all duration-[400ms] hover:scale-[1.02] hover:-translate-y-1",
              "backdrop-blur-[40px]",
              "border border-black/[0.04]",
              "shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]"
            )}
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.72) 0%, ${insight.gradientToLight} 100%)`,
            }}
          >
            {/* Dark mode background overlay */}
            <div 
              className="absolute inset-0 rounded-3xl hidden dark:block"
              style={{
                background: `linear-gradient(135deg, rgba(28,28,30,0.8) 0%, ${insight.gradientToDark} 100%)`,
                border: `1px solid ${insight.borderDark}`,
              }}
            />
            
            {/* Icon - Light mode */}
            <div 
              className="relative w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 dark:hidden"
              style={{ background: insight.iconBgLight }}
            >
              {insight.icon}
            </div>
            {/* Icon - Dark mode */}
            <div 
              className="relative w-[52px] h-[52px] rounded-2xl items-center justify-center mb-5 hidden dark:flex"
              style={{ background: insight.iconBgDark, color: insight.iconColorDark }}
            >
              {insight.icon}
            </div>
            
            <h4 className="relative text-[17px] font-semibold text-foreground mb-2.5">{insight.title}</h4>
            <p className="relative text-sm text-muted-foreground dark:text-white/70 leading-relaxed">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Premium CTA Banner */}
      <div 
        className="relative overflow-hidden rounded-3xl p-10 text-center transition-all duration-[400ms] hover:scale-[1.005]"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)',
          boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Shine overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)',
          }}
        />
        
        <div className="relative">
          <div className="text-5xl mb-5">⏱️</div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            Start a Focus Session
          </h3>
          <p className="text-[15px] text-white/80 mb-7 max-w-md mx-auto">
            Track your study time and see how it impacts your grades in real-time.
          </p>
          <button 
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#6366F1] text-base font-semibold transition-all duration-300 hover:scale-105"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <Timer className="w-5 h-5" />
            Go to Focus Timer
          </button>
        </div>
      </div>
    </div>
  );
}
