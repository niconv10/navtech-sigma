/**
 * useGoalsSync
 *
 * Bridges the in-memory `useGoalsStore` with the Supabase `user_goals` table.
 *
 * On first render for a signed-in user:
 *   1. Load the row from DB (if present) and hydrate the store.
 *   2. If no DB row exists but localStorage data is found (from the old
 *      `sigma-goals-storage` key), migrate it, persist to DB, and clear the
 *      localStorage entry.
 *
 * After loading, every change to `goalsData` triggers a debounced (1 s) upsert
 * so the store and DB stay in sync without hammering the API on every keystroke.
 *
 * On logout the store is reset to defaults so a subsequent login sees a clean slate.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoalsStore, defaultGoalsData } from '@/stores/useGoalsStore';
import type { GoalsData } from '@/types';
import type { Json } from '@/integrations/supabase/types';

// ─── DB helpers ────────────────────────────────────────────────────────────

async function loadGoalsFromDB(userId: string): Promise<GoalsData | null> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[useGoalsSync] load error:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    habits:             (data.habits             as GoalsData['habits'])             ?? defaultGoalsData.habits,
    completionHistory:  (data.completion_history as GoalsData['completionHistory']) ?? {},
    focusSessions:      (data.focus_sessions     as GoalsData['focusSessions'])     ?? [],
    totalFocusMinutes:  data.total_focus_minutes ?? 0,
    achievements:       (data.achievements       as GoalsData['achievements'])       ?? defaultGoalsData.achievements,
    studyStreak:        data.study_streak        ?? 0,
    lastStudyDate:      data.last_study_date     ?? null,
  };
}

async function saveGoalsToDB(userId: string, data: GoalsData): Promise<void> {
  const { error } = await supabase
    .from('user_goals')
    .upsert(
      {
        user_id:             userId,
        habits:              data.habits             as unknown as Json,
        completion_history:  data.completionHistory  as unknown as Json,
        focus_sessions:      data.focusSessions      as unknown as Json,
        total_focus_minutes: data.totalFocusMinutes,
        achievements:        data.achievements       as unknown as Json,
        study_streak:        data.studyStreak,
        last_study_date:     data.lastStudyDate,
        updated_at:          new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[useGoalsSync] save error:', error.message);
  }
}

const LEGACY_LS_KEY = 'sigma-goals-storage';

function migrateFromLocalStorage(): GoalsData | null {
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { goalsData?: GoalsData } };
    return parsed?.state?.goalsData ?? null;
  } catch {
    return null;
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useGoalsSync() {
  const { user } = useAuth();
  const { goalsData, loadGoalsData, reset } = useGoalsStore();

  const initialLoadDoneRef = useRef(false);
  const isLoadingRef       = useRef(false);
  const saveTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from DB (or migrate from localStorage) on first sign-in ─────────
  useEffect(() => {
    if (!user) return;
    if (initialLoadDoneRef.current) return;

    initialLoadDoneRef.current = true;
    isLoadingRef.current       = true;

    loadGoalsFromDB(user.id).then((dbData) => {
      if (dbData) {
        // DB row exists — use it
        loadGoalsData(dbData);
        isLoadingRef.current = false;
      } else {
        // No DB row — check for localStorage migration
        const legacy = migrateFromLocalStorage();
        if (legacy) {
          loadGoalsData(legacy);
          // Fire-and-forget: persist migrated data, then clear legacy key
          saveGoalsToDB(user.id, legacy).then(() => {
            localStorage.removeItem(LEGACY_LS_KEY);
          });
        }
        isLoadingRef.current = false;
      }
    });
  }, [user?.id, loadGoalsData]);

  // ── Reset store on logout ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      initialLoadDoneRef.current = false;
      reset();
    }
  }, [user, reset]);

  // ── Debounced save on every goalsData change ──────────────────────────────
  useEffect(() => {
    // Skip if no user, still loading initial data, or load not done yet
    if (!user || isLoadingRef.current || !initialLoadDoneRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveGoalsToDB(user.id, goalsData);
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [goalsData, user?.id]); // user?.id ensures effect re-runs on user switch
}
