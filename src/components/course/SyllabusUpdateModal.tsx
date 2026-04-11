import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Assignment, AssignmentType, Course } from '@/types';
import { computeSyllabusDiff, type SyllabusDiff, type AssignmentDiff } from '@/lib/syllabusUpdater';
import {
  addAssignmentToDatabase,
  archiveAssignmentInDatabase,
  deleteAssignmentFromDatabase,
  updateAssignmentInDatabase,
} from '@/hooks/useCourses';
import { useSemesterStore } from '@/stores/useSemesterStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Upload as UploadIcon,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Archive,
  Pencil,
  Minus,
  CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyllabusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  userId: string;
}

type ModalStep = 'upload' | 'processing' | 'diff' | 'applying' | 'done';

const VALID_ASSIGNMENT_TYPES = new Set([
  'exam','quiz','homework','project','paper','lab',
  'discussion','participation','presentation','midterm','final','other',
]);

function sanitizeType(t: string): AssignmentType {
  return VALID_ASSIGNMENT_TYPES.has(t) ? (t as AssignmentType) : 'other';
}

// ─── Diff Row ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  new:       { label: 'New',     badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: Plus,       row: 'border-l-4 border-emerald-400/60' },
  updated:   { label: 'Changed', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',       icon: Pencil,     row: 'border-l-4 border-amber-400/60' },
  removed:   { label: 'Removed', badge: 'bg-red-500/15 text-red-600 dark:text-red-400',             icon: Minus,      row: 'border-l-4 border-red-400/60' },
  unchanged: { label: '',        badge: '',                                                           icon: CheckCircle2, row: '' },
} as const;

function DiffRow({ item }: { item: AssignmentDiff }) {
  const meta = STATUS_META[item.status];
  const Icon = meta.icon;

  const name = item.incoming?.name ?? item.existing?.name ?? '';
  const weight = item.incoming?.weight ?? item.existing?.weight ?? 0;
  const type = item.incoming?.type ?? item.existing?.type ?? '';

  if (item.status === 'unchanged') {
    return (
      <div className="flex items-center justify-between py-2 px-3 text-muted-foreground/60 text-sm">
        <span>{name}</span>
        <span className="tabular-nums">{weight}%</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start justify-between py-2.5 px-3 rounded-lg mb-1', meta.row, 'bg-card/60')}>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">{name}</span>
            {meta.label && (
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', meta.badge)}>
                {item.willArchive ? 'Archived' : meta.label}
              </span>
            )}
          </div>

          {/* Field-level change details */}
          {item.status === 'updated' && item.changes && (
            <div className="mt-1 space-y-0.5">
              {item.changes.weight && (
                <p className="text-xs text-muted-foreground">
                  Weight: <span className="line-through text-red-500/70">{item.existing?.weight}%</span>{' '}
                  → <span className="text-emerald-500">{item.incoming?.weight}%</span>
                </p>
              )}
              {item.changes.name && (
                <p className="text-xs text-muted-foreground">
                  Name: <span className="line-through text-red-500/70">{item.existing?.name}</span>{' '}
                  → <span className="text-emerald-500">{item.incoming?.name}</span>
                </p>
              )}
              {item.changes.type && (
                <p className="text-xs text-muted-foreground">
                  Type: <span className="line-through text-red-500/70">{item.existing?.type}</span>{' '}
                  → <span className="text-emerald-500">{item.incoming?.type}</span>
                </p>
              )}
              {item.changes.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Due date changed
                </p>
              )}
            </div>
          )}

          {item.status === 'removed' && item.willArchive && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <Archive className="w-3 h-3 inline mr-1" />
              Grade ({item.existing?.score}%) preserved in archived history
            </p>
          )}

          {item.status === 'removed' && !item.willArchive && (
            <p className="text-xs text-muted-foreground mt-0.5">No grade recorded — will be deleted</p>
          )}
        </div>
      </div>

      <span className="text-sm tabular-nums ml-3 flex-shrink-0 text-muted-foreground">
        {weight}%
      </span>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SyllabusUpdateModal({
  open,
  onOpenChange,
  course,
  userId,
}: SyllabusUpdateModalProps) {
  const { updateAssignment, addAssignment, deleteAssignment } = useSemesterStore();

  const [step, setStep] = useState<ModalStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [diff, setDiff] = useState<SyllabusDiff | null>(null);
  const [incomingAssignments, setIncomingAssignments] = useState<Assignment[]>([]);

  // ─── File parsing ───

  async function extractBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = (e.target?.result as string).split(',')[1];
        res(b64);
      };
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  const handleFile = useCallback(async (file: File) => {
    const isPdf = file.type === 'application/pdf';
    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');
    if (!isPdf && !isTxt) {
      toast.error('Invalid file', { description: 'Please upload a PDF or .txt file.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', { description: 'Max file size is 10 MB.' });
      return;
    }

    setStep('processing');
    try {
      const body = isPdf
        ? { pdfBase64: await extractBase64(file), fileName: file.name }
        : { syllabusText: await file.text() };

      const { data, error, response } = await supabase.functions.invoke('parse-syllabus', { body });

      if (error) {
        let msg = error.message || 'Failed to parse syllabus';
        if (response) {
          try { const j = await response.clone().json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
        }
        throw new Error(msg);
      }

      if (!data?.success || !data?.data) throw new Error(data?.error || 'Parse failed');

      const parsed = data.data;
      const newAssignments: Assignment[] = (parsed.assignments ?? []).map(
        (a: Record<string, unknown>) => ({
          id: crypto.randomUUID(),
          name: typeof a.name === 'string' ? a.name : '',
          type: sanitizeType(typeof a.type === 'string' ? a.type : 'other'),
          weight: typeof a.weight === 'number' ? a.weight : 0,
          dueDate: typeof a.dueDate === 'string' ? a.dueDate : '',
          description: typeof a.description === 'string' ? a.description : '',
          score: null,
        }),
      );

      setIncomingAssignments(newAssignments);
      setDiff(computeSyllabusDiff(course.assignments, newAssignments));
      setStep('diff');
    } catch (err) {
      toast.error('Parse error', { description: (err as Error).message });
      setStep('upload');
    }
  }, [course.assignments]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ─── Apply diff ───

  async function applyDiff() {
    if (!diff) return;
    setStep('applying');

    let added = 0, updated = 0, archived = 0, deleted = 0;
    const errors: string[] = [];

    for (const item of diff.items) {
      try {
        if (item.status === 'new' && item.incoming) {
          const { assignmentId, error } = await addAssignmentToDatabase(userId, course.id, {
            name: item.incoming.name,
            type: item.incoming.type,
            weight: item.incoming.weight,
            due_date: item.incoming.dueDate || null,
            description: item.incoming.description || null,
          });
          if (error || !assignmentId) throw error ?? new Error('Insert failed');
          addAssignment(course.id, { ...item.incoming, id: assignmentId, score: null });
          added++;

        } else if (item.status === 'updated' && item.existing && item.incoming) {
          // Never overwrite existing grade — only update metadata fields
          const { error } = await updateAssignmentInDatabase(item.existing.id, {
            name: item.incoming.name,
            type: item.incoming.type,
            weight: item.incoming.weight,
            due_date: item.incoming.dueDate || null,
            description: item.incoming.description || null,
          });
          if (error) throw error;
          updateAssignment(course.id, item.existing.id, {
            name: item.incoming.name,
            type: item.incoming.type,
            weight: item.incoming.weight,
            dueDate: item.incoming.dueDate || undefined,
            description: item.incoming.description || undefined,
          });
          updated++;

        } else if (item.status === 'removed' && item.existing) {
          if (item.willArchive) {
            const { error } = await archiveAssignmentInDatabase(item.existing.id);
            if (error) throw error;
            updateAssignment(course.id, item.existing.id, { archived: true });
            archived++;
          } else {
            const { error } = await deleteAssignmentFromDatabase(item.existing.id);
            if (error) throw error;
            deleteAssignment(course.id, item.existing.id);
            deleted++;
          }
        }
      } catch (err) {
        errors.push((err as Error).message);
      }
    }

    if (errors.length > 0) {
      toast.error('Some changes failed', { description: errors.slice(0, 2).join('; ') });
    } else {
      const parts: string[] = [];
      if (added)   parts.push(`${added} added`);
      if (updated) parts.push(`${updated} updated`);
      if (archived) parts.push(`${archived} archived`);
      if (deleted) parts.push(`${deleted} removed`);
      toast.success('Syllabus updated', {
        description: parts.length > 0 ? parts.join(', ') : 'No changes were needed.',
      });
    }

    setStep('done');
    setTimeout(() => {
      onOpenChange(false);
      resetModal();
    }, 1200);
  }

  function resetModal() {
    setStep('upload');
    setDiff(null);
    setIncomingAssignments([]);
    setIsDragging(false);
  }

  function handleClose(open: boolean) {
    if (!open) resetModal();
    onOpenChange(open);
  }

  // ─── Render ───

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col glass-widget">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Update Syllabus — {course.code}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

          {/* ── Upload step ── */}
          {step === 'upload' && (
            <div className="p-2">
              <p className="text-sm text-muted-foreground mb-4">
                Upload a revised syllabus. Existing grades are <strong>never</strong> overwritten.
              </p>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload updated syllabus — click or drag and drop"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('su-file-input')?.click(); } }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('su-file-input')?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                  isDragging ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/30',
                )}
              >
                <UploadIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-medium text-foreground">Drop your PDF or text file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                <input
                  id="su-file-input"
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>
            </div>
          )}

          {/* ── Processing step ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Parsing syllabus with AI…</p>
            </div>
          )}

          {/* ── Diff step ── */}
          {step === 'diff' && diff && (
            <div className="p-2">
              {/* Summary counts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'New',      count: diff.counts.new,       cls: 'text-emerald-500' },
                  { label: 'Changed',  count: diff.counts.updated,   cls: 'text-amber-500' },
                  { label: 'Removed',  count: diff.counts.removed,   cls: 'text-red-500' },
                  { label: 'Same',     count: diff.counts.unchanged, cls: 'text-muted-foreground' },
                ].map((s) => (
                  <div key={s.label} className="glass-widget p-3 text-center rounded-xl">
                    <p className={cn('text-2xl font-light', s.cls)}>{s.count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Notice when nothing changed */}
              {diff.counts.new === 0 && diff.counts.updated === 0 && diff.counts.removed === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  ✓ No changes detected — the syllabus matches your current assignments.
                </p>
              )}

              {/* Diff items */}
              <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                {diff.items.map((item, i) => (
                  <DiffRow key={i} item={item} />
                ))}
              </div>

              {diff.counts.removed > 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                  <Archive className="w-3 h-3" />
                  Graded items marked for removal will be archived, not deleted.
                </p>
              )}
            </div>
          )}

          {/* ── Applying ── */}
          {step === 'applying' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Applying changes…</p>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-foreground font-medium">Syllabus updated!</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {step === 'diff' && diff && (
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep('upload')}>
              <UploadIcon className="w-3.5 h-3.5 mr-1.5" />
              Try different file
            </Button>
            <Button
              onClick={applyDiff}
              disabled={diff.counts.new === 0 && diff.counts.updated === 0 && diff.counts.removed === 0}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Confirm Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
