import { create } from 'zustand';
import type { GoalsData, Habit, FocusSession, Achievement } from '@/types';
import { format } from 'date-fns';

interface GoalsStore {
  goalsData: GoalsData;
  toggleHabit: (habitId: string) => void;
  addHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  addFocusSession: (session: FocusSession) => void;
  unlockAchievement: (achievementId: string) => void;
  resetDailyHabits: () => void;

  /** Bulk-load goals data from the database (replaces current state). */
  loadGoalsData: (data: GoalsData) => void;

  /** Reset to defaults – called on logout to prevent cross-account data bleed. */
  reset: () => void;
}

const defaultHabits: Habit[] = [
  { id: '1', name: 'Review lecture notes', emoji: '📝', completed: false, streak: 7, lastCompleted: null },
  { id: '2', name: 'Practice problems (30 min)', emoji: '🧮', completed: false, streak: 5, lastCompleted: null },
  { id: '3', name: 'Read textbook chapter', emoji: '📚', completed: false, streak: 3, lastCompleted: null },
  { id: '4', name: 'Update study planner', emoji: '📅', completed: false, streak: 12, lastCompleted: null },
];

const defaultAchievements: Achievement[] = [
  { id: '1', emoji: '🎯', name: 'Goal Setter', description: 'Set your first GPA goal', unlocked: true },
  { id: '2', emoji: '🔥', name: 'Week Warrior', description: '7-day study streak', unlocked: false, progress: 0, target: 7 },
  { id: '3', emoji: '📚', name: 'Bookworm', description: 'Complete 50 assignments', unlocked: false, progress: 0, target: 50 },
  { id: '4', emoji: '⭐', name: 'Honor Roll', description: 'Achieve 3.5+ GPA', unlocked: false, progress: 0, target: 3.5 },
  { id: '5', emoji: '🏆', name: "Dean's List", description: 'Achieve 3.8+ GPA', unlocked: false, progress: 0, target: 3.8 },
  { id: '6', emoji: '💎', name: 'Perfect Score', description: 'Get 100% on an exam', unlocked: false, progress: 0, target: 100 },
];

export const defaultGoalsData: GoalsData = {
  habits: defaultHabits,
  completionHistory: {},
  focusSessions: [],
  totalFocusMinutes: 0,
  achievements: defaultAchievements,
  studyStreak: 0,
  lastStudyDate: null,
};

export const useGoalsStore = create<GoalsStore>()((set) => ({
  goalsData: defaultGoalsData,

  toggleHabit: (habitId) =>
    set((state) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const updatedHabits = state.goalsData.habits.map((h) => {
        if (h.id !== habitId) return h;

        const wasCompleted = h.completed;
        const newCompleted = !wasCompleted;

        let newStreak = h.streak;
        if (newCompleted) {
          newStreak = h.streak + 1;
        } else if (wasCompleted) {
          newStreak = Math.max(0, h.streak - 1);
        }

        return {
          ...h,
          completed: newCompleted,
          streak: newStreak,
          lastCompleted: newCompleted ? today : h.lastCompleted,
        };
      });

      const completedIds = updatedHabits.filter((h) => h.completed).map((h) => h.id);
      const updatedHistory = {
        ...state.goalsData.completionHistory,
        [today]: completedIds,
      };

      return {
        goalsData: {
          ...state.goalsData,
          habits: updatedHabits,
          completionHistory: updatedHistory,
        },
      };
    }),

  addHabit: (habit) =>
    set((state) => ({
      goalsData: {
        ...state.goalsData,
        habits: [...state.goalsData.habits, habit],
      },
    })),

  deleteHabit: (habitId) =>
    set((state) => ({
      goalsData: {
        ...state.goalsData,
        habits: state.goalsData.habits.filter((h) => h.id !== habitId),
      },
    })),

  addFocusSession: (session) =>
    set((state) => ({
      goalsData: {
        ...state.goalsData,
        focusSessions: [...state.goalsData.focusSessions, session],
        totalFocusMinutes: state.goalsData.totalFocusMinutes + session.duration,
        lastStudyDate: session.date,
        studyStreak: state.goalsData.studyStreak + 1,
      },
    })),

  unlockAchievement: (achievementId) =>
    set((state) => ({
      goalsData: {
        ...state.goalsData,
        achievements: state.goalsData.achievements.map((a) =>
          a.id === achievementId
            ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
            : a,
        ),
      },
    })),

  resetDailyHabits: () =>
    set((state) => ({
      goalsData: {
        ...state.goalsData,
        habits: state.goalsData.habits.map((h) => ({
          ...h,
          completed: false,
        })),
      },
    })),

  loadGoalsData: (data) =>
    set(() => ({
      goalsData: data,
    })),

  reset: () =>
    set(() => ({
      goalsData: defaultGoalsData,
    })),
}));
