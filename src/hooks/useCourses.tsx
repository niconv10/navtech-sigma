import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useSemesterStore } from '@/stores/useSemesterStore';
import { useAuth } from '@/hooks/useAuth';
import type { Course, Assignment } from '@/types';
import { getCurrentSemesterId } from '@/lib/utils';
import { LEGACY_DEFAULT_COURSE_COLOR } from '@/lib/courseColors';
import { toast } from 'sonner';

// Normalize grading scale: handles both {grade: number} and {grade: {min, max}} formats
export function normalizeGradingScale(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number') {
      result[key] = value;
    } else if (value && typeof value === 'object' && 'min' in value) {
      result[key] = Number((value as Record<string, unknown>).min) || 0;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

// Hook to sync courses from database to Zustand store
export function useCourses() {
  const { user } = useAuth();
  // Do not include `courses` in this hook's local state — read it from the
  // store directly inside the callback to avoid a stale-closure / infinite-
  // re-render cycle (courses changes → new fetchCourses → effect re-runs).
  const { addCourse, reset } = useSemesterStore();

  // Fetch courses and assignments from database
  const fetchCourses = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch courses
      const { data: dbCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
      }

      // Read current store state directly to avoid `courses` in dep array
      const currentCourses = useSemesterStore.getState().courses;

      if (!dbCourses || dbCourses.length === 0) {
        // No courses in the database yet — clear any persisted/demo courses
        if (currentCourses.length > 0) reset();
        return;
      }

      // Fetch all assignments for these courses
      const courseIds = dbCourses.map(c => c.id);
      const { data: dbAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }


      // Map database courses to app Course type
      const mappedCourses: Course[] = dbCourses.map(dbCourse => {
        const courseAssignments: Assignment[] = (dbAssignments || [])
          .filter(a => a.course_id === dbCourse.id)
          .map(a => ({
            id: a.id,
            name: a.name,
            type: a.type as Assignment['type'],
            weight: Number(a.weight),
            dueDate: a.due_date || undefined,
            description: a.description || undefined,
            score: a.score !== null ? Number(a.score) : null,
            archived: (a as { archived?: boolean }).archived ?? false,
          }));

        return {
          id: dbCourse.id,
          semesterId: dbCourse.semester_id || getCurrentSemesterId(),
          code: dbCourse.code,
          name: dbCourse.name,
          credits: dbCourse.credits || 3,
          color: dbCourse.color || LEGACY_DEFAULT_COURSE_COLOR,
          section: dbCourse.section || undefined,
          crn: dbCourse.crn || undefined,
          institution: dbCourse.institution || undefined,
          deliveryMode: dbCourse.delivery_mode || undefined,
          description: dbCourse.description || undefined,
          instructor: dbCourse.instructor as unknown as Course['instructor'],
          teachingAssistant: dbCourse.teaching_assistant as unknown as Course['teachingAssistant'],
          schedule: dbCourse.schedule as unknown as Course['schedule'],
          finalExam: dbCourse.final_exam as unknown as Course['finalExam'],
          gradingScale: normalizeGradingScale(dbCourse.grading_scale),
          materials: dbCourse.materials as unknown as Course['materials'],
          prerequisites: dbCourse.prerequisites as unknown as Course['prerequisites'],
          gradingCategories: dbCourse.grading_categories as unknown as Course['gradingCategories'],
          modules: dbCourse.modules as unknown as Course['modules'],
          policies: dbCourse.policies as unknown as Course['policies'],
          aiPolicy: dbCourse.ai_policy as unknown as Course['aiPolicy'],
          academicIntegrity: dbCourse.academic_integrity as unknown as Course['academicIntegrity'],
          importantDates: dbCourse.important_dates as unknown as Course['importantDates'],
          learningObjectives: dbCourse.learning_objectives as unknown as Course['learningObjectives'],
          supportResources: dbCourse.support_resources as unknown as Course['supportResources'],
          communication: dbCourse.communication as unknown as Course['communication'],
          assignments: courseAssignments,
          createdAt: dbCourse.created_at || new Date().toISOString(),
        };
      });

      // Keep store in sync even when course IDs don't change (new columns may appear)
      const signature = (list: Course[]) =>
        list
          .map((c) => {
            const materialsSig = Array.isArray(c.materials)
              ? `arr:${c.materials.length}`
              : c.materials && typeof c.materials === 'object'
                ? `obj:${Object.keys(c.materials as Record<string, unknown>).length}`
                : 'none';
            const policiesSig = c.policies && typeof c.policies === 'object'
              ? `pol:${Object.keys(c.policies as Record<string, unknown>).length}`
              : 'pol:none';
            return `${c.id}:${materialsSig}:${policiesSig}:${c.assignments.length}`;
          })
          .sort()
          .join('|');

      const existingSig = signature(currentCourses);
      const nextSig = signature(mappedCourses);

      if (existingSig !== nextSig) {
        reset();
        mappedCourses.forEach((course) => addCourse(course));
      }
    } catch (err) {
      console.error('Error in fetchCourses:', err);
    }
  }, [user, addCourse, reset]);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user?.id, fetchCourses]);

  return { refetch: fetchCourses };
}

// Extended course data for saving
export interface ExtendedCourseData {
  code: string;
  name: string;
  credits: number;
  color: string;
  semesterId: string | null;
  section?: string;
  crn?: string;
  institution?: string;
  deliveryMode?: string;
  description?: string;
  instructor?: Course['instructor'];
  teachingAssistant?: Course['teachingAssistant'];
  schedule?: Course['schedule'];
  finalExam?: Course['finalExam'];
  gradingScale?: Course['gradingScale'];
  materials?: Course['materials'];
  prerequisites?: Course['prerequisites'];
  gradingCategories?: Course['gradingCategories'];
  modules?: Course['modules'];
  policies?: Course['policies'];
  aiPolicy?: Course['aiPolicy'];
  academicIntegrity?: Course['academicIntegrity'];
  importantDates?: Course['importantDates'];
  learningObjectives?: Course['learningObjectives'];
  supportResources?: Course['supportResources'];
  communication?: Course['communication'];
}

// Save a course to the database
export async function saveCourseToDatabase(
  userId: string,
  courseData: ExtendedCourseData,
  assignments: Assignment[]
): Promise<{ courseId: string | null; error: Error | null }> {
  try {
    // Insert course with all extended fields
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        code: courseData.code,
        name: courseData.name,
        credits: courseData.credits,
        color: courseData.color,
        semester_id: null,
        section: courseData.section || null,
        crn: courseData.crn || null,
        institution: courseData.institution || null,
        delivery_mode: courseData.deliveryMode || null,
        description: courseData.description || null,
        instructor: (courseData.instructor ?? null) as unknown as Json,
        teaching_assistant: (courseData.teachingAssistant ?? null) as unknown as Json,
        schedule: (courseData.schedule ?? null) as unknown as Json,
        final_exam: (courseData.finalExam ?? null) as unknown as Json,
        grading_scale: (courseData.gradingScale ?? null) as unknown as Json,
        materials: Array.isArray(courseData.materials) && courseData.materials.every((m) => typeof m === 'string')
          ? (courseData.materials as string[])
          : null,
        materials_data: courseData.materials && (!Array.isArray(courseData.materials) || !courseData.materials.every((m) => typeof m === 'string'))
          ? (courseData.materials as unknown as Json)
          : null,
        prerequisites: (courseData.prerequisites ?? null) as unknown as Json,
        grading_categories: (courseData.gradingCategories ?? null) as unknown as Json,
        modules: (courseData.modules ?? null) as unknown as Json,
        policies: (courseData.policies ?? null) as unknown as Json,
        ai_policy: (courseData.aiPolicy ?? null) as unknown as Json,
        academic_integrity: (courseData.academicIntegrity ?? null) as unknown as Json,
        important_dates: (courseData.importantDates ?? null) as unknown as Json,
        learning_objectives: courseData.learningObjectives ?? null,
        support_resources: (courseData.supportResources ?? null) as unknown as Json,
        communication: (courseData.communication ?? null) as unknown as Json,
      })
      .select('id')
      .single();

    if (courseError) {
      console.error('Error inserting course:', courseError);
      return { courseId: null, error: courseError };
    }

    // Insert assignments if any
    if (assignments.length > 0) {
      const assignmentsToInsert = assignments.map(a => ({
        user_id: userId,
        course_id: course.id,
        name: a.name,
        type: a.type,
        weight: a.weight,
        due_date: a.dueDate || null,
        description: a.description || null,
        score: a.score,
      }));

      const { error: assignmentsError } = await supabase
        .from('assignments')
        .insert(assignmentsToInsert);

      if (assignmentsError) {
        console.error('Error inserting assignments:', assignmentsError);
        // Course was created, just log the error
      }
    }

    return { courseId: course.id, error: null };
  } catch (err) {
    console.error('Error saving course:', err);
    return { courseId: null, error: err as Error };
  }
}

// Delete a course from the database
export async function deleteCourseFromDatabase(
  courseId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Delete assignments first (cascade should handle this, but be explicit)
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .delete()
      .eq('course_id', courseId);

    if (assignmentsError) {
      console.error('Error deleting assignments:', assignmentsError);
    }

    // Delete the course
    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (courseError) {
      console.error('Error deleting course:', courseError);
      return { success: false, error: courseError };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting course:', err);
    return { success: false, error: err as Error };
  }
}

// Update a course's color in the database
export async function updateCourseColor(
  courseId: string,
  color: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ color })
      .eq('id', courseId);

    if (error) {
      console.error('Error updating course color:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating course color:', err);
    return { success: false, error: err as Error };
  }
}

// Update an assignment's due date in the database
export async function updateAssignmentDueDate(
  assignmentId: string,
  dueDate: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('assignments')
      .update({ due_date: dueDate })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment due date:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating assignment due date:', err);
    return { success: false, error: err as Error };
  }
}

// Update an assignment in the database
export async function updateAssignmentInDatabase(
  assignmentId: string,
  updates: {
    name?: string;
    type?: string;
    weight?: number;
    due_date?: string | null;
    description?: string | null;
    score?: number | null;
  }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating assignment:', err);
    return { success: false, error: err as Error };
  }
}

// Delete an assignment from the database
export async function deleteAssignmentFromDatabase(
  assignmentId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting assignment:', err);
    return { success: false, error: err as Error };
  }
}

// Add an assignment to the database
export async function addAssignmentToDatabase(
  userId: string,
  courseId: string,
  assignment: {
    name: string;
    type: string;
    weight: number;
    due_date?: string | null;
    description?: string | null;
    score?: number | null;
  }
): Promise<{ assignmentId: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        user_id: userId,
        course_id: courseId,
        name: assignment.name,
        type: assignment.type,
        weight: assignment.weight,
        due_date: assignment.due_date || null,
        description: assignment.description || null,
        score: assignment.score ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding assignment:', error);
      return { assignmentId: null, error };
    }

    return { assignmentId: data.id, error: null };
  } catch (err) {
    console.error('Error adding assignment:', err);
    return { assignmentId: null, error: err as Error };
  }
}

/**
 * Mark an assignment as archived in the database.
 * Used by the syllabus update flow to preserve graded assignments that have
 * been removed from the new syllabus without losing the grade data.
 */
export async function archiveAssignmentInDatabase(
  assignmentId: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('assignments')
      .update({ archived: true })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error archiving assignment:', error);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error('Error archiving assignment:', err);
    return { success: false, error: err as Error };
  }
}
