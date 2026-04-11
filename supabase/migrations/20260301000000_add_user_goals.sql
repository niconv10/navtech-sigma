-- user_goals: one row per authenticated user, persisting all Goals page state.
-- Stored as JSONB blobs to match the in-memory shape without normalisation overhead.
-- On conflict (user_id unique) the row is upserted so client-side logic is simple.

CREATE TABLE IF NOT EXISTS public.user_goals (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  habits              jsonb       NOT NULL DEFAULT '[]',
  completion_history  jsonb       NOT NULL DEFAULT '{}',
  focus_sessions      jsonb       NOT NULL DEFAULT '[]',
  total_focus_minutes integer     NOT NULL DEFAULT 0,
  achievements        jsonb       NOT NULL DEFAULT '[]',
  study_streak        integer     NOT NULL DEFAULT 0,
  last_study_date     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own row
CREATE POLICY "Users can manage their own goals"
  ON public.user_goals
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast user lookup (already implied by UNIQUE, but explicit for clarity)
CREATE INDEX IF NOT EXISTS user_goals_user_id_idx
  ON public.user_goals (user_id);
