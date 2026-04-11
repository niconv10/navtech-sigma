/**
 * EditAssignmentModal
 *
 * Premium glassmorphism edit modal that matches the aesthetic of GradeInputModal.
 * Features: inline calendar hero, type pill grid, weight ring, score ring,
 * scoped CSS tokens for light/dark themes, smooth entrance animation, and
 * inline delete confirmation.
 */

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { Assignment, AssignmentType } from "@/types";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   GRADE COLOR SCALE (mirrors GradeInputModal)
   ───────────────────────────────────────────── */
const GRADE_THRESHOLDS = [
  { min: 93, letter: "A",  color: "#34d399", label: "Excellent" },
  { min: 90, letter: "A-", color: "#4ade80", label: "Excellent" },
  { min: 87, letter: "B+", color: "#a3e635", label: "Great" },
  { min: 83, letter: "B",  color: "#bef264", label: "Good" },
  { min: 80, letter: "B-", color: "#d4e157", label: "Good" },
  { min: 77, letter: "C+", color: "#facc15", label: "Average" },
  { min: 73, letter: "C",  color: "#eab308", label: "Average" },
  { min: 70, letter: "C-", color: "#f59e0b", label: "Fair" },
  { min: 60, letter: "D",  color: "#f97316", label: "Below Average" },
  { min: 0,  letter: "F",  color: "#ef4444", label: "Needs Improvement" },
];

function getGradeInfo(score: number | null) {
  if (score === null || isNaN(score) || score < 0) return null;
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

/* ─── Mini Score Ring ─── */
function ScoreRing({
  score,
  size = 76,
  strokeWidth = 5,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score !== null ? Math.min(Math.max(score / 100, 0), 1) : 0;
  const offset = circ - pct * circ;
  const g = getGradeInfo(score);
  const color = g?.color ?? "var(--em-ring-empty)";

  return (
    <div className="em-score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--em-ring-track)" strokeWidth={strokeWidth}
        />
        {score !== null && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease",
              filter: g ? `drop-shadow(0 0 5px ${color}50)` : "none",
            }}
          />
        )}
      </svg>
      <div className="em-score-ring-center">
        {score !== null ? (
          <>
            <span className="em-score-ring-value">
              {score % 1 === 0 ? Math.round(score) : score.toFixed(1)}
            </span>
            {g && (
              <span className="em-score-ring-letter" style={{ color: g.color }}>
                {g.letter}
              </span>
            )}
          </>
        ) : (
          <span className="em-score-ring-dash">—</span>
        )}
      </div>
    </div>
  );
}

/* ─── Weight Donut ─── */
function WeightRing({
  weight,
  color,
  size = 64,
  strokeWidth = 4,
}: {
  weight: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(weight / 100, 0), 1);
  const offset = circ - pct * circ;

  return (
    <div className="em-weight-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--em-ring-track)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color + "bb"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="em-weight-ring-center">
        <span className="em-weight-ring-value">{weight}</span>
        <span className="em-weight-ring-unit">%</span>
      </div>
    </div>
  );
}

/* ─── Type options ─── */
const TYPE_OPTIONS: { value: AssignmentType; label: string }[] = [
  { value: "homework",      label: "Homework" },
  { value: "exam",          label: "Exam" },
  { value: "quiz",          label: "Quiz" },
  { value: "project",       label: "Project" },
  { value: "paper",         label: "Essay" },
  { value: "lab",           label: "Lab" },
  { value: "participation", label: "Participation" },
  { value: "other",         label: "Other" },
];

/* ─── Props ─── */
interface EditAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (fields: {
    name: string;
    type: AssignmentType;
    weight: number;
    dueDate: string | undefined;
    description: string | undefined;
    score: number | null;
  }) => void;
  onDelete: () => void;
  assignment: Assignment | null;
  courseCode: string;
  courseColor: string;
}

/* ─── Main ─── */
export function EditAssignmentModal({
  open,
  onClose,
  onSave,
  onDelete,
  assignment,
  courseCode,
  courseColor,
}: EditAssignmentModalProps) {
  const [name,         setName]         = useState("");
  const [type,         setType]         = useState<AssignmentType>("homework");
  const [weight,       setWeight]       = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [scoreStr,     setScoreStr]     = useState("");
  const [description,  setDescription]  = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  /* Populate from assignment whenever modal opens */
  useEffect(() => {
    if (open && assignment) {
      setName(assignment.name);
      setType(assignment.type);
      setWeight(assignment.weight);
      setSelectedDate(
        assignment.dueDate
          ? new Date(assignment.dueDate + "T00:00:00")
          : undefined
      );
      setScoreStr(assignment.score !== null ? String(assignment.score) : "");
      setDescription(assignment.description ?? "");
      setDeleteConfirm(false);
    }
  }, [open, assignment]);

  if (!open || !assignment) return null;

  const parsedScore  = scoreStr !== "" ? parseFloat(scoreStr) : null;
  const validScore   = parsedScore !== null && !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100
                       ? parsedScore : null;
  const gradeInfo    = getGradeInfo(validScore);
  const canSave      = name.trim().length > 0 && weight > 0;
  const displayScore = parsedScore !== null && !isNaN(parsedScore) ? parsedScore : null;

  const handleSave = () => {
    if (!canSave) return;
    const finalScore = parsedScore !== null && !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100
                       ? parsedScore : null;
    onSave({
      name:        name.trim(),
      type,
      weight,
      dueDate:     selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      description: description.trim() || undefined,
      score:       finalScore,
    });
  };

  return (
    <>
      {/* ── SCOPED STYLES ── */}
      <style>{`
        /* ============ LIGHT-MODE TOKENS ============ */
        .em-overlay {
          --em-backdrop:    rgba(0,0,0,0.45);
          --em-bg-gradient: linear-gradient(180deg,rgba(255,255,255,0.95) 0%,rgba(248,248,250,0.98) 100%);
          --em-border:      rgba(0,0,0,0.08);
          --em-border-inner:rgba(0,0,0,0.05);
          --em-shadow:      0 32px 64px -12px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.05);
          --em-text-1:      hsl(0 0% 10%);
          --em-text-2:      hsl(220 9% 46%);
          --em-text-3:      rgba(0,0,0,0.35);
          --em-text-4:      rgba(0,0,0,0.22);
          --em-input-bg:    rgba(0,0,0,0.03);
          --em-input-border:rgba(0,0,0,0.10);
          --em-input-focus: rgba(0,0,0,0.20);
          --em-ring-track:  rgba(0,0,0,0.06);
          --em-ring-empty:  rgba(0,0,0,0.08);
          --em-pill-bg:     rgba(0,0,0,0.03);
          --em-pill-border: rgba(0,0,0,0.08);
          --em-pill-text:   rgba(0,0,0,0.50);
          --em-pill-hover:  rgba(0,0,0,0.05);
          --em-divider:     rgba(0,0,0,0.05);
          --em-cal-bg:      rgba(0,0,0,0.02);
          --em-cal-border:  rgba(0,0,0,0.06);
          --em-blur:        20px;
        }
        /* ============ DARK-MODE TOKENS ============ */
        .dark .em-overlay {
          --em-backdrop:    rgba(0,0,0,0.70);
          --em-bg-gradient: linear-gradient(180deg,rgba(30,30,34,0.98) 0%,rgba(18,18,22,0.99) 100%);
          --em-border:      rgba(255,255,255,0.07);
          --em-border-inner:rgba(255,255,255,0.05);
          --em-shadow:      0 32px 64px -12px rgba(0,0,0,0.60),inset 0 1px 0 rgba(255,255,255,0.04);
          --em-text-1:      #f0f0f0;
          --em-text-2:      rgba(255,255,255,0.65);
          --em-text-3:      rgba(255,255,255,0.35);
          --em-text-4:      rgba(255,255,255,0.20);
          --em-input-bg:    rgba(255,255,255,0.025);
          --em-input-border:rgba(255,255,255,0.08);
          --em-input-focus: rgba(255,255,255,0.16);
          --em-ring-track:  rgba(255,255,255,0.04);
          --em-ring-empty:  rgba(255,255,255,0.06);
          --em-pill-bg:     rgba(255,255,255,0.015);
          --em-pill-border: rgba(255,255,255,0.06);
          --em-pill-text:   rgba(255,255,255,0.40);
          --em-pill-hover:  rgba(255,255,255,0.04);
          --em-divider:     rgba(255,255,255,0.05);
          --em-cal-bg:      rgba(255,255,255,0.03);
          --em-cal-border:  rgba(255,255,255,0.06);
          --em-blur:        40px;
        }

        /* ============ ANIMATIONS ============ */
        @keyframes emIn {
          from { opacity:0; transform:scale(0.95) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);     }
        }
        @keyframes emFade { from{opacity:0} to{opacity:1} }

        /* ============ OVERLAY ============ */
        .em-overlay {
          position:fixed; inset:0; z-index:100;
          display:flex; align-items:center; justify-content:center;
          padding:16px; overflow-y:auto;
        }
        .em-backdrop {
          position:fixed; inset:0;
          background:var(--em-backdrop);
          backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
          animation:emFade 0.2s ease;
        }

        /* ============ MODAL CARD ============ */
        .em-modal {
          position:relative; width:100%; max-width:480px; margin:auto;
          background:var(--em-bg-gradient);
          backdrop-filter:blur(var(--em-blur)); -webkit-backdrop-filter:blur(var(--em-blur));
          border-radius:24px;
          border:1px solid var(--em-border);
          box-shadow:var(--em-shadow);
          overflow:hidden;
          animation:emIn 0.3s cubic-bezier(0.16,1,0.3,1);
          flex-shrink:0;
        }
        .em-accent-bar { height:2px; opacity:0.6; transition:background 0.4s; }

        /* ============ HEADER ============ */
        .em-header {
          padding:22px 28px 18px;
          border-bottom:1px solid var(--em-divider);
        }
        .em-header-row {
          display:flex; align-items:center; gap:8px; margin-bottom:6px;
        }
        .em-course-badge {
          padding:3px 10px; border-radius:6px;
          font-size:10px; font-weight:700;
          letter-spacing:0.06em; text-transform:uppercase; color:#fff;
        }
        .em-header-subtitle {
          font-size:12px; color:var(--em-text-3);
        }
        .em-header-name {
          font-size:18px; font-weight:600; color:var(--em-text-1);
          letter-spacing:-0.015em; line-height:1.3; margin:0;
        }

        /* ============ SCROLLABLE BODY ============ */
        .em-body { overflow-y:auto; max-height:62vh; }
        .em-section {
          padding:18px 28px;
          border-bottom:1px solid var(--em-divider);
        }
        .em-section:last-child { border-bottom:none; }
        .em-label {
          display:block; margin-bottom:10px;
          font-size:10px; font-weight:700;
          letter-spacing:0.07em; text-transform:uppercase;
          color:var(--em-text-3);
        }

        /* ============ NAME INPUT ============ */
        .em-name-input {
          width:100%;
          background:var(--em-input-bg) !important;
          border:1.5px solid var(--em-input-border) !important;
          border-radius:12px; padding:11px 14px;
          font-size:15px; font-weight:400; color:var(--em-text-1);
          font-family:inherit; outline:none;
          transition:border-color 0.2s;
          box-shadow:none !important; backdrop-filter:none !important;
          -webkit-backdrop-filter:none !important;
        }
        .em-name-input::placeholder { color:var(--em-text-4); }
        .em-name-input:focus { border-color:var(--em-input-focus) !important; }

        /* ============ TYPE PILL GRID ============ */
        .em-type-grid {
          display:grid; grid-template-columns:repeat(4,1fr); gap:7px;
        }
        @media (max-width:400px) {
          .em-type-grid { grid-template-columns:repeat(3,1fr); }
        }
        .em-type-pill {
          padding:8px 4px; border-radius:10px;
          font-size:12px; font-weight:500; font-family:inherit;
          text-align:center; cursor:pointer; line-height:1.25;
          border:1.5px solid var(--em-pill-border);
          background:var(--em-pill-bg); color:var(--em-pill-text);
          transition:all 0.15s ease;
        }
        .em-type-pill:hover:not(.em-type-active) {
          border-color:var(--em-input-border); background:var(--em-pill-hover);
        }
        .em-type-pill.em-type-active {
          color:#fff; border-color:transparent;
        }

        /* ============ DUE DATE SECTION ============ */
        .em-date-hero {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:14px;
        }
        .em-date-display {
          display:flex; align-items:center; gap:9px;
        }
        .em-date-dot {
          width:8px; height:8px; border-radius:50%; flex-shrink:0;
        }
        .em-date-text {
          font-size:14px; font-weight:500; color:var(--em-text-1);
        }
        .em-date-empty {
          font-size:13px; color:var(--em-text-4);
        }
        .em-date-clear {
          font-size:12px; font-weight:500; font-family:inherit;
          color:var(--em-text-3); background:none; border:none; cursor:pointer;
          padding:4px 8px; border-radius:6px; transition:color 0.15s,background 0.15s;
        }
        .em-date-clear:hover { color:var(--em-text-2); background:var(--em-pill-hover); }

        /* Calendar container */
        .em-cal-box {
          background:var(--em-cal-bg);
          border:1px solid var(--em-cal-border);
          border-radius:14px; overflow:hidden; padding:2px;
        }
        /* Force calendar to fill container */
        .em-cal-box > div { width:100%; }
        .em-cal-box table { width:100% !important; }

        /* ============ WEIGHT + SCORE ROW ============ */
        .em-metrics-row {
          display:grid; grid-template-columns:1fr 1fr; gap:14px;
        }
        .em-metric-card {
          background:var(--em-input-bg);
          border:1px solid var(--em-border-inner);
          border-radius:16px; padding:16px 14px;
          display:flex; flex-direction:column; align-items:center; gap:10px;
        }

        /* Weight ring */
        .em-weight-ring-wrap { position:relative; flex-shrink:0; }
        .em-weight-ring-center {
          position:absolute; inset:0;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center; pointer-events:none;
        }
        .em-weight-ring-value {
          font-size:14px; font-weight:700; color:var(--em-text-1);
          line-height:1; font-variant-numeric:tabular-nums;
        }
        .em-weight-ring-unit {
          font-size:8px; font-weight:600; color:var(--em-text-3);
          line-height:1; margin-top:1px;
        }

        /* Score ring */
        .em-score-ring-wrap { position:relative; flex-shrink:0; }
        .em-score-ring-center {
          position:absolute; inset:0;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center; pointer-events:none;
        }
        .em-score-ring-value {
          font-size:14px; font-weight:700; color:var(--em-text-1);
          line-height:1; font-variant-numeric:tabular-nums;
        }
        .em-score-ring-letter {
          font-size:9px; font-weight:700; line-height:1; margin-top:2px;
        }
        .em-score-ring-dash {
          font-size:20px; font-weight:200; color:var(--em-text-4);
        }

        /* Shared metric inputs */
        .em-metric-input {
          width:100%;
          background:transparent !important;
          border:1px solid var(--em-input-border) !important;
          border-radius:8px; padding:6px 8px;
          font-size:14px; color:var(--em-text-1); font-family:inherit;
          outline:none; text-align:center;
          transition:border-color 0.2s;
          box-shadow:none !important; backdrop-filter:none !important;
          -webkit-backdrop-filter:none !important;
        }
        .em-metric-input:focus { border-color:var(--em-input-focus) !important; }
        .em-metric-input::-webkit-inner-spin-button,
        .em-metric-input::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        .em-metric-sub {
          font-size:10px; color:var(--em-text-3);
          text-align:center; line-height:1.3; margin-top:-4px;
        }
        .em-no-score-state {
          display:flex; flex-direction:column; align-items:center; gap:4px;
        }
        .em-no-score-dash {
          font-size:28px; font-weight:200; color:var(--em-text-4); line-height:1;
        }
        .em-no-score-hint {
          font-size:10px; color:var(--em-text-4); text-align:center;
        }

        /* ============ FOOTER ============ */
        .em-footer {
          padding:16px 28px 20px;
          border-top:1px solid var(--em-divider);
        }
        .em-footer-actions {
          display:flex; align-items:center; gap:10px;
        }
        .em-btn-cancel {
          padding:10px 20px; border-radius:12px;
          font-size:14px; font-weight:500; font-family:inherit;
          cursor:pointer;
          border:1px solid var(--em-pill-border); background:transparent;
          color:var(--em-text-2); transition:all 0.18s;
        }
        .em-btn-cancel:hover {
          border-color:var(--em-input-border); background:var(--em-pill-hover);
        }
        .em-btn-save {
          flex:1; padding:10px 20px; border-radius:12px;
          font-size:14px; font-weight:600; font-family:inherit;
          border:none; color:#fff; cursor:pointer;
          transition:filter 0.2s, opacity 0.2s;
        }
        .em-btn-save:hover:not(:disabled) { filter:brightness(1.08); }
        .em-btn-save:disabled { opacity:0.35; cursor:not-allowed; filter:none; }

        /* Delete zone */
        .em-delete-zone {
          display:flex; align-items:center; justify-content:center;
          padding-top:12px;
        }
        .em-btn-delete {
          font-size:11px; font-weight:500; font-family:inherit;
          color:var(--em-text-4); background:none; border:none;
          cursor:pointer; padding:4px 8px; border-radius:6px;
          transition:color 0.15s;
        }
        .em-btn-delete:hover { color:hsl(0 84% 60% / 0.7); }
        .em-delete-confirm-row {
          display:flex; align-items:center; gap:8px;
          font-size:12px; color:var(--em-text-2);
        }
        .em-confirm-yes {
          font-size:12px; font-weight:600; font-family:inherit;
          color:hsl(0 84% 60%);
          background:hsl(0 84% 60% / 0.08); border:1px solid hsl(0 84% 60% / 0.20);
          border-radius:6px; padding:4px 12px; cursor:pointer; transition:all 0.15s;
        }
        .em-confirm-yes:hover { background:hsl(0 84% 60% / 0.15); border-color:hsl(0 84% 60% / 0.35); }
        .em-confirm-no {
          font-size:12px; font-weight:500; font-family:inherit;
          color:var(--em-text-3); background:none; border:none;
          cursor:pointer; padding:4px 8px; border-radius:6px; transition:color 0.15s;
        }
        .em-confirm-no:hover { color:var(--em-text-2); }
      `}</style>

      {/* ── OVERLAY ── */}
      <div className="em-overlay">
        <div className="em-backdrop" onClick={onClose} />

        {/* ── MODAL ── */}
        <div className="em-modal">

          {/* Accent bar */}
          <div
            className="em-accent-bar"
            style={{ background: `linear-gradient(90deg,transparent,${courseColor},transparent)` }}
          />

          {/* ── HEADER ── */}
          <div className="em-header">
            <div className="em-header-row">
              <span className="em-course-badge" style={{ background: courseColor }}>
                {courseCode}
              </span>
              <span className="em-header-subtitle">Edit Assignment</span>
            </div>
            <h2 className="em-header-name">{assignment.name}</h2>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="em-body">

            {/* ── NAME ── */}
            <div className="em-section">
              <span className="em-label">Name</span>
              <input
                className="em-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Assignment name…"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>

            {/* ── TYPE ── */}
            <div className="em-section">
              <span className="em-label">Type</span>
              <div className="em-type-grid">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn("em-type-pill", type === opt.value && "em-type-active")}
                    style={
                      type === opt.value
                        ? { background: courseColor, borderColor: courseColor }
                        : undefined
                    }
                    onClick={() => setType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── DUE DATE (HERO) ── */}
            <div className="em-section">
              <span className="em-label">Due Date</span>

              <div className="em-date-hero">
                {selectedDate ? (
                  <div className="em-date-display">
                    <span className="em-date-dot" style={{ background: courseColor }} />
                    <span className="em-date-text">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                ) : (
                  <span className="em-date-empty">No due date — pick one below</span>
                )}
                {selectedDate && (
                  <button className="em-date-clear" onClick={() => setSelectedDate(undefined)}>
                    Clear
                  </button>
                )}
              </div>

              <div className="em-cal-box">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  classNames={{
                    /* Let modifiersStyles handle the selected-day colour instead of bg-primary */
                    day_selected: "rounded-full font-semibold text-white",
                    day_today:    "rounded-full font-semibold underline underline-offset-4",
                    nav_button:   "h-7 w-7 bg-transparent p-0 opacity-40 hover:opacity-90 transition-opacity border-0 inline-flex items-center justify-center",
                  }}
                  modifiersStyles={{
                    selected: { backgroundColor: courseColor },
                  }}
                />
              </div>
            </div>

            {/* ── WEIGHT + SCORE ── */}
            <div className="em-section">
              <span className="em-label">Weight & Score</span>
              <div className="em-metrics-row">

                {/* Weight card */}
                <div className="em-metric-card">
                  <span className="em-label" style={{ marginBottom: 0 }}>Weight</span>
                  <WeightRing weight={weight} color={courseColor} />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="em-metric-input"
                    value={weight || ""}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="em-metric-sub">% of course grade</p>
                </div>

                {/* Score card */}
                <div className="em-metric-card">
                  <span className="em-label" style={{ marginBottom: 0 }}>Score</span>
                  {scoreStr !== "" && displayScore !== null && !isNaN(displayScore) ? (
                    <ScoreRing score={Math.min(Math.max(displayScore, 0), 100)} />
                  ) : (
                    <div className="em-no-score-state">
                      <span className="em-no-score-dash">—</span>
                      <span className="em-no-score-hint">No grade yet</span>
                    </div>
                  )}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="em-metric-input"
                    value={scoreStr}
                    onChange={(e) => setScoreStr(e.target.value)}
                    placeholder="—"
                  />
                  <p className="em-metric-sub">
                    {gradeInfo ? (
                      <span style={{ color: gradeInfo.color, fontWeight: 600 }}>
                        {gradeInfo.letter} · {gradeInfo.label}
                      </span>
                    ) : (
                      "optional"
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>{/* end .em-body */}

          {/* ── FOOTER ── */}
          <div className="em-footer">
            <div className="em-footer-actions">
              <button className="em-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                className="em-btn-save"
                disabled={!canSave}
                onClick={handleSave}
                style={
                  canSave
                    ? {
                        background: `linear-gradient(135deg,${courseColor}dd,${courseColor}aa)`,
                        boxShadow:  `0 4px 20px ${courseColor}30`,
                      }
                    : undefined
                }
              >
                Save Changes
              </button>
            </div>

            {/* Delete zone */}
            <div className="em-delete-zone">
              {deleteConfirm ? (
                <div className="em-delete-confirm-row">
                  <span>Delete this assignment?</span>
                  <button className="em-confirm-yes" onClick={onDelete}>Delete</button>
                  <button className="em-confirm-no" onClick={() => setDeleteConfirm(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="em-btn-delete"
                  onClick={() => setDeleteConfirm(true)}
                >
                  Delete assignment
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
