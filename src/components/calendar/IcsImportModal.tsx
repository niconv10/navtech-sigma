/**
 * IcsImportModal
 *
 * Lets students import due dates from a Canvas/Outlook/Google .ics file.
 * After parsing, each event is fuzzy-matched (nameSimilarity) to existing
 * assignments across all courses.  Users review the matches and click
 * "Apply" to persist the due dates to Supabase.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, CalendarIcon, CheckCircle2, AlertTriangle, Link } from 'lucide-react';
import { toast } from 'sonner';
import { parseIcs } from '@/lib/icsParser';
import type { IcsEvent } from '@/lib/icsParser';
import { nameSimilarity, MATCH_THRESHOLD } from '@/lib/syllabusUpdater';
import { updateAssignmentInDatabase } from '@/hooks/useCourses';
import { useSemesterStore } from '@/stores/useSemesterStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Course } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchedEvent {
  event: IcsEvent;
  courseId: string;
  courseCode: string;
  assignmentId: string;
  assignmentName: string;
  score: number;
  selected: boolean;
}

interface UnmatchedEvent {
  event: IcsEvent;
}

// ─── Matching logic ───────────────────────────────────────────────────────────

function matchEvents(events: IcsEvent[], courses: Course[]): {
  matched: MatchedEvent[];
  unmatched: UnmatchedEvent[];
} {
  const matched: MatchedEvent[] = [];
  const unmatched: UnmatchedEvent[] = [];

  for (const event of events) {
    let bestScore = 0;
    let bestMatch: Omit<MatchedEvent, 'event' | 'score' | 'selected'> | null = null;

    for (const course of courses) {
      // Optional: filter by courseHint if it matches the course code
      if (event.courseHint) {
        const hintNorm = event.courseHint.replace(/\s+/g, '').toUpperCase();
        const codeNorm = course.code.replace(/\s+/g, '').toUpperCase();
        if (!codeNorm.includes(hintNorm) && !hintNorm.includes(codeNorm)) {
          continue; // skip courses that don't match the hint
        }
      }

      for (const assignment of course.assignments) {
        if (assignment.archived) continue;
        const score = nameSimilarity(event.summary, assignment.name);
        if (score >= MATCH_THRESHOLD && score > bestScore) {
          bestScore = score;
          bestMatch = {
            courseId: course.id,
            courseCode: course.code,
            assignmentId: assignment.id,
            assignmentName: assignment.name,
          };
        }
      }
    }

    if (bestMatch) {
      matched.push({ event, ...bestMatch, score: bestScore, selected: true });
    } else {
      unmatched.push({ event });
    }
  }

  return { matched, unmatched };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
}

type Step = 'upload' | 'preview' | 'applying' | 'done';

export function IcsImportModal({ open, onOpenChange, courses }: Props) {
  const { updateAssignment } = useSemesterStore();

  const [step, setStep] = useState<Step>('upload');
  const [matched, setMatched]   = useState<MatchedEvent[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedEvent[]>([]);
  const [dragging, setDragging] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  const selectedCount = useMemo(
    () => matched.filter((m) => m.selected).length,
    [matched],
  );

  // ── File handling ──────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.ics') && !file.name.endsWith('.ical')) {
      toast.error('Invalid file', { description: 'Please upload a .ics or .ical file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const events = parseIcs(text);

      if (events.length === 0) {
        toast.warning('No events found', { description: 'The file contains no calendar events.' });
        return;
      }

      const { matched: m, unmatched: u } = matchEvents(events, courses);
      setMatched(m);
      setUnmatched(u);
      setStep('preview');
    };
    reader.readAsText(file);
  }, [courses]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ── Toggle selection ───────────────────────────────────────────────────────

  const toggleMatch = (idx: number) => {
    setMatched((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, selected: !m.selected } : m)),
    );
  };

  const toggleAll = () => {
    const allSelected = matched.every((m) => m.selected);
    setMatched((prev) => prev.map((m) => ({ ...m, selected: !allSelected })));
  };

  // ── Apply ──────────────────────────────────────────────────────────────────

  const handleApply = useCallback(async () => {
    const toApply = matched.filter((m) => m.selected);
    if (toApply.length === 0) return;

    setStep('applying');
    let saved = 0;

    for (const m of toApply) {
      const { success } = await updateAssignmentInDatabase(m.assignmentId, {
        due_date: m.event.date,
      });
      if (success) {
        updateAssignment(m.courseId, m.assignmentId, { dueDate: m.event.date });
        saved++;
      }
    }

    setAppliedCount(saved);
    setStep('done');
  }, [matched, updateAssignment]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('upload');
      setMatched([]);
      setUnmatched([]);
      setAppliedCount(0);
    }, 300);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Import .ics Calendar
          </DialogTitle>
        </DialogHeader>

        {/* STEP: upload */}
        {step === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'ics-drop-zone',
              dragging && 'ics-drop-zone--active',
            )}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Drop your .ics file here</p>
            <p className="text-xs text-muted-foreground mb-4">
              Export from Canvas → Calendar → Export Calendar, then upload the file.
            </p>
            <label className="cursor-pointer">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Browse File
              </span>
              <input
                type="file"
                accept=".ics,.ical"
                onChange={handleFileInput}
                className="sr-only"
              />
            </label>
          </div>
        )}

        {/* STEP: preview */}
        {step === 'preview' && (
          <div className="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">
            {matched.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {matched.length} match{matched.length !== 1 ? 'es' : ''} found
                  </p>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-primary hover:underline"
                  >
                    {matched.every((m) => m.selected) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="ics-match-list overflow-y-auto flex-1">
                  {matched.map((m, idx) => (
                    <label
                      key={`${m.event.uid}-${idx}`}
                      className={cn('ics-match-row', m.selected && 'ics-match-row--selected')}
                    >
                      <input
                        type="checkbox"
                        checked={m.selected}
                        onChange={() => toggleMatch(idx)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-primary">{m.courseCode}</span>
                          <Link className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">
                            {m.assignmentName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          .ics: "{m.event.summary}"
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">
                          {format(new Date(m.event.date), 'MMM d')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(m.score * 100)}% match
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          m.selected
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/30',
                        )}
                      >
                        {m.selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {unmatched.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                  {unmatched.length} event{unmatched.length !== 1 ? 's' : ''} could not be matched:
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                  {unmatched.map((u, i) => (
                    <p key={i} className="truncate">• {u.event.summary} ({u.event.date})</p>
                  ))}
                </div>
              </div>
            )}

            {matched.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-sm font-medium">No matches found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  None of the .ics events could be matched to your assignments.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP: applying */}
        {step === 'applying' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Applying due dates…</p>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-base font-semibold">Done!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {appliedCount} due date{appliedCount !== 1 ? 's' : ''} applied.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && matched.length > 0 && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={selectedCount === 0}>
                Apply {selectedCount > 0 ? selectedCount : ''} Date{selectedCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {(step === 'upload' || step === 'done' || (step === 'preview' && matched.length === 0)) && (
            <Button variant="outline" onClick={handleClose}>
              {step === 'done' ? 'Close' : 'Cancel'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
