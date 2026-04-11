import { 
  GraduationCap, 
  ClipboardList, 
  BookOpen, 
  FileText, 
  FlaskConical, 
  FolderKanban, 
  MessageSquare, 
  Presentation, 
  UserCheck,
  LucideIcon
} from "lucide-react";
import { AssignmentType } from "@/types";

// Category icon mapping
export const CATEGORY_ICONS: Record<AssignmentType, LucideIcon> = {
  exam: GraduationCap,
  quiz: ClipboardList,
  homework: BookOpen,
  paper: FileText,
  lab: FlaskConical,
  project: FolderKanban,
  discussion: MessageSquare,
  participation: UserCheck,
  presentation: Presentation,
  midterm: GraduationCap,
  final: GraduationCap,
  other: FileText,
};

// Category colors for icons (Tailwind classes)
export const CATEGORY_COLORS: Record<string, string> = {
  exam: "bg-red-500",
  quiz: "bg-orange-500",
  homework: "bg-blue-500",
  paper: "bg-purple-500",
  essay: "bg-purple-500",
  lab: "bg-green-500",
  project: "bg-cyan-500",
  discussion: "bg-yellow-500",
  participation: "bg-pink-500",
  other: "bg-gray-500",
};

// Category display names
export const CATEGORY_NAMES: Record<AssignmentType, string> = {
  exam: "Exam",
  quiz: "Quiz",
  homework: "Homework",
  paper: "Essay/Paper",
  lab: "Lab",
  project: "Project",
  discussion: "Discussion",
  participation: "Participation",
  presentation: "Presentation",
  midterm: "Midterm",
  final: "Final",
  other: "Other",
};

// Auto-categorize assignment based on name
export function categorizeAssignment(name: string): AssignmentType {
  const lowerName = name.toLowerCase();
  
  // Check for exam/midterm/final
  if (lowerName.includes("exam") || lowerName.includes("midterm") || lowerName.includes("final")) {
    return "exam";
  }
  
  // Check for quiz
  if (lowerName.includes("quiz")) {
    return "quiz";
  }
  
  // Check for homework
  if (lowerName.includes("homework") || lowerName.includes("hw") || lowerName.includes("problem set") || lowerName.includes("pset")) {
    return "homework";
  }
  
  // Check for essay/paper
  if (lowerName.includes("essay") || lowerName.includes("paper") || lowerName.includes("report") || lowerName.includes("writing")) {
    return "paper";
  }
  
  // Check for lab
  if (lowerName.includes("lab")) {
    return "lab";
  }
  
  // Check for project
  if (lowerName.includes("project")) {
    return "project";
  }
  
  // Check for discussion
  if (lowerName.includes("discussion") || lowerName.includes("forum") || lowerName.includes("post")) {
    return "discussion";
  }
  
  // Check for presentation
  if (lowerName.includes("presentation") || lowerName.includes("present")) {
    return "participation";
  }
  
  // Check for participation
  if (lowerName.includes("participation") || lowerName.includes("attendance")) {
    return "participation";
  }
  
  return "other";
}

// Get category icon for an assignment type
export function getCategoryIcon(type: AssignmentType): LucideIcon {
  return CATEGORY_ICONS[type] || FileText;
}
