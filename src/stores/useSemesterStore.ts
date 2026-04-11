import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Semester, Course, Assignment } from '@/types';

// Version to detect and migrate away from any previously persisted demo/mock data
const STORE_VERSION = 4;

interface SemesterStore {
  _version?: number;
  semesters: Semester[];
  activeSemesterId: string | null;
  courses: Course[];

  // Semester actions
  addSemester: (semester: Semester) => void;
  setActiveSemester: (id: string) => void;
  
  // Course actions
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  
  // Assignment actions
  updateAssignmentScore: (courseId: string, assignmentId: string, score: number | null) => void;
  addAssignment: (courseId: string, assignment: Assignment) => void;
  deleteAssignment: (courseId: string, assignmentId: string) => void;
  updateAssignment: (courseId: string, assignmentId: string, updates: Partial<Assignment>) => void;
  
  // Helpers
  getActiveCourses: () => Course[];
  getCourseById: (id: string) => Course | undefined;

  // Security: prevent cross-account mixing on shared devices
  reset: () => void;
}

// Default semesters
const defaultSemesters: Semester[] = [
  {
    id: 'spring-2025',
    name: 'Spring 2025',
    type: 'spring',
    year: 2025,
    isActive: false,
  },
  {
    id: 'fall-2025',
    name: 'Fall 2025',
    type: 'fall',
    year: 2025,
    isActive: true,
  },
  {
    id: 'spring-2026',
    name: 'Spring 2026',
    type: 'spring',
    year: 2026,
    isActive: false,
  },
  {
    id: 'summer-2026',
    name: 'Summer 2026',
    type: 'summer',
    year: 2026,
    isActive: false,
  },
  {
    id: 'fall-2026',
    name: 'Fall 2026',
    type: 'fall',
    year: 2026,
    isActive: false,
  },
];

export const useSemesterStore = create<SemesterStore>()(
  persist(
    (set, get) => ({
      _version: STORE_VERSION,
      semesters: defaultSemesters,
      activeSemesterId: 'fall-2025',
      courses: [],

      addSemester: (semester) =>
        set((state) => ({
          semesters: [...state.semesters, semester],
        })),

      setActiveSemester: (id) =>
        set((state) => ({
          activeSemesterId: id,
          semesters: state.semesters.map((s) => ({
            ...s,
            isActive: s.id === id,
          })),
        })),

      addCourse: (course) =>
        set((state) => ({
          courses: [...state.courses, course],
        })),

      updateCourse: (id, updates) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
        })),

      updateAssignmentScore: (courseId, assignmentId, score) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  assignments: c.assignments.map((a) =>
                    a.id === assignmentId ? { ...a, score } : a
                  ),
                }
              : c
          ),
        })),

      addAssignment: (courseId, assignment) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === courseId
              ? { ...c, assignments: [...c.assignments, assignment] }
              : c
          ),
        })),

      deleteAssignment: (courseId, assignmentId) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  assignments: c.assignments.filter((a) => a.id !== assignmentId),
                }
              : c
          ),
        })),

      updateAssignment: (courseId, assignmentId, updates) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  assignments: c.assignments.map((a) =>
                    a.id === assignmentId ? { ...a, ...updates } : a
                  ),
                }
              : c
          ),
        })),

      getActiveCourses: () => {
        const state = get();
        return state.courses.filter((c) => c.semesterId === state.activeSemesterId);
      },

      getCourseById: (id) => {
        const state = get();
        return state.courses.find((c) => c.id === id);
      },

      reset: () =>
        set(() => ({
          _version: STORE_VERSION,
          semesters: defaultSemesters,
          activeSemesterId: 'fall-2025',
          courses: [],
        })),
    }),
    {
      name: 'sigma-semester-storage',
      version: STORE_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        // If version is old (or undefined), clear all data to remove mock courses
        if (version < STORE_VERSION) {
          return {
            _version: STORE_VERSION,
            semesters: defaultSemesters,
            activeSemesterId: 'fall-2025',
            courses: [],
          };
        }
        return persistedState as Partial<SemesterStore>;
      },
    }
  )
);
