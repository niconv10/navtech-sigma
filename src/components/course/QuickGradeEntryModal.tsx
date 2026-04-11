/**
 * QuickGradeEntryModal
 *
 * Lets students batch-enter grades for all ungraded assignments in a course
 * without opening each assignment individually.  Tab key navigates between
 * score inputs and a live projected-grade preview updates in real time.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { updateAssignmentInDatabase } from '@/hooks/useCourses';
import { useSemesterStore } from '@/stores/useSemesterStore';
import { calculateCourseGrade, percentageToLetter } from '@/lib/gradeUtils';
import type { Course, Assignment } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  exam: 'Exam',
  quiz: 'Quiz',
  homework: 'HW',
  project: 'Proj',
  paper: 'Paper',
  lab: 'Lab',
  discussion: 'Disc',
  participation: 'Part',
  other: 'Other',
};

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
}

export function QuickGradeEntryModal({ open, onOpenChange, course }: Props) {
  const { updateAssignmentScore } = useSemesterStore();

  /** assignment id → raw string value typed in the input */
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Only show non-archived, not-yet-graded assignments
  const ungradedAssignments = useMemo(
    () => course.assignments.filter((a) => !a.archived && a.score === null),
    [course.assignments],
  );

  // Reset state whenever the dialog opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      ungradedAssignments.forEach((a) => {
        initial[a.id] = '';
      });
      setScores(initial);
    }
  }, [open]); // intentionally omit ungradedAssignments to avoid resetting mid-session

  // ── Live projected grade ───────────────────────────────────────────────

  const currentGrade = useMemo(
    () => calculateCourseGrade(course.assignments),
    [course.assignments],
  );

  const projectedGrade = useMemo(() => {
    const withScores: Assignment[] = course.assignments.map((a) => {
      if (a.archived || a.score !== null) return a;
      const raw = scores[a.id];
      if (raw === undefined || raw === '') return a;
      const parsed = parseFloat(raw);
      return { ...a, score: isNaN(parsed) ? null : parsed };
    });
    return calculateCourseGrade(withScores);
  }, [course.assignments, scores]);

  const gradeDelta = projectedGrade - currentGrade;

  // ── Input handling ─────────────────────────────────────────────────────

  const handleScoreChange = (id: string, val: string) => {
    // Allow empty string, or numeric values with up to 3 digits and 2 decimal places
    if (val === '' || /^\d{0,3}(\.\d{0,2})?$/.test(val)) {
      setScores((prev) => ({ ...prev, [id]: val }));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      const next = ungradedAssignments[idx + 1];
      if (next) inputRefs.current[next.id]?.focus();
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const entries = Object.entries(scores).filter(([, v]) => v !== '');

    if (entries.length === 0) {
      toast.info('No grades entered yet.');
      return;
    }

    // Validate
    for (const [id, v] of entries) {
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > 100) {
        const a = course.assignments.find((x) => x.id === id);
        toast.error('Invalid score', {
          description: `"${a?.name}" must be between 0 and 100.`,
        });
        return;
      }
    }

    setSaving(true);
    let saved = 0;
    let failed = 0;

    for (const [id, v] of entries) {
      const score = parseFloat(v);
      const { success } = await updateAssignmentInDatabase(id, { score });
      if (success) {
        updateAssignmentScore(course.id, id, score);
        saved++;
      } else {
        failed++;
      }
    }

    setSaving(false);

    if (failed > 0) {
      toast.error(`${failed} grade${failed > 1 ? 's' : ''} failed to save.`, {
        description: 'Check your connection and try again.',
      });
    } else {
      toast.success(
        `${saved} grade${saved > 1 ? 's' : ''} saved!`,
        { description: `${course.code} updated.` },
      );
      onOpenChange(false);
    }
  }, [scores, course, updateAssignmentScore, onOpenChange]);

  // ── Derived UI values ──────────────────────────────────────────────────

  const enteredCount = Object.values(scores).filter((v) => v !== '').length;

  const DeltaIcon =
    gradeDelta > 0.05
      ? TrendingUp
      : gradeDelta < -0.05
        ? TrendingDown
        : Minus;

  const deltaClass =
    gradeDelta > 0.05
      ? 'text-green-500'
      : gradeDelta < -0.05
        ? 'text-red-500'
        : 'text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Quick Grade Entry — {course.code}
          </DialogTitle>
        </DialogHeader>

        {ungradedAssignments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            All assignments have been graded! 🎉
          </p>
        ) : (
          <>
            {/* ── Grade preview bar ── */}
            <div className="quick-grade-preview">
              <div className="quick-grade-preview-item">
                <span className="quick-grade-label">Current</span>
                <span className="quick-grade-value">
                  {currentGrade > 0 ? `${currentGrade.toFixed(1)}%` : '—'}
                </span>
                {currentGrade > 0 && (
                  <span className="quick-grade-letter">
                    {percentageToLetter(currentGrade, course.gradingScale)}
                  </span>
                )}
              </div>

              <DeltaIcon className={cn('w-4 h-4 mx-2 shrink-0', deltaClass)} />

              <div className="quick-grade-preview-item">
                <span className="quick-grade-label">Projected</span>
                <span className={cn('quick-grade-value', deltaClass)}>
                  {projectedGrade > 0 ? `${projectedGrade.toFixed(1)}%` : '—'}
                </span>
                {projectedGrade > 0 && (
                  <span className="quick-grade-letter">
                    {percentageToLetter(projectedGrade, course.gradingScale)}
                  </span>
                )}
              </div>
            </div>

            {/* ── Assignment table ── */}
            <div className="quick-grade-table-wrapper">
              <div className="quick-grade-table-header">
                <span>Assignment</span>
                <span>Type</span>
                <span>Wt %</span>
                <span>Score %</span>
              </div>
              <div className="quick-grade-table-body">
                {ungradedAssignments.map((a, idx) => (
                  <div key={a.id} className="quick-grade-row">
                    <span className="quick-grade-name" title={a.name}>
                      {a.name}
                    </span>
                    <span className="quick-grade-type">
                      {TYPE_LABEL[a.type] ?? a.type}
                    </span>
                    <span className="quick-grade-weight">{a.weight}</span>
                    <input
                      ref={(el) => {
                        inputRefs.current[a.id] = el;
                      }}
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={scores[a.id] ?? ''}
                      onChange={(e) => handleScoreChange(a.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className={cn(
                        'quick-grade-input',
                        scores[a.id] !== '' && 'quick-grade-input--filled',
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Press <kbd className="kbd">Tab</kbd> or <kbd className="kbd">Enter</kbd> to move to
              the next field. Leave blank to skip.
            </p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          {ungradedAssignments.length > 0 && (
            <Button onClick={handleSave} disabled={saving || enteredCount === 0}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Save {enteredCount > 0 ? enteredCount : ''} Grade
                  {enteredCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
