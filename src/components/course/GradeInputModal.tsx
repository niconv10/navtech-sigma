import { useState, useEffect, useRef, useCallback } from "react";
import type { Assignment } from "@/types";
import { formatAssignmentType } from "@/lib/gradeUtils";
import { format } from "date-fns";

/* ─────────────────────────────────────────────
   GRADE COLOR SCALE
   A  = green
   B  = green→yellow blend
   C  = yellow / amber
   D  = orange (yellow→red)
   F  = red
   ───────────────────────────────────────────── */
const GRADE_THRESHOLDS = [
  { min: 93, letter: "A", color: "#34d399", label: "Excellent" },
  { min: 90, letter: "A-", color: "#4ade80", label: "Excellent" },
  { min: 87, letter: "B+", color: "#a3e635", label: "Great" },
  { min: 83, letter: "B", color: "#bef264", label: "Good" },
  { min: 80, letter: "B-", color: "#d4e157", label: "Good" },
  { min: 77, letter: "C+", color: "#facc15", label: "Average" },
  { min: 73, letter: "C", color: "#eab308", label: "Average" },
  { min: 70, letter: "C-", color: "#f59e0b", label: "Fair" },
  { min: 60, letter: "D", color: "#f97316", label: "Below Average" },
  { min: 0, letter: "F", color: "#ef4444", label: "Needs Improvement" },
];

function getGradeInfo(score: string | number | null | undefined) {
  if (score === null || score === undefined || score === "") return null;
  const num = parseFloat(String(score));
  if (isNaN(num) || num < 0) return null;
  for (const t of GRADE_THRESHOLDS) {
    if (num >= t.min) return t;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

/* ─── Score Ring ─── */
function ScoreRing({
  score,
  maxScore = 100,
  size = 164,
  strokeWidth = 7,
}: {
  score: string;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const num = parseFloat(score);
  const pct = !isNaN(num) ? Math.min(Math.max(num / maxScore, 0), 1) : 0;
  const offset = circ - pct * circ;
  const g = getGradeInfo(score);
  const color = g?.color || "var(--gm-ring-empty)";

  return (
    <div className="gm-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gm-ring-track)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease",
            filter: g ? `drop-shadow(0 0 8px ${color}40)` : "none",
          }}
        />
      </svg>
      <div className="gm-ring-center">
        {score !== "" && !isNaN(num) ? (
          <>
            <span className="gm-ring-value">{num % 1 === 0 ? parseInt(score, 10) : num.toFixed(1)}</span>
            <span className="gm-ring-label">out of {maxScore}</span>
          </>
        ) : (
          <>
            <span className="gm-ring-value gm-ring-empty">—</span>
            <span className="gm-ring-label">Enter score</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Quick Pill ─── */
function QuickPill({
  label,
  isActive,
  onClick,
  color,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={`gm-pill ${isActive ? "gm-pill-active" : ""}`}
      style={
        isActive && color
          ? {
              borderColor: `${color}55`,
              background: `${color}12`,
              color: color,
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}

/* ─── Props ─── */
interface GradeInputModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (score: number | null) => void;
  assignment: Assignment | null;
  courseCode: string;
  courseColor: string;
  initialScore: string;
}

/* ─── Main ─── */
export function GradeInputModal({
  open,
  onClose,
  onSave,
  assignment,
  courseCode,
  courseColor,
  initialScore,
}: GradeInputModalProps) {
  const [score, setScore] = useState(initialScore);
  const [isSliding, setIsSliding] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setScore(initialScore);
  }, [initialScore, open]);

  const g = getGradeInfo(score);
  const num = parseFloat(score);
  const has = score !== "" && !isNaN(num);
  const isEditing = initialScore !== "" && !isNaN(parseFloat(initialScore));
  const canSave = has || isEditing; // allow saving empty to remove an existing grade
  const accent = g?.color || courseColor;
  const fill = Math.min(Math.max(!isNaN(num) ? num : 0, 0), 100);
  const quickScores = [100, 95, 90, 85, 80, 75];

  const calc = useCallback((cx: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(cx - rect.left, rect.width));
    setScore((Math.round((x / rect.width) * 200) / 2).toString());
  }, []);

  useEffect(() => {
    if (!isSliding) return;
    const move = (e: MouseEvent) => calc(e.clientX);
    const up = () => setIsSliding(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [isSliding, calc]);

  if (!open || !assignment) return null;

  return (
    <>
      {/* ── SCOPED STYLES — uses CSS variables from index.css ── */}
      <style>{`
        /* ============ THEME TOKENS ============ */
        .gm-overlay {
          --gm-backdrop: rgba(0,0,0,0.45);
          --gm-bg: rgba(255,255,255,0.92);
          --gm-bg-gradient: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,248,250,0.98) 100%);
          --gm-border: rgba(0,0,0,0.08);
          --gm-border-focus: rgba(0,0,0,0.18);
          --gm-shadow: 0 32px 64px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
          --gm-inset: inset 0 1px 0 rgba(255,255,255,0.95);
          --gm-text-1: hsl(0 0% 10%);
          --gm-text-2: hsl(220 9% 46%);
          --gm-text-3: rgba(0,0,0,0.35);
          --gm-text-4: rgba(0,0,0,0.22);
          --gm-input-bg: rgba(0,0,0,0.03);
          --gm-input-border: rgba(0,0,0,0.1);
          --gm-input-border-focus: rgba(0,0,0,0.2);
          --gm-ring-track: rgba(0,0,0,0.06);
          --gm-ring-empty: rgba(0,0,0,0.08);
          --gm-slider-track: rgba(0,0,0,0.06);
          --gm-marker: rgba(0,0,0,0.18);
          --gm-pill-bg: rgba(0,0,0,0.03);
          --gm-pill-border: rgba(0,0,0,0.08);
          --gm-pill-text: rgba(0,0,0,0.45);
          --gm-pill-hover-bg: rgba(0,0,0,0.05);
          --gm-pill-hover-border: rgba(0,0,0,0.12);
          --gm-pill-hover-text: rgba(0,0,0,0.6);
          --gm-btn-ghost-border: rgba(0,0,0,0.1);
          --gm-btn-ghost-text: rgba(0,0,0,0.45);
          --gm-btn-ghost-hover-bg: rgba(0,0,0,0.04);
          --gm-btn-ghost-hover-border: rgba(0,0,0,0.16);
          --gm-btn-ghost-hover-text: rgba(0,0,0,0.7);
          --gm-save-disabled-bg: rgba(0,0,0,0.04);
          --gm-save-disabled-text: rgba(0,0,0,0.18);
          --gm-blur: 20px;
        }

        /* ── DARK MODE OVERRIDES ── */
        .dark .gm-overlay {
          --gm-backdrop: rgba(0,0,0,0.72);
          --gm-bg: rgba(28,28,32,0.97);
          --gm-bg-gradient: linear-gradient(180deg, rgba(30,30,34,0.98) 0%, rgba(18,18,22,0.99) 100%);
          --gm-border: rgba(255,255,255,0.07);
          --gm-border-focus: rgba(255,255,255,0.14);
          --gm-shadow: 0 32px 64px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
          --gm-inset: inset 0 1px 0 rgba(255,255,255,0.04);
          --gm-text-1: #f0f0f0;
          --gm-text-2: rgba(255,255,255,0.65);
          --gm-text-3: rgba(255,255,255,0.35);
          --gm-text-4: rgba(255,255,255,0.2);
          --gm-input-bg: rgba(255,255,255,0.025);
          --gm-input-border: rgba(255,255,255,0.08);
          --gm-input-border-focus: rgba(255,255,255,0.16);
          --gm-ring-track: rgba(255,255,255,0.04);
          --gm-ring-empty: rgba(255,255,255,0.06);
          --gm-slider-track: rgba(255,255,255,0.04);
          --gm-marker: rgba(255,255,255,0.13);
          --gm-pill-bg: rgba(255,255,255,0.015);
          --gm-pill-border: rgba(255,255,255,0.06);
          --gm-pill-text: rgba(255,255,255,0.38);
          --gm-pill-hover-bg: rgba(255,255,255,0.04);
          --gm-pill-hover-border: rgba(255,255,255,0.12);
          --gm-pill-hover-text: rgba(255,255,255,0.6);
          --gm-btn-ghost-border: rgba(255,255,255,0.07);
          --gm-btn-ghost-text: rgba(255,255,255,0.45);
          --gm-btn-ghost-hover-bg: rgba(255,255,255,0.04);
          --gm-btn-ghost-hover-border: rgba(255,255,255,0.14);
          --gm-btn-ghost-hover-text: rgba(255,255,255,0.7);
          --gm-save-disabled-bg: rgba(255,255,255,0.05);
          --gm-save-disabled-text: rgba(255,255,255,0.18);
          --gm-blur: 40px;
        }

        /* ============ ANIMATIONS ============ */
        @keyframes gmModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ============ LAYOUT ============ */
        .gm-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .gm-backdrop {
          position: absolute; inset: 0;
          background: var(--gm-backdrop);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          animation: gmFadeIn 0.25s ease;
        }

        /* ============ MODAL CARD ============ */
        .gm-modal {
          position: relative; width: 100%; max-width: 400px;
          background: var(--gm-bg-gradient);
          backdrop-filter: blur(var(--gm-blur));
          -webkit-backdrop-filter: blur(var(--gm-blur));
          border-radius: 24px;
          border: 1px solid var(--gm-border);
          box-shadow: var(--gm-shadow);
          overflow: hidden;
          animation: gmModalIn 0.3s cubic-bezier(0.16,1,0.3,1);
        }

        /* Top accent bar — uses course color */
        .gm-accent-bar {
          height: 2px; opacity: 0.5;
          transition: background 0.4s ease;
        }

        /* ============ HEADER ============ */
        .gm-header { padding: 24px 28px 0; text-align: center; }
        .gm-badges { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 14px; }
        .gm-course-badge {
          padding: 3px 10px; border-radius: 6px;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: #fff;
        }
        .gm-type-label {
          font-size: 12px; font-weight: 400;
          color: var(--gm-text-3);
        }
        .gm-title {
          font-size: 19px; font-weight: 600;
          color: var(--gm-text-1);
          margin: 0; letter-spacing: -0.015em; line-height: 1.3;
        }
        .gm-due {
          font-size: 12px; font-weight: 400;
          color: var(--gm-text-4);
          margin: 5px 0 0;
        }

        /* ============ SCORE RING ============ */
        .gm-ring-section {
          display: flex; flex-direction: column; align-items: center;
          padding: 24px 28px 16px;
        }
        .gm-ring-wrap { position: relative; }
        .gm-ring-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          pointer-events: none;
        }
        .gm-ring-value {
          font-size: 40px; font-weight: 200;
          color: var(--gm-text-1);
          letter-spacing: -0.03em; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .gm-ring-value.gm-ring-empty {
          color: var(--gm-text-4);
          font-size: 38px;
        }
        .gm-ring-label {
          font-size: 10px; font-weight: 500;
          color: var(--gm-text-3);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-top: 6px;
        }

        /* Grade pill badge */
        .gm-grade-pill {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 14px; padding: 5px 14px;
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .gm-grade-letter { font-size: 14px; font-weight: 600; }
        .gm-grade-divider { width: 1px; height: 12px; }
        .gm-grade-label { font-size: 11px; font-weight: 400; }

        /* ============ INPUT SECTION ============ */
        .gm-input-section { padding: 0 28px; }

        /* Score input container — MUST override global input glass styles */
        .gm-score-box {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px; border-radius: 14px;
          background: var(--gm-input-bg) !important;
          border: 1.5px solid var(--gm-input-border) !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          margin-bottom: 16px;
          cursor: text;
          transition: border-color 0.25s ease, background 0.25s ease;
        }
        .gm-score-box.gm-focused {
          background: var(--gm-input-bg) !important;
        }
        .gm-score-label {
          font-size: 12px; font-weight: 500;
          color: var(--gm-text-3);
          flex-shrink: 0; user-select: none;
          transition: color 0.2s ease;
        }
        .gm-focused .gm-score-label {
          color: var(--gm-text-2);
        }

        /* Raw input — kill ALL inherited styles */
        .gm-score-input {
          flex: 1; width: 100%; min-width: 0;
          background: none !important;
          border: none !important;
          border-top: none !important;
          border-bottom: none !important;
          outline: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: textfield !important;
          appearance: textfield !important;
          font-size: 22px; font-weight: 300;
          color: var(--gm-text-1);
          text-align: right;
          font-family: inherit;
          letter-spacing: -0.02em;
          padding: 0 !important; margin: 0;
        }
        .gm-score-input:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .gm-score-input::-webkit-inner-spin-button,
        .gm-score-input::-webkit-outer-spin-button {
          -webkit-appearance: none !important;
          margin: 0; display: none;
        }
        .gm-score-input::placeholder {
          color: var(--gm-text-4);
          font-weight: 300;
        }
        .gm-score-input::selection {
          background: rgba(128,128,128,0.15);
        }
        .gm-score-suffix {
          font-size: 14px; font-weight: 300;
          color: var(--gm-text-4);
          flex-shrink: 0; user-select: none;
        }

        /* ============ SLIDER ============ */
        .gm-slider-wrap { padding: 0 2px; margin-bottom: 18px; }
        .gm-slider {
          position: relative; height: 32px;
          cursor: pointer; user-select: none; touch-action: none;
        }
        .gm-slider-track {
          position: absolute; top: 13px; left: 0; right: 0;
          height: 4px; border-radius: 2px;
          background: var(--gm-slider-track);
          overflow: hidden;
        }
        .gm-slider-fill {
          height: 100%; border-radius: 2px;
        }
        .gm-slider-thumb {
          position: absolute; top: 8px;
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.85);
          transform: translateX(-50%);
        }
        :root:not(.dark) .gm-slider-thumb {
          border-color: rgba(255,255,255,0.95);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .gm-slider-mark {
          position: absolute; top: 23px;
          transform: translateX(-50%);
          font-size: 9px; font-weight: 400;
          color: var(--gm-marker);
          user-select: none;
        }

        /* ============ QUICK PILLS ============ */
        .gm-pills {
          display: flex; flex-wrap: wrap; gap: 6px;
          justify-content: center; margin-bottom: 4px;
        }
        .gm-pill {
          padding: 5px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 500;
          line-height: 18px; font-family: inherit;
          cursor: pointer;
          border: 1px solid var(--gm-pill-border);
          background: var(--gm-pill-bg);
          color: var(--gm-pill-text);
          transition: all 0.2s ease;
        }
        .gm-pill:hover {
          border-color: var(--gm-pill-hover-border);
          background: var(--gm-pill-hover-bg);
          color: var(--gm-pill-hover-text);
        }
        .gm-pill-active {
          /* active colors set via inline style for dynamic grade color */
        }
        .gm-pill-active:hover {
          opacity: 0.9;
        }

        /* ============ FOOTER ============ */
        .gm-footer {
          display: flex; align-items: center; gap: 10px;
          padding: 20px 28px 24px;
        }
        .gm-btn-remove {
          padding: 10px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 500; font-family: inherit;
          cursor: pointer;
          border: 1px solid hsl(0 84% 60% / 0.15);
          background: hsl(0 84% 60% / 0.06);
          color: hsl(0 84% 60% / 0.7);
          transition: all 0.2s ease;
        }
        .gm-btn-remove:hover {
          border-color: hsl(0 84% 60% / 0.3);
          background: hsl(0 84% 60% / 0.1);
          color: hsl(0 84% 60%);
        }
        .gm-btn-cancel {
          padding: 10px 22px; border-radius: 12px;
          font-size: 14px; font-weight: 500; font-family: inherit;
          cursor: pointer;
          border: 1px solid var(--gm-btn-ghost-border);
          background: transparent;
          color: var(--gm-btn-ghost-text);
          transition: all 0.2s ease;
        }
        .gm-btn-cancel:hover {
          border-color: var(--gm-btn-ghost-hover-border);
          background: var(--gm-btn-ghost-hover-bg);
          color: var(--gm-btn-ghost-hover-text);
        }
        .gm-btn-save {
          padding: 10px 26px; border-radius: 12px;
          font-size: 14px; font-weight: 600; font-family: inherit;
          border: none; color: #fff; cursor: pointer;
          transition: all 0.3s ease;
        }
        .gm-btn-save:hover {
          filter: brightness(1.08);
        }
        .gm-btn-save:disabled {
          background: var(--gm-save-disabled-bg) !important;
          color: var(--gm-save-disabled-text) !important;
          box-shadow: none !important;
          cursor: not-allowed;
          filter: none;
        }
      `}</style>

      {/* ── OVERLAY ── */}
      <div className="gm-overlay">
        <div className="gm-backdrop" onClick={onClose} />

        {/* ── MODAL ── */}
        <div className="gm-modal">
          {/* Accent bar */}
          <div
            className="gm-accent-bar"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />

          {/* Header */}
          <div className="gm-header">
            <div className="gm-badges">
              <span className="gm-course-badge" style={{ background: courseColor }}>
                {courseCode}
              </span>
              <span className="gm-type-label">
                {formatAssignmentType(assignment.type)} • {assignment.weight}%
              </span>
            </div>
            <h2 className="gm-title">{assignment.name}</h2>
            {assignment.dueDate && <p className="gm-due">Due {format(new Date(assignment.dueDate), "MMMM d, yyyy")}</p>}
          </div>

          {/* Score Ring */}
          <div className="gm-ring-section">
            <ScoreRing score={score} />
            {g && has && (
              <div
                className="gm-grade-pill"
                style={{
                  background: `${g.color}10`,
                  border: `1px solid ${g.color}20`,
                }}
              >
                <span className="gm-grade-letter" style={{ color: g.color }}>
                  {g.letter}
                </span>
                <span className="gm-grade-divider" style={{ background: `${g.color}28` }} />
                <span className="gm-grade-label" style={{ color: `${g.color}bb` }}>
                  {g.label}
                </span>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="gm-input-section">
            {/* Score box */}
            <div
              className={`gm-score-box ${inputFocused ? "gm-focused" : ""}`}
              style={
                inputFocused
                  ? {
                      borderColor: `${accent}44`,
                    }
                  : undefined
              }
              onClick={() => inputRef.current?.focus()}
            >
              <span className="gm-score-label">Score</span>
              <input
                ref={inputRef}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Enter grade"
                className="gm-score-input"
              />
              <span className="gm-score-suffix">/ 100</span>
            </div>

            {/* Slider */}
            <div className="gm-slider-wrap">
              <div
                ref={sliderRef}
                className="gm-slider"
                onMouseDown={(e) => {
                  setIsSliding(true);
                  calc(e.clientX);
                }}
              >
                <div className="gm-slider-track">
                  <div
                    className="gm-slider-fill"
                    style={{
                      width: `${fill}%`,
                      background: g ? `linear-gradient(90deg, ${g.color}55, ${g.color})` : "var(--gm-ring-empty)",
                      transition: isSliding ? "none" : "width 0.3s ease, background 0.3s ease",
                    }}
                  />
                </div>
                {has && (
                  <div
                    className="gm-slider-thumb"
                    style={{
                      left: `${fill}%`,
                      background: g?.color || "var(--gm-text-2)",
                      boxShadow: `0 0 8px ${g?.color || "transparent"}44`,
                      transition: isSliding ? "none" : "left 0.3s ease, background 0.3s ease",
                    }}
                  />
                )}
                {[60, 70, 80, 90].map((m) => (
                  <div key={m} className="gm-slider-mark" style={{ left: `${m}%` }}>
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick pills */}
            <div className="gm-pills">
              {quickScores.map((qs) => (
                <QuickPill
                  key={qs}
                  label={`${qs}`}
                  isActive={has && num === qs}
                  onClick={() => setScore(qs.toString())}
                  color={getGradeInfo(qs)?.color || null}
                />
              ))}
              {has && <QuickPill label="Clear" isActive={false} onClick={() => setScore("")} color={null} />}
            </div>
          </div>

          {/* Footer */}
          <div className="gm-footer">
            {/* Remove Grade — only when editing an existing grade */}
            {isEditing && (
              <button className="gm-btn-remove" onClick={() => onSave(null)}>
                Remove Grade
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="gm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="gm-btn-save"
              disabled={!canSave}
              onClick={() => onSave(has ? parseFloat(score) : null)}
              style={
                has
                  ? {
                      background: `linear-gradient(135deg, ${accent}dd, ${accent}aa)`,
                      boxShadow: `0 4px 20px ${accent}30`,
                    }
                  : isEditing && !has
                    ? {
                        background: "var(--gm-save-disabled-bg)",
                        color: "hsl(0 84% 60%)",
                        border: "1px solid hsl(0 84% 60% / 0.2)",
                      }
                    : undefined
              }
            >
              {has ? "Save Grade" : isEditing ? "Clear Grade" : "Save Grade"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
