// User Profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  university?: string;
  major?: string;
  graduationYear?: number;
  gpaGoal: number;
  avatar?: string;
}

// Semester
export interface Semester {
  id: string;
  name: string; // "Spring 2025"
  type: 'fall' | 'spring' | 'summer' | 'winter';
  year: number;
  isActive: boolean;
}

// Instructor
export interface Instructor {
  name: string;
  email?: string;
  officeHours?: string;
  office?: string;
  phone?: string;
  preferredContact?: string;
  responseTime?: string;
}

// Teaching Assistant
export interface TeachingAssistant {
  name?: string;
  email?: string;
  office?: string;
  officeHours?: string;
}

// Schedule
export interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
  location?: string;
}

// Final Exam
export interface FinalExam {
  date?: string;
  time?: string;
  location?: string;
}

// Textbook
export interface Textbook {
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  required: boolean;
  note?: string;
}

// Software Requirement
export interface SoftwareRequirement {
  name: string;
  required: boolean;
  cost?: string;
  downloadUrl?: string;
}

// Access Code
export interface AccessCode {
  name: string;
  required: boolean;
  cost?: string;
  code?: string;
}

// Course Materials
export interface CourseMaterials {
  textbooks?: Textbook[];
  software?: SoftwareRequirement[];
  accessCodes?: AccessCode[];
  hardware?: string[];
  other?: string[];
}

// Prerequisites
export interface Prerequisites {
  required?: string[];
  corequisites?: string[];
  recommended?: string[];
}

// Grading Category
export interface GradingCategory {
  name: string;
  weight: number;
  dropLowest?: number;
  description?: string;
  count?: number;
}

// Course Module
export interface CourseModule {
  number: number;
  title: string;
  topics?: string[];
  readings?: string[];
  assignments?: string[];
}

// Course Policies
export interface CoursePolicies {
  lateWork?: {
    accepted: boolean;
    penalty?: string;
    details?: string;
    projectPolicy?: string;
  };
  attendance?: {
    required: boolean;
    impactsGrade?: boolean;
    details?: string;
  };
  makeupExams?: {
    allowed: boolean;
    conditions?: string;
  };
  dropPolicy?: {
    exists: boolean;
    details?: string;
  };
  curvePolicy?: {
    exists: boolean;
    details?: string;
  };
  extraCredit?: {
    available: boolean;
    details?: string;
  };
  mustPass?: {
    exists: boolean;
    requirement?: string;
  };
  participation?: {
    required: boolean;
    details?: string;
  };
}

// AI Policy
export interface AIPolicy {
  type?: string;
  permitted: boolean;
  restrictions?: string;
  citationRequired?: boolean;
  citationFormat?: string;
  details?: string;
}

// Academic Integrity
export interface AcademicIntegrity {
  summary?: string;
  plagiarismPolicy?: string;
  collaborationPolicy?: string;
}

// Important Dates
export interface ImportantDates {
  firstDay?: string;
  lastDay?: string;
  lastDayToDrop?: string;
  withdrawalDeadline?: string;
  springBreak?: string;
  holidays?: string[];
  finalExamDate?: string;
}

// Support Resources
export interface SupportResources {
  tutoring?: string;
  writing?: string;
  counseling?: string;
  disability?: string;
  techSupport?: string;
  other?: string[];
}

// Communication Preferences
export interface CommunicationPreferences {
  primaryMethod?: string;
  announcementFrequency?: string;
  discussionPlatform?: string;
  videoConference?: string;
}

// Assignment Types
export type AssignmentType = 
  | 'exam' 
  | 'quiz' 
  | 'homework' 
  | 'project' 
  | 'paper' 
  | 'lab'
  | 'discussion' 
  | 'participation'
  | 'presentation'
  | 'midterm'
  | 'final'
  | 'other';

// Assignment
export interface Assignment {
  id: string;
  name: string;
  type: AssignmentType;
  weight: number;
  dueDate?: string;
  description?: string;
  score: number | null; // null = not graded
  /** Assignments removed from a syllabus update that had grades — preserved but excluded from grade calc */
  archived?: boolean;
}

// Course
export interface Course {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  color: string;
  section?: string;
  crn?: string;
  institution?: string;
  deliveryMode?: string;
  description?: string;
  instructor?: Instructor;
  teachingAssistant?: TeachingAssistant;
  schedule?: Schedule;
  finalExam?: FinalExam;
  gradingScale?: Record<string, number>;
  materials?: CourseMaterials;
  prerequisites?: Prerequisites;
  gradingCategories?: GradingCategory[];
  modules?: CourseModule[];
  policies?: CoursePolicies;
  aiPolicy?: AIPolicy;
  academicIntegrity?: AcademicIntegrity;
  importantDates?: ImportantDates;
  learningObjectives?: string[];
  supportResources?: SupportResources;
  communication?: CommunicationPreferences;
  assignments: Assignment[];
  createdAt: string;
}

// Default grading scale
export const DEFAULT_GRADING_SCALE: Record<string, number> = {
  'A': 93,
  'A-': 90,
  'B+': 87,
  'B': 83,
  'B-': 80,
  'C+': 77,
  'C': 73,
  'C-': 70,
  'D': 60,
  'F': 0,
};

// Habit
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
  streak: number;
  lastCompleted: string | null;
}

// Focus Session
export interface FocusSession {
  date: string;
  duration: number;
  course?: string;
}

// Achievement
export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

// Goals Data
export interface GoalsData {
  habits: Habit[];
  completionHistory: Record<string, string[]>; // date -> completed habit IDs
  focusSessions: FocusSession[];
  totalFocusMinutes: number;
  achievements: Achievement[];
  studyStreak: number;
  lastStudyDate: string | null;
}

// AI Parsed Syllabus (now matching the comprehensive parse-syllabus output)
export interface ParsedSyllabus {
  course: {
    code: string;
    name: string;
    section?: string;
    crn?: string;
    credits: number;
    semester?: string;
    institution?: string;
    deliveryMode?: string;
    description?: string;
  };
  instructor: Instructor;
  teachingAssistant?: TeachingAssistant;
  schedule: {
    meetings?: Array<{
      day: string;
      startTime: string;
      endTime: string;
      location?: string;
      type?: string;
    }>;
    finalExam?: FinalExam;
  };
  materials?: CourseMaterials;
  prerequisites?: Prerequisites;
  gradingScale?: Record<string, { min: number; max: number }>;
  gradingCategories?: GradingCategory[];
  assignments: Assignment[];
  modules?: CourseModule[];
  policies?: CoursePolicies;
  aiPolicy?: AIPolicy;
  academicIntegrity?: AcademicIntegrity;
  importantDates?: ImportantDates;
  learningObjectives?: string[];
  supportResources?: SupportResources;
  communication?: CommunicationPreferences;
}

// Course color presets
export const COURSE_COLORS = [
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
] as const;
