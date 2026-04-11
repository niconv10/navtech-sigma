-- Add `archived` column to assignments.
-- Assignments are archived (rather than deleted) when a syllabus re-upload
-- removes an assignment that already has a grade entered, so that the student's
-- grade data is never lost.

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Index for efficient filtering of non-archived assignments
CREATE INDEX IF NOT EXISTS assignments_archived_idx
  ON public.assignments (course_id, archived);
