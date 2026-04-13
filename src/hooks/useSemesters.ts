import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSemesterStore } from '@/stores/useSemesterStore';
import type { Semester } from '@/types';

function buildDefaultRows(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const isCurrent = (type: string, y: number) => {
    if (y !== year) return false;
    if (type === 'spring') return month >= 0 && month <= 4;
    if (type === 'summer') return month >= 5 && month <= 6;
    if (type === 'fall')   return month >= 7 && month <= 11;
    return false;
  };

  return [
    { user_id: userId, name: `Fall ${year - 1}`,   type: 'fall',   year: year - 1, is_active: false },
    { user_id: userId, name: `Spring ${year}`,      type: 'spring', year,           is_active: isCurrent('spring', year) },
    { user_id: userId, name: `Summer ${year}`,      type: 'summer', year,           is_active: isCurrent('summer', year) },
    { user_id: userId, name: `Fall ${year}`,        type: 'fall',   year,           is_active: isCurrent('fall',   year) },
    { user_id: userId, name: `Spring ${year + 1}`,  type: 'spring', year: year + 1, is_active: false },
  ];
}

export function useSemesters() {
  const { user } = useAuth();
  const setSemesters    = useSemesterStore((s) => s.setSemesters);
  const setActiveSemester = useSemesterStore((s) => s.setActiveSemester);

  useEffect(() => {
    if (!user) return;

    async function sync() {
      // Fetch existing semesters for this user
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: true });

      if (error) {
        console.error('Error fetching semesters:', error);
        return;
      }

      let rows = data ?? [];

      // First-time user: create default semesters in the DB
      if (rows.length === 0) {
        const defaults = buildDefaultRows(user.id);
        const { data: inserted, error: insertError } = await supabase
          .from('semesters')
          .insert(defaults)
          .select('*');

        if (insertError || !inserted) {
          console.error('Error creating default semesters:', insertError);
          return;
        }
        rows = inserted;
      }

      // Map DB rows (with real UUIDs) into the store's Semester shape
      const semesters: Semester[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type as Semester['type'],
        year: r.year,
        isActive: r.is_active ?? false,
      }));

      setSemesters(semesters);

      // Pick the active semester: DB-flagged active → current date match → middle of list
      const active =
        semesters.find((s) => s.isActive) ??
        semesters[Math.floor(semesters.length / 2)] ??
        semesters[0];

      if (active) setActiveSemester(active.id);
    }

    sync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}
