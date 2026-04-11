import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  ComposedChart,
  Area,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Assignment } from "@/types";
import { formatPoints } from "@/lib/gradeUtils";
import { useTheme } from "@/hooks/use-theme";
import { format, subDays, subMonths, isBefore, startOfDay, parseISO } from "date-fns";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface GradeJourneyWidgetProps {
  assignments: Assignment[];
  currentGrade: number;
  targetGrade?: number;
  semesterStart?: string;
}

interface ChartPoint {
  date: number;
  dateLabel: string;
  grade: number;
  isToday?: boolean;
  assignments: Assignment[];
}

interface UngradedPoint {
  date: number;
  dateLabel: string;
  y: number;
  ungradedAssignments: Assignment[];
}

interface PopupData {
  x: number;
  y: number;
  assignments: Assignment[];
  grade: number | null;
  dateLabel: string;
}

const TIME_FILTERS = ["1W", "1M", "3M", "SEM"] as const;
type TimeFilter = (typeof TIME_FILTERS)[number];

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function getFilterStartDate(filter: TimeFilter, semesterStart?: string): Date {
  const today = startOfDay(new Date());
  switch (filter) {
    case "1W":
      return subDays(today, 7);
    case "1M":
      return subDays(today, 30);
    case "3M":
      return subMonths(today, 3);
    case "SEM":
      if (semesterStart) {
        const start = startOfDay(parseISO(semesterStart));
        return isBefore(start, today) ? start : subMonths(today, 5);
      }
      return subMonths(today, 5);
    default:
      return subMonths(today, 5);
  }
}

function formatTickLabel(date: Date, filter: TimeFilter): string {
  switch (filter) {
    case "1W":
      return format(date, "EEE d");
    case "1M":
      return format(date, "MMM d");
    case "3M":
      return format(date, "MMM d");
    case "SEM":
      return format(date, "MMM");
    default:
      return format(date, "MMM d");
  }
}

function calculateCumulativeGrade(graded: Assignment[]): number {
  if (graded.length === 0) return 0;
  let wSum = 0,
    wTot = 0;
  for (const a of graded) {
    if (a.score !== null) {
      wSum += (a.score / 100) * a.weight;
      wTot += a.weight;
    }
  }
  return wTot > 0 ? (wSum / wTot) * 100 : 0;
}

/* ─────────────────────────────────────────────
   Custom Dot — graded points on the line
   ───────────────────────────────────────────── */
function GradeDot(props: any) {
  const { cx, cy, payload, isDarkMode, onDotClick } = props;
  if (!payload || payload.isToday || !payload.grade || payload.grade === 0) return null;
  if (cx == null || cy == null) return null;

  const multi = payload.assignments?.length > 1;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onDotClick?.(e, payload);
      }}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={multi ? 6 : 4}
        fill={isDarkMode ? "#fff" : "#1A1A1A"}
        stroke={isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"}
        strokeWidth={2}
      />
      {multi && (
        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill="none"
          stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
    </g>
  );
}

/* ─────────────────────────────────────────────
   Ungraded Dot — hollow dashed circle
   ───────────────────────────────────────────── */
function UngradedDot(props: any) {
  const { cx, cy, isDarkMode } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="none"
      stroke={isDarkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"}
      strokeWidth={1.5}
      strokeDasharray="3 2"
    />
  );
}

/* ─────────────────────────────────────────────
   Tooltip
   ───────────────────────────────────────────── */
function JourneyTooltip({ active, payload, isDarkMode }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;

  const bg = isDarkMode ? "rgba(28,28,32,0.95)" : "rgba(255,255,255,0.95)";
  const border = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const sub = isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const main = isDarkMode ? "#fff" : "#1a1a1a";

  const base = {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: "10px 14px",
    backdropFilter: "blur(12px)",
    maxWidth: 240,
  } as const;

  // Ungraded marker tooltip
  if (data.ungradedAssignments) {
    return (
      <div style={base}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: sub,
            marginBottom: 6,
          }}
        >
          No grade yet
        </p>
        {data.ungradedAssignments.map((a: Assignment, i: number) => (
          <p
            key={i}
            style={{ fontSize: 12, color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", marginBottom: 2 }}
          >
            {a.name}
          </p>
        ))}
        <p style={{ fontSize: 11, color: sub, marginTop: 6 }}>Check your university portal</p>
      </div>
    );
  }

  // Today extension point
  if (data.isToday) {
    return (
      <div style={base}>
        <p style={{ fontSize: 12, fontWeight: 500, color: main }}>Current Grade: {formatPoints(data.grade)}%</p>
        <p style={{ fontSize: 11, color: sub }}>Today</p>
      </div>
    );
  }

  // Normal graded point
  return (
    <div style={base}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: sub,
          marginBottom: 4,
        }}
      >
        {data.dateLabel}
      </p>
      <p style={{ fontSize: 18, fontWeight: 300, color: main, marginBottom: 4 }}>{formatPoints(data.grade)}%</p>
      {data.assignments?.length > 0 && (
        <div>
          {data.assignments.slice(0, 3).map((a: Assignment, i: number) => (
            <p
              key={i}
              style={{
                fontSize: 11,
                color: isDarkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
                marginBottom: 1,
              }}
            >
              {a.name}: {a.score}%
            </p>
          ))}
          {data.assignments.length > 3 && (
            <p style={{ fontSize: 11, color: sub, marginTop: 2 }}>
              +{data.assignments.length - 3} more · click to see all
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Click Popup — shows all assignments at a point
   ───────────────────────────────────────────── */
function AssignmentPopup({
  data,
  position,
  onClose,
  isDarkMode,
}: {
  data: PopupData;
  position: { x: number; y: number };
  onClose: () => void;
  isDarkMode: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  if (data.assignments.length === 0) return null;

  const bg = isDarkMode ? "rgba(28,28,32,0.97)" : "rgba(255,255,255,0.97)";
  const border = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const sub = isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const main = isDarkMode ? "#f0f0f0" : "#1a1a1a";
  const shadow = isDarkMode ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.12)";

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: Math.min(position.x, 260),
        top: position.y - 10,
        zIndex: 50,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 16,
        backdropFilter: "blur(20px)",
        boxShadow: shadow,
        minWidth: 200,
        maxWidth: 280,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: sub,
          marginBottom: 10,
        }}
      >
        {data.dateLabel} · {data.assignments.length} assignment{data.assignments.length > 1 ? "s" : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.assignments.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: main,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.name}
              </p>
              <p style={{ fontSize: 10, color: sub }}>{a.weight}% weight</p>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginLeft: 12,
                flexShrink: 0,
                color: a.score !== null ? main : sub,
              }}
            >
              {a.score !== null ? `${a.score}%` : "—"}
            </span>
          </div>
        ))}
      </div>

      {data.grade !== null && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: sub }}>Grade after</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: isDarkMode ? "#fff" : "#1a1a1a" }}>
            {formatPoints(data.grade)}%
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Widget
   ───────────────────────────────────────────── */
export function GradeJourneyWidget({
  assignments,
  currentGrade,
  targetGrade = 90,
  semesterStart,
}: GradeJourneyWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("SEM");
  const [popup, setPopup] = useState<PopupData | null>(null);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const { resolvedMode } = useTheme();
  const isDarkMode = resolvedMode === "dark";

  const today = startOfDay(new Date());
  const filterStart = getFilterStartDate(activeFilter, semesterStart);

  /* ── Build chart data ── */
  const { gradePoints, ungradedPoints, gradedInWindow } = useMemo(() => {
    const todayTs = today.getTime();

    // All assignments with due dates, sorted chronologically
    const withDates = assignments
      .filter((a) => a.dueDate)
      .map((a) => ({ ...a, _due: startOfDay(parseISO(a.dueDate!)) }))
      .sort((a, b) => a._due.getTime() - b._due.getTime());

    // ── GRADED: group by due date, build cumulative line ──
    const graded = withDates.filter((a) => a.score !== null);
    const byDate = new Map<string, Assignment[]>();
    for (const a of graded) {
      const key = a.dueDate!;
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(a);
    }

    const allGrade: ChartPoint[] = [];
    const cumulative: Assignment[] = [];

    for (const [dateStr, group] of byDate) {
      const d = startOfDay(parseISO(dateStr));
      cumulative.push(...group);
      const g = calculateCumulativeGrade(cumulative);
      allGrade.push({
        date: d.getTime(),
        dateLabel: format(d, "MMM d, yyyy"),
        grade: Math.round(g * 10) / 10,
        assignments: group,
      });
    }

    // Extend flat line to today
    if (allGrade.length > 0) {
      const last = allGrade[allGrade.length - 1];
      if (last.date < todayTs) {
        allGrade.push({
          date: todayTs,
          dateLabel: "Today",
          grade: last.grade,
          assignments: [],
          isToday: true,
        });
      }
    }

    // ── UNGRADED past-due: hollow markers ──
    const ungradedPast = withDates.filter((a) => a.score === null && a._due.getTime() <= todayTs);
    const ungByDate = new Map<string, Assignment[]>();
    for (const a of ungradedPast) {
      const key = a.dueDate!;
      if (!ungByDate.has(key)) ungByDate.set(key, []);
      ungByDate.get(key)!.push(a);
    }

    const allUngraded: UngradedPoint[] = [];
    for (const [dateStr, group] of ungByDate) {
      const d = startOfDay(parseISO(dateStr));
      // Y position: use nearest graded point before this date
      const nearest = allGrade.filter((p) => p.date <= d.getTime() && !p.isToday).pop();
      const yVal = nearest?.grade || (allGrade.length > 0 ? allGrade[0].grade : 50);
      allUngraded.push({
        date: d.getTime(),
        dateLabel: format(d, "MMM d, yyyy"),
        y: yVal,
        ungradedAssignments: group,
      });
    }

    // ── Filter to time window ──
    const startTs = filterStart.getTime();
    const filtered = allGrade.filter((p) => p.date >= startTs);
    const filteredUng = allUngraded.filter((p) => p.date >= startTs);

    // If window starts after first graded point, prepend edge point
    if (filtered.length > 0 && filtered[0].date > startTs) {
      const before = allGrade.filter((p) => p.date < startTs);
      if (before.length > 0) {
        filtered.unshift({
          date: startTs,
          dateLabel: format(filterStart, "MMM d"),
          grade: before[before.length - 1].grade,
          assignments: [],
        });
      }
    }

    // Count graded assignments in window
    const count = filtered
      .filter((p) => !p.isToday && p.date > startTs && p.assignments.length > 0)
      .reduce((s, p) => s + p.assignments.length, 0);

    return { gradePoints: filtered, ungradedPoints: filteredUng, gradedInWindow: count };
  }, [assignments, activeFilter, filterStart, today]);

  /* ── Grade change ── */
  const gradeChange = useMemo(() => {
    const real = gradePoints.filter((p) => p.grade > 0 && !p.isToday);
    if (real.length < 2) return 0;
    return real[real.length - 1].grade - real[0].grade;
  }, [gradePoints]);
  const isPositive = gradeChange >= 0;

  /* ── Dot click → popup ── */
  const handleDotClick = useCallback((e: React.MouseEvent, point: ChartPoint) => {
    if (!chartWrapRef.current || point.assignments.length === 0) return;
    const rect = chartWrapRef.current.getBoundingClientRect();
    setPopup({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      assignments: point.assignments,
      grade: point.grade,
      dateLabel: point.dateLabel,
    });
  }, []);

  /* ── Axis formatting ── */
  const tickFmt = useCallback((ts: number) => formatTickLabel(new Date(ts), activeFilter), [activeFilter]);

  const xDomain = useMemo(() => [filterStart.getTime(), today.getTime()], [filterStart, today]);

  const yMin = useMemo(() => {
    const vals = gradePoints.filter((p) => p.grade > 0).map((p) => p.grade);
    if (vals.length === 0) return 0;
    return Math.max(0, Math.floor(Math.min(...vals) / 10) * 10 - 10);
  }, [gradePoints]);

  return (
    <div className="glass-widget" style={{ position: "relative" }}>
      {/* Header — matches original exactly */}
      <div className="course-widget-header px-6 pt-6">
        <span className="course-widget-title">Grade Journey</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {gradedInWindow > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 8,
                background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
              }}
            >
              {gradedInWindow} graded
            </span>
          )}
          {currentGrade > 0 && gradeChange !== 0 && (
            <span className={`text-sm font-medium ${isPositive ? "text-success" : "text-error"}`}>
              {isPositive ? "+" : ""}
              {formatPoints(gradeChange)}%
            </span>
          )}
        </div>
      </div>

      <div className="p-6 pt-0">
        {/* Main Grade Value — matches original */}
        <div className="mb-4">
          <span className="text-5xl font-light text-foreground tracking-tight">
            {currentGrade > 0 ? formatPoints(currentGrade) : "—"}
          </span>
          <span className="text-muted-foreground/60 ml-2 text-sm">/ 100</span>
        </div>

        {/* Chart */}
        <div className="h-48 -mx-2" ref={chartWrapRef} style={{ position: "relative" }}>
          {gradePoints.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <p style={{ fontSize: 13, color: isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                Enter grades to see your journey
              </p>
              {ungradedPoints.length > 0 && (
                <p style={{ fontSize: 12, color: isDarkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>
                  {ungradedPoints.reduce((s, p) => s + p.ungradedAssignments.length, 0)} past-due without grades
                </p>
              )}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gradePoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradeJourneyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(26,26,26,0.08)"} />
                      <stop offset="100%" stopColor={isDarkMode ? "rgba(255,255,255,0)" : "rgba(26,26,26,0)"} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}
                    horizontal
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={xDomain}
                    scale="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDarkMode ? "rgba(255,255,255,0.35)" : "#9CA3AF" }}
                    tickFormatter={tickFmt}
                    minTickGap={40}
                  />

                  <YAxis
                    domain={[yMin, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: isDarkMode ? "rgba(255,255,255,0.35)" : "#9CA3AF" }}
                    width={35}
                    tickFormatter={(v) => `${v}`}
                  />

                  <ReferenceLine
                    y={targetGrade}
                    stroke={isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />

                  <Tooltip content={<JourneyTooltip isDarkMode={isDarkMode} />} cursor={false} />

                  {/* Grade area fill + line — uses gradePoints as chart data */}
                  <Area
                    type="monotone"
                    dataKey="grade"
                    stroke={isDarkMode ? "rgba(255,255,255,0.7)" : "#1A1A1A"}
                    strokeWidth={2}
                    fill="url(#gradeJourneyGradient)"
                    connectNulls
                    dot={(dotProps: any) => (
                      <GradeDot {...dotProps} isDarkMode={isDarkMode} onDotClick={handleDotClick} />
                    )}
                    activeDot={false}
                  />

                  {/* Ungraded markers — separate data array, won't break the line */}
                  {ungradedPoints.length > 0 && (
                    <Scatter
                      data={ungradedPoints}
                      dataKey="y"
                      shape={(scatterProps: any) => <UngradedDot {...scatterProps} isDarkMode={isDarkMode} />}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>

              {/* Click popup for clustered assignments */}
              {popup && (
                <AssignmentPopup
                  data={popup}
                  position={{ x: popup.x, y: popup.y }}
                  onClose={() => setPopup(null)}
                  isDarkMode={isDarkMode}
                />
              )}
            </>
          )}
        </div>

        {/* Time Filters — matches original exactly */}
        <div className="flex items-center justify-center gap-1 mt-4 p-1 rounded-lg bg-secondary/50">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setPopup(null);
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Target indicator — matches original exactly */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <span className="text-sm text-muted-foreground">Target Grade</span>
          <span className="text-sm font-medium text-foreground">{targetGrade}%</span>
        </div>
      </div>
    </div>
  );
}
