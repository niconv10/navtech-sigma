import { useMemo } from "react";
import { formatPoints } from "@/lib/gradeUtils";
import type { Assignment } from "@/types";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useTheme } from "@/hooks/use-theme";

interface CategoryAnalyticsProps {
  assignments: Assignment[];
  courseColor: string;
}

export function CategoryAnalytics({ assignments, courseColor }: CategoryAnalyticsProps) {
  const { resolvedMode } = useTheme();
  const isDarkMode = resolvedMode === "dark";

  const gradedAssignments = useMemo(() => assignments.filter((a) => a.score !== null), [assignments]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);
    const totalGraded = gradedAssignments.length;

    let avgScore = 0;
    if (totalGraded > 0) {
      avgScore = gradedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / totalGraded;
    }

    const pointsEarned = gradedAssignments.reduce((sum, a) => sum + (a.weight * (a.score || 0)) / 100, 0);
    const pointsPossible = assignments.reduce((sum, a) => sum + a.weight, 0);

    return {
      count: assignments.length,
      totalWeight,
      avgScore,
      gradedCount: totalGraded,
      pointsEarned,
      pointsPossible,
    };
  }, [assignments, gradedAssignments]);

  // Performance trend data
  const trendData = useMemo(() => {
    return gradedAssignments
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .map((a, index) => ({
        name: `#${index + 1}`,
        fullName: a.name,
        score: a.score || 0,
      }));
  }, [gradedAssignments]);

  // Score distribution
  const distribution = useMemo(() => {
    const ranges = [
      { label: "A (90-100)", min: 90, max: 100, count: 0 },
      { label: "B (80-89)", min: 80, max: 89, count: 0 },
      { label: "C (70-79)", min: 70, max: 79, count: 0 },
      { label: "D (60-69)", min: 60, max: 69, count: 0 },
      { label: "F (0-59)", min: 0, max: 59, count: 0 },
    ];

    gradedAssignments.forEach((a) => {
      const score = a.score || 0;
      const range = ranges.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    const maxCount = Math.max(...ranges.map((r) => r.count), 1);
    return ranges.map((r) => ({ ...r, percentage: (r.count / maxCount) * 100 }));
  }, [gradedAssignments]);

  if (gradedAssignments.length === 0) {
    return (
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <p className="text-center text-muted-foreground text-sm">
          No graded assignments yet. Enter scores to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="category-analytics">
      {/* Stat Cards Row */}
      <div className="analytics-stats-row">
        <div className="analytics-stat-card">
          <p className="analytics-stat-value" style={{ color: courseColor }}>
            {formatPoints(stats.avgScore)}%
          </p>
          <p className="analytics-stat-label">Average</p>
        </div>
        <div className="analytics-stat-card">
          <p className="analytics-stat-value">{formatPoints(stats.totalWeight)}%</p>
          <p className="analytics-stat-label">of Grade</p>
        </div>
        <div className="analytics-stat-card">
          <p className="analytics-stat-value">
            {formatPoints(stats.pointsEarned)}/{formatPoints(stats.pointsPossible)}
          </p>
          <p className="analytics-stat-label">Points Earned</p>
        </div>
        <div className="analytics-stat-card">
          <p className="analytics-stat-value">
            {stats.gradedCount}/{stats.count}
          </p>
          <p className="analytics-stat-label">Completed</p>
        </div>
      </div>

      <div className="analytics-charts-row">
        {/* Performance Trend */}
        {trendData.length > 1 && (
          <div className="analytics-chart">
            <h4 className="analytics-chart-title">PERFORMANCE TREND</h4>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient
                      id={`trendGradient-${courseColor.replace(/[^a-z0-9]/gi, "")}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 26, 26, 0.1)"}
                      />
                      <stop offset="100%" stopColor={isDarkMode ? "rgba(255, 255, 255, 0)" : "rgba(26, 26, 26, 0)"} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    horizontal={true}
                    vertical={false}
                    stroke={isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="name"
                    stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "#9CA3AF"}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "#9CA3AF"}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
                    formatter={(value: number) => [`${formatPoints(value)}%`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={isDarkMode ? "rgba(255, 255, 255, 0.7)" : "#1A1A1A"}
                    strokeWidth={2}
                    fill={`url(#trendGradient-${courseColor.replace(/[^a-z0-9]/gi, "")})`}
                    dot={false}
                    activeDot={{ r: 4, fill: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "#1A1A1A", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Score Distribution */}
        <div className="analytics-chart">
          <h4 className="analytics-chart-title">SCORE DISTRIBUTION</h4>
          <div className="space-y-2">
            {distribution.map((range) => {
              // Define gradient colors based on grade range
              let barGradient = "";

              if (range.label.startsWith("A")) {
                // A: Pure green
                barGradient = "linear-gradient(90deg, #10b981 0%, #059669 100%)";
              } else if (range.label.startsWith("B")) {
                // B: Green to yellow
                barGradient = "linear-gradient(90deg, #84cc16 0%, #eab308 100%)";
              } else if (range.label.startsWith("C")) {
                // C: Yellow
                barGradient = "linear-gradient(90deg, #eab308 0%, #f59e0b 100%)";
              } else if (range.label.startsWith("D")) {
                // D: Yellow to red
                barGradient = "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)";
              } else if (range.label.startsWith("F")) {
                // F: Pure red
                barGradient = "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
              }

              return (
                <div key={range.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">{range.label}</span>
                  <div
                    className="flex-1 h-4 rounded overflow-hidden"
                    style={{ backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)" }}
                  >
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${range.percentage}%`,
                        background: range.count > 0 ? barGradient : "transparent",
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground w-6 text-right font-medium">{range.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
