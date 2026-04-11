import { useState, useMemo, useCallback } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Search,
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckSquare,
  Square,
  X,
  Zap,
  MoreHorizontal,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPoints, getAssignmentStatus, percentageToLetter } from "@/lib/gradeUtils";
import { CATEGORY_ICONS, CATEGORY_NAMES } from "@/lib/assignmentUtils";
import type { Assignment, AssignmentType } from "@/types";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface GradesTabAppleProps {
  assignments: Assignment[];
  courseColor: string;
  courseCode: string;
  onScoreAssignment: (assignment: Assignment) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string, name: string) => void;
  onAddAssignment: (type?: AssignmentType) => void;
  onSetDueDate?: (assignmentId: string, date: string | null) => void;
}

type SortField = "name" | "dueDate" | "weight" | "score" | "status" | "type";
type SortDirection = "asc" | "desc";

const STATUS_PRIORITY: Record<string, number> = {
  overdue: 0,
  "due-soon": 1,
  pending: 2,
  graded: 3,
};

// Progress Ring Component
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  bgColor = "rgba(0,0,0,0.06)",
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring-svg">
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${color.replace(/[^a-z0-9]/gi, "")})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-ring-circle"
        />
        <defs>
          <linearGradient id={`gradient-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </svg>
      {children && <div className="progress-ring-content">{children}</div>}
    </div>
  );
}

// Mini Progress Ring for categories
function MiniRing({ progress, color, size = 36 }: { progress: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="mini-ring">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

export function GradesTabApple({
  assignments,
  courseColor,
  courseCode,
  onScoreAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onAddAssignment,
  onSetDueDate,
}: GradesTabAppleProps) {
  const { resolvedMode } = useTheme();
  const isDarkMode = resolvedMode === "dark";

  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedCategories, setSelectedCategories] = useState<Set<AssignmentType>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedTrendCategory, setSelectedTrendCategory] = useState<AssignmentType | null>(null);

  const categories = useMemo(() => {
    const types = new Set<AssignmentType>();
    assignments.forEach((a) => types.add(a.type));
    return Array.from(types);
  }, [assignments]);

  useMemo(() => {
    if (categories.length > 0 && selectedTrendCategory === null) {
      setSelectedTrendCategory(categories[0]);
    }
  }, [categories, selectedTrendCategory]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = assignments.length;
    const graded = assignments.filter((a) => a.score !== null).length;
    const ungraded = total - graded;
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);
    const gradedWeight = assignments.filter((a) => a.score !== null).reduce((sum, a) => sum + a.weight, 0);

    let currentGrade = 0;
    if (gradedWeight > 0) {
      const earnedPoints = assignments
        .filter((a) => a.score !== null)
        .reduce((sum, a) => sum + (a.weight * a.score!) / 100, 0);
      currentGrade = (earnedPoints / gradedWeight) * 100;
    }

    const now = new Date();
    const overdue = assignments.filter((a) => {
      if (a.score !== null || !a.dueDate) return false;
      return new Date(a.dueDate) < now;
    }).length;

    const dueSoon = assignments.filter((a) => {
      if (a.score !== null || !a.dueDate) return false;
      const due = new Date(a.dueDate);
      const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;

    const progressPercent = totalWeight > 0 ? (gradedWeight / totalWeight) * 100 : 0;

    return { total, graded, ungraded, totalWeight, gradedWeight, currentGrade, overdue, dueSoon, progressPercent };
  }, [assignments]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<
      string,
      { type: AssignmentType; count: number; graded: number; weight: number; avgScore: number }
    > = {};

    assignments.forEach((a) => {
      if (!breakdown[a.type]) {
        breakdown[a.type] = { type: a.type, count: 0, graded: 0, weight: 0, avgScore: 0 };
      }
      breakdown[a.type].count++;
      breakdown[a.type].weight += a.weight;
      if (a.score !== null) breakdown[a.type].graded++;
    });

    Object.values(breakdown).forEach((cat) => {
      if (cat.graded > 0) {
        const gradedInCat = assignments.filter((a) => a.type === cat.type && a.score !== null);
        cat.avgScore = gradedInCat.reduce((sum, a) => sum + a.score!, 0) / gradedInCat.length;
      }
    });

    return Object.values(breakdown).sort((a, b) => b.weight - a.weight);
  }, [assignments]);

  // Trend data
  const categoryTrendData = useMemo(() => {
    if (!selectedTrendCategory) return [];
    return assignments
      .filter((a) => a.type === selectedTrendCategory && a.score !== null)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return a.name.localeCompare(b.name);
      })
      .map((a, index) => ({ name: `#${index + 1}`, fullName: a.name, score: a.score! }));
  }, [assignments, selectedTrendCategory]);

  const categoryTrendIndicator = useMemo(() => {
    if (categoryTrendData.length < 2) return null;
    const recent = categoryTrendData.slice(-3);
    const avgRecent = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;
    const older = categoryTrendData.slice(0, -3);
    const avgOlder = older.length > 0 ? older.reduce((sum, d) => sum + d.score, 0) / older.length : avgRecent;
    return { diff: avgRecent - avgOlder, avgRecent };
  }, [categoryTrendData]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments];
    if (selectedCategories.size > 0) filtered = filtered.filter((a) => selectedCategories.has(a.type));
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(query) || a.type.toLowerCase().includes(query));
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "dueDate":
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case "weight":
          comparison = a.weight - b.weight;
          break;
        case "score":
          comparison = (a.score ?? -1) - (b.score ?? -1);
          break;
        case "status":
          comparison =
            (STATUS_PRIORITY[getAssignmentStatus(a)] ?? 99) - (STATUS_PRIORITY[getAssignmentStatus(b)] ?? 99);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [assignments, selectedCategories, searchQuery, sortField, sortDirection]);

  // Handlers
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField],
  );

  const toggleCategory = useCallback((type: AssignmentType) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSearchQuery("");
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedAssignments.size === filteredAssignments.length) setSelectedAssignments(new Set());
    else setSelectedAssignments(new Set(filteredAssignments.map((a) => a.id)));
  }, [filteredAssignments, selectedAssignments.size]);

  const toggleSelectAssignment = useCallback((id: string) => {
    setSelectedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "graded":
        return <div className="status-dot graded" />;
      case "overdue":
        return <div className="status-dot overdue" />;
      case "due-soon":
        return <div className="status-dot due-soon" />;
      default:
        return <div className="status-dot pending" />;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const CATEGORY_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

  return (
    <div className="grades-apple">
      {/* Hero Section */}
      <div className="grades-hero">
        <div className="hero-ring-section">
          <ProgressRing
            progress={stats.progressPercent}
            size={160}
            strokeWidth={14}
            color={courseColor}
            bgColor={isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
          >
            <div className="hero-ring-inner">
              <span className="hero-progress-label">PROGRESS</span>
              <span className="hero-progress-value">{stats.progressPercent.toFixed(0)}%</span>
            </div>
          </ProgressRing>
        </div>

        <div className="hero-grade-section">
          <div className="hero-grade-display">
            <span className="hero-grade-number" style={{ color: courseColor }}>
              {stats.currentGrade > 0 ? stats.currentGrade.toFixed(1) : "—"}
            </span>
            <div className="hero-grade-meta">
              <span className="hero-grade-percent">%</span>
              <span className="hero-grade-letter">
                {stats.currentGrade > 0 ? percentageToLetter(stats.currentGrade) : "—"}
              </span>
            </div>
          </div>
          <p className="hero-grade-label">Current Grade</p>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{stats.graded}</span>
            <span className="hero-stat-label">Graded</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">{stats.ungraded}</span>
            <span className="hero-stat-label">Remaining</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value" style={{ color: stats.dueSoon > 0 ? "#F59E0B" : undefined }}>
              {stats.dueSoon}
            </span>
            <span className="hero-stat-label">Due Soon</span>
          </div>
          {stats.overdue > 0 && (
            <>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value" style={{ color: "#EF4444" }}>
                  {stats.overdue}
                </span>
                <span className="hero-stat-label">Overdue</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grades-content">
        {/* Left: Assignment List */}
        <div className="grades-list-section">
          {/* Toolbar */}
          <div className="grades-list-toolbar">
            <div className="search-minimal">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="filter-pills">
              {categories.map((type) => {
                const isActive = selectedCategories.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleCategory(type)}
                    className={cn("filter-pill", isActive && "active")}
                  >
                    {CATEGORY_NAMES[type] || type}
                  </button>
                );
              })}
              {(selectedCategories.size > 0 || searchQuery) && (
                <button onClick={clearFilters} className="filter-pill clear">
                  Clear
                </button>
              )}
            </div>

            <div className="toolbar-right">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className={cn("icon-btn", showBulkActions && "active")}
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button onClick={() => onAddAssignment()} className="add-btn">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && selectedAssignments.size > 0 && (
            <div className="bulk-bar">
              <span>{selectedAssignments.size} selected</span>
              <button className="bulk-action">
                <Check className="w-4 h-4" /> Mark Graded
              </button>
              <button className="bulk-action danger">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => {
                  setSelectedAssignments(new Set());
                  setShowBulkActions(false);
                }}
                className="bulk-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Assignment List */}
          <div className="assignment-list-card">
            <div className="list-header">
              {showBulkActions && (
                <div className="list-col col-check">
                  <button onClick={toggleSelectAll} className="check-btn">
                    {selectedAssignments.size === filteredAssignments.length && filteredAssignments.length > 0 ? (
                      <CheckSquare className="w-4 h-4" style={{ color: courseColor }} />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
              <div className="list-col col-status">
                <button onClick={() => handleSort("status")} className="sort-header">
                  Status <SortIcon field="status" />
                </button>
              </div>
              <div className="list-col col-name">
                <button onClick={() => handleSort("name")} className="sort-header">
                  Assignment <SortIcon field="name" />
                </button>
              </div>
              <div className="list-col col-type">
                <button onClick={() => handleSort("type")} className="sort-header">
                  Type <SortIcon field="type" />
                </button>
              </div>
              <div className="list-col col-weight">
                <button onClick={() => handleSort("weight")} className="sort-header">
                  Weight <SortIcon field="weight" />
                </button>
              </div>
              <div className="list-col col-due">
                <button onClick={() => handleSort("dueDate")} className="sort-header">
                  Due <SortIcon field="dueDate" />
                </button>
              </div>
              <div className="list-col col-score">
                <button onClick={() => handleSort("score")} className="sort-header">
                  Score <SortIcon field="score" />
                </button>
              </div>
              <div className="list-col col-actions"></div>
            </div>

            <div className="list-body">
              {filteredAssignments.length === 0 ? (
                <div className="list-empty">
                  <p>No assignments found</p>
                  {(selectedCategories.size > 0 || searchQuery) && (
                    <button onClick={clearFilters}>Clear filters</button>
                  )}
                </div>
              ) : (
                filteredAssignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment);
                  const isSelected = selectedAssignments.has(assignment.id);

                  return (
                    <div key={assignment.id} className={cn("list-row", isSelected && "selected")}>
                      {showBulkActions && (
                        <div className="list-col col-check">
                          <button onClick={() => toggleSelectAssignment(assignment.id)} className="check-btn">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4" style={{ color: courseColor }} />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                      <div className="list-col col-status">{getStatusIndicator(status)}</div>
                      <div className="list-col col-name">
                        <span className="assignment-name">{assignment.name}</span>
                      </div>
                      <div className="list-col col-type">
                        <span className="type-text">{CATEGORY_NAMES[assignment.type] || assignment.type}</span>
                      </div>
                      <div className="list-col col-weight">
                        <span className="weight-text">{formatPoints(assignment.weight)}%</span>
                      </div>
                      <div className="list-col col-due">
                        {onSetDueDate ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "due-text due-text--interactive",
                                  status === "overdue" && "overdue",
                                  status === "due-soon" && "due-soon",
                                )}
                                title="Click to set due date"
                              >
                                {assignment.dueDate
                                  ? format(new Date(assignment.dueDate), "MMM d")
                                  : <span className="flex items-center gap-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors"><CalendarIcon className="w-3 h-3" /><span className="text-xs hidden sm:inline">Add date</span></span>}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={assignment.dueDate ? new Date(assignment.dueDate) : undefined}
                                onSelect={(date) => {
                                  onSetDueDate(
                                    assignment.id,
                                    date ? format(date, "yyyy-MM-dd") : null,
                                  );
                                }}
                                initialFocus
                              />
                              {assignment.dueDate && (
                                <div className="p-2 border-t border-border">
                                  <button
                                    onClick={() => onSetDueDate(assignment.id, null)}
                                    className="w-full text-xs text-muted-foreground hover:text-destructive py-1 transition-colors"
                                  >
                                    Clear date
                                  </button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span
                            className={cn(
                              "due-text",
                              status === "overdue" && "overdue",
                              status === "due-soon" && "due-soon",
                            )}
                          >
                            {assignment.dueDate ? format(new Date(assignment.dueDate), "MMM d") : "—"}
                          </span>
                        )}
                      </div>
                      <div className="list-col col-score">
                        <button
                          onClick={() => onScoreAssignment(assignment)}
                          className={cn("score-display", assignment.score !== null && "has-score")}
                          style={assignment.score !== null ? { color: courseColor } : undefined}
                        >
                          {assignment.score !== null ? `${formatPoints(assignment.score)}%` : "—"}
                        </button>
                      </div>
                      <div className="list-col col-actions">
                        <button onClick={() => onEditAssignment(assignment)} className="action-icon">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAssignment(assignment.id, assignment.name)}
                          className="action-icon delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="list-footer">
              {filteredAssignments.length} of {assignments.length} assignments
              {selectedCategories.size > 0 && <span> • Filtered</span>}
            </div>
          </div>
        </div>

        {/* Right: Analytics Cards */}
        <div className="grades-analytics">
          {/* Category Performance */}
          <div className="analytics-card">
            <h4 className="card-title">Categories</h4>
            <div className="category-rings">
              {categoryBreakdown.map((cat, index) => {
                const progress = cat.count > 0 ? (cat.graded / cat.count) * 100 : 0;
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                return (
                  <div key={cat.type} className="category-ring-item">
                    <MiniRing progress={progress} color={color} size={44} />
                    <div className="category-ring-info">
                      <span className="category-ring-name">{CATEGORY_NAMES[cat.type] || cat.type}</span>
                      <span className="category-ring-detail">
                        {cat.graded}/{cat.count} • {cat.avgScore > 0 ? `${cat.avgScore.toFixed(0)}%` : "—"}
                      </span>
                    </div>
                    <span className="category-ring-weight">{cat.weight}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="analytics-card">
            <h4 className="card-title">Quick Actions</h4>
            <div className="quick-actions">
              <button
                onClick={() => {
                  const u = assignments.find((a) => a.score === null);
                  if (u) onScoreAssignment(u);
                }}
                className="quick-action-row"
                disabled={stats.ungraded === 0}
              >
                <Zap className="w-4 h-4" style={{ color: courseColor }} />
                <span>Enter next grade</span>
                <ChevronRight className="w-4 h-4 chevron" />
              </button>
              <button onClick={() => onAddAssignment()} className="quick-action-row">
                <Plus className="w-4 h-4" style={{ color: courseColor }} />
                <span>Add assignment</span>
                <ChevronRight className="w-4 h-4 chevron" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="grades-trend-section">
        <div className="trend-header">
          <h4 className="card-title">Performance Trend</h4>
          <div className="trend-tabs-minimal">
            {categories.map((type) => {
              const isActive = selectedTrendCategory === type;
              const gradedCount = assignments.filter((a) => a.type === type && a.score !== null).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTrendCategory(type)}
                  className={cn("trend-tab-minimal", isActive && "active")}
                  style={isActive ? { color: courseColor, borderColor: courseColor } : undefined}
                >
                  {CATEGORY_NAMES[type] || type}
                  <span className="tab-count">{gradedCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="trend-chart-section">
          {categoryTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={categoryTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"} />
                    <stop offset="100%" stopColor={isDarkMode ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)"} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  horizontal
                  vertical={false}
                  stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="name"
                  stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "#999"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "#999"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? "#1C1C1E" : "#fff",
                    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ""}
                  formatter={(v: number) => [`${formatPoints(v)}%`, "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={isDarkMode ? "rgba(255,255,255,0.7)" : "#1a1a1a"}
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  dot={{ r: 4, fill: isDarkMode ? "#fff" : "#1a1a1a", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: isDarkMode ? "#fff" : "#1a1a1a" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="trend-empty">
              <p>No graded {CATEGORY_NAMES[selectedTrendCategory!]?.toLowerCase() || "assignments"} yet</p>
            </div>
          )}
        </div>

        {categoryTrendIndicator && (
          <div className="trend-summary">
            {Math.abs(categoryTrendIndicator.diff) < 2 ? (
              <>
                <Minus className="w-4 h-4" />
                <span>Stable</span>
              </>
            ) : categoryTrendIndicator.diff > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="positive">+{categoryTrendIndicator.diff.toFixed(0)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-error" />
                <span className="negative">{categoryTrendIndicator.diff.toFixed(0)}%</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
