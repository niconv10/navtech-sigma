import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useSemesterStore } from "@/stores/useSemesterStore";
import {
  deleteCourseFromDatabase,
  updateAssignmentInDatabase,
  deleteAssignmentFromDatabase,
  addAssignmentToDatabase,
  normalizeGradingScale,
} from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { calculateCourseGrade, percentageToLetter } from "@/lib/gradeUtils";
import type { Assignment, AssignmentType } from "@/types";
import { DEFAULT_GRADING_SCALE } from "@/types";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  LayoutGrid,
  FolderKanban,
  TrendingUp,
  BookOpen,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from 'sonner';
import { GradesTabApple } from "@/components/course/GradesTabApple";
import { GradeJourneyWidget } from "@/components/course/GradeJourneyWidget";
import { GradeWeightWidget } from "@/components/course/GradeWeightWidget";
import { UpcomingDeadlinesWidget } from "@/components/course/UpcomingDeadlinesWidget";
import { RecentActivityWidget } from "@/components/course/RecentActivityWidget";
import { GradeProjectionWidget } from "@/components/course/GradeProjectionWidget";
import { QuickStatsWidget } from "@/components/course/QuickStatsWidget";
import { GradingScaleWidget } from "@/components/course/GradingScaleWidget";
import { WhatIfTab } from "@/components/course/WhatIfTab";
import { MaterialsWidget } from "@/components/course/MaterialsWidget";
import { PoliciesWidget } from "@/components/course/PoliciesWidget";
import { AIPolicyWidget } from "@/components/course/AIPolicyWidget";
import { ModulesWidget } from "@/components/course/ModulesWidget";
import { ImportantDatesWidget } from "@/components/course/ImportantDatesWidget";
import { LearningObjectivesWidget } from "@/components/course/LearningObjectivesWidget";
import { SupportResourcesWidget } from "@/components/course/SupportResourcesWidget";
import { PrerequisitesWidget } from "@/components/course/PrerequisitesWidget";
import { GradeInputModal } from "@/components/course/GradeInputModal";
import { EditAssignmentModal } from "@/components/course/EditAssignmentModal";
import { SyllabusUpdateModal } from "@/components/course/SyllabusUpdateModal";
import { QuickGradeEntryModal } from "@/components/course/QuickGradeEntryModal";

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "homework", label: "Homework" },
  { value: "project", label: "Project" },
  { value: "paper", label: "Paper" },
  { value: "lab", label: "Lab" },
  { value: "discussion", label: "Discussion" },
  { value: "participation", label: "Participation" },
  { value: "other", label: "Other" },
];

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getCourseById,
    updateAssignmentScore,
    addAssignment,
    deleteAssignment,
    deleteCourse,
    updateAssignment,
    semesters,
  } = useSemesterStore();

  const course = getCourseById(courseId || "");
  const semester = semesters.find((s) => s.id === course?.semesterId);

  const [isDeleting, setIsDeleting] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({
    name: "",
    type: "homework" as AssignmentType,
    weight: 0,
    dueDate: "",
    description: "",
    score: "",
  });

  const [syllabusUpdateOpen, setSyllabusUpdateOpen] = useState(false);
  const [quickGradeOpen, setQuickGradeOpen] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    name: "",
    type: "homework" as AssignmentType,
    weight: 0,
    dueDate: "",
    description: "",
  });

  const gradePercent = useMemo(() => (course ? calculateCourseGrade(course.assignments) : 0), [course?.assignments]);
  const letterGrade = useMemo(
    () => (gradePercent > 0 ? percentageToLetter(gradePercent, course?.gradingScale) : "—"),
    [gradePercent, course?.gradingScale]
  );
  const gradedCount = useMemo(
    () => (course ? course.assignments.filter((a) => a.score !== null).length : 0),
    [course?.assignments],
  );
  const totalWeight = useMemo(
    () => (course ? course.assignments.reduce((sum, a) => sum + a.weight, 0) : 0),
    [course?.assignments],
  );

  const gradingScale = normalizeGradingScale(course?.gradingScale) || DEFAULT_GRADING_SCALE;

  const syllabusSectionCount = useMemo(() => {
    if (!course) return 0;
    let count = 0;
    if (course.aiPolicy) count++;
    if (course.policies) count++;
    if (course.importantDates) count++;
    if (course.prerequisites) count++;
    if (
      course.materials &&
      (Array.isArray(course.materials) ? course.materials.length > 0 : Object.keys(course.materials).length > 0)
    )
      count++;
    if (course.learningObjectives && course.learningObjectives.length > 0) count++;
    if (course.modules && course.modules.length > 0) count++;
    if (course.supportResources) count++;
    return count;
  }, [course]);

  const openAssignmentModal = useCallback((assignment: Assignment, isFullEdit: boolean) => {
    setSelectedAssignment(assignment);
    setEditMode(isFullEdit);
    setEditFields({
      name: assignment.name,
      type: assignment.type,
      weight: assignment.weight,
      dueDate: assignment.dueDate || "",
      description: assignment.description || "",
      score: assignment.score?.toString() || "",
    });
    setGradeModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback(
    (assignment: Assignment) => {
      openAssignmentModal(assignment, true);
    },
    [openAssignmentModal],
  );

  const handleSetDueDate = useCallback(
    async (assignmentId: string, date: string | null) => {
      if (!course) return;
      // Optimistic update in store
      updateAssignment(course.id, assignmentId, { dueDate: date ?? undefined });
      // Persist to database
      const { error } = await updateAssignmentInDatabase(assignmentId, { due_date: date });
      if (error) {
        toast.error('Failed to save due date', { description: 'Local change kept; sync failed.' });
      }
    },
    [course, updateAssignment],
  );

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-foreground mb-2">Course not found</h2>
          <p className="text-muted-foreground mb-4">This course doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
        </div>
      </MainLayout>
    );
  }

  const handleSaveAssignment = async () => {
    if (!selectedAssignment || !course) return;

    if (editMode) {
      if (!editFields.name || editFields.weight <= 0) {
        toast.error("Missing information", { description: "Name and weight are required." });
        return;
      }
      const score = editFields.score === "" ? null : parseFloat(editFields.score);
      if (score !== null && (score < 0 || score > 100 || isNaN(score))) {
        toast.error("Invalid score", { description: "Score must be between 0 and 100." });
        return;
      }
      updateAssignment(course.id, selectedAssignment.id, {
        name: editFields.name,
        type: editFields.type,
        weight: editFields.weight,
        dueDate: editFields.dueDate || undefined,
        description: editFields.description || undefined,
        score,
      });
      const { error } = await updateAssignmentInDatabase(selectedAssignment.id, {
        name: editFields.name,
        type: editFields.type,
        weight: editFields.weight,
        due_date: editFields.dueDate || null,
        description: editFields.description || null,
        score,
      });
      setGradeModalOpen(false);
      if (error) {
        toast.error("Error saving", { description: "Local changes saved but database sync failed." });
      } else {
        toast.success("Assignment updated", { description: `${editFields.name} has been updated.` });
      }
    } else {
      const score = editFields.score === "" ? null : parseFloat(editFields.score);
      if (score !== null && (score < 0 || score > 100 || isNaN(score))) {
        toast.error("Invalid score", { description: "Please enter a score between 0 and 100." });
        return;
      }
      updateAssignmentScore(course.id, selectedAssignment.id, score);
      const { error } = await updateAssignmentInDatabase(selectedAssignment.id, { score });
      setGradeModalOpen(false);
      if (error) {
        toast.error("Error saving", { description: "Local changes saved but database sync failed." });
      } else {
        toast.success("Grade saved", { description: `${selectedAssignment.name} updated to ${score !== null ? score + "%" : "not graded"}.` });
      }
    }
  };

  const handleEditSave = async (fields: {
    name: string;
    type: AssignmentType;
    weight: number;
    dueDate: string | undefined;
    description: string | undefined;
    score: number | null;
  }) => {
    if (!selectedAssignment || !course) return;
    updateAssignment(course.id, selectedAssignment.id, {
      name: fields.name,
      type: fields.type,
      weight: fields.weight,
      dueDate: fields.dueDate,
      description: fields.description,
      score: fields.score,
    });
    const { error } = await updateAssignmentInDatabase(selectedAssignment.id, {
      name: fields.name,
      type: fields.type,
      weight: fields.weight,
      due_date: fields.dueDate || null,
      description: fields.description || null,
      score: fields.score,
    });
    setGradeModalOpen(false);
    if (error) {
      toast.error("Error saving", { description: "Local changes saved but database sync failed." });
    } else {
      toast.success("Assignment updated", { description: `${fields.name} has been updated.` });
    }
  };

  const handleEditDelete = async () => {
    if (!selectedAssignment || !course) return;
    const { error } = await deleteAssignmentFromDatabase(selectedAssignment.id);
    if (error) {
      toast.error("Error deleting", { description: "Failed to delete from database." });
      return;
    }
    deleteAssignment(course.id, selectedAssignment.id);
    toast.success("Assignment deleted", { description: `${selectedAssignment.name} has been removed.` });
    setGradeModalOpen(false);
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.name || newAssignment.weight <= 0 || !course || !user) {
      toast.error("Missing information", { description: "Please enter a name and weight." });
      return;
    }
    const { assignmentId, error } = await addAssignmentToDatabase(user.id, course.id, {
      name: newAssignment.name,
      type: newAssignment.type,
      weight: newAssignment.weight,
      due_date: newAssignment.dueDate || null,
      description: newAssignment.description || null,
    });
    if (error || !assignmentId) {
      toast.error("Error adding assignment", { description: "Failed to save to database." });
      return;
    }
    addAssignment(course.id, { id: assignmentId, ...newAssignment, score: null });
    setAddModalOpen(false);
    setNewAssignment({ name: "", type: "homework", weight: 0, dueDate: "", description: "" });
    toast.success("Assignment added", { description: `${newAssignment.name} has been added.` });
  };

  const handleDeleteAssignment = (assignmentId: string, assignmentName: string) => {
    setAssignmentToDelete({ id: assignmentId, name: assignmentName });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete || !course) return;
    setIsDeletingAssignment(true);
    const { error } = await deleteAssignmentFromDatabase(assignmentToDelete.id);
    if (error) {
      toast.error("Error deleting", { description: "Failed to delete from database." });
      setIsDeletingAssignment(false);
      return;
    }
    deleteAssignment(course.id, assignmentToDelete.id);
    toast.success("Assignment deleted", { description: `${assignmentToDelete.name} has been removed.` });
    setIsDeletingAssignment(false);
    setDeleteConfirmOpen(false);
    setAssignmentToDelete(null);
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    setIsDeleting(true);
    const { success, error } = await deleteCourseFromDatabase(course.id);
    if (error || !success) {
      toast.error("Error deleting course", { description: error?.message || "Failed to delete course." });
      setIsDeleting(false);
      return;
    }
    deleteCourse(course.id);
    toast.success("Course deleted", { description: `${course.code} has been removed.` });
    navigate("/courses");
  };

  const formatSchedule = () => {
    if (!course.schedule) return null;
    const schedule = course.schedule as { days?: string[]; startTime?: string; endTime?: string; location?: string };
    if (!schedule.days || !schedule.startTime) return null;
    const daysStr = schedule.days.map((d) => d.slice(0, 3)).join("/");
    return `${daysStr} ${schedule.startTime}${schedule.endTime ? ` - ${schedule.endTime}` : ""}`;
  };

  const scheduleStr = formatSchedule();

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/courses")}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span
              className="course-badge-primary px-3 py-1.5 rounded-md text-xs font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: course.color }}
            >
              {course.code}
            </span>
            <span className="course-badge px-3 py-1.5 rounded-md text-xs font-medium bg-secondary border border-border text-muted-foreground hidden sm:inline-flex">
              {course.credits} Credits
            </span>
            {semester && (
              <span className="course-badge px-3 py-1.5 rounded-md text-xs font-medium bg-secondary border border-border text-muted-foreground hidden sm:inline-flex">
                {semester.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickGradeOpen(true)}
              className="text-xs gap-1.5"
              title="Quick Grade Entry"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Entry</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSyllabusUpdateOpen(true)}
              className="text-xs gap-1.5"
              title="Update Syllabus"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Update Syllabus</span>
            </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {course.code}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{course.name}</strong> and all its assignments. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCourse}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Course"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

        <div className="course-header-card">
          <h1 className="course-title">{course.name}</h1>
          {course.instructor && <p className="course-professor">{course.instructor.name}</p>}
          <div className="course-meta">
            {course.instructor?.email && (
              <a href={`mailto:${course.instructor.email}`}>
                <Mail className="w-3.5 h-3.5" />
                {course.instructor.email}
              </a>
            )}
            {course.instructor?.office && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {course.instructor.office}
              </span>
            )}
            {scheduleStr && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {scheduleStr}
              </span>
            )}
          </div>
          <div className="course-stats-row">
            <div className="course-stat">
              <p className="course-stat-value">{gradePercent > 0 ? `${gradePercent.toFixed(1)}%` : "—"}</p>
              <p className="course-stat-label">Current</p>
            </div>
            <div className="course-stat">
              <p className="course-stat-value" style={{ color: gradePercent > 0 ? course.color : undefined }}>
                {letterGrade}
              </p>
              <p className="course-stat-label">Letter</p>
            </div>
            <div className="course-stat">
              <p className="course-stat-value">
                {gradedCount}/{course.assignments.length}
              </p>
              <p className="course-stat-label">Progress</p>
            </div>
            <div className="course-stat">
              <p className="course-stat-value">{totalWeight.toFixed(0)}%</p>
              <p className="course-stat-label">Weight</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="course-tabs bg-secondary/50 dark:bg-white/[0.02] border border-border dark:border-white/[0.06] p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 rounded-md"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 rounded-md"
            >
              <FolderKanban className="w-4 h-4" />
              <span className="hidden sm:inline">Grades</span>
            </TabsTrigger>
            <TabsTrigger
              value="whatif"
              className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 rounded-md"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">What-If</span>
            </TabsTrigger>
            {syllabusSectionCount > 0 && (
              <TabsTrigger
                value="syllabus"
                className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 rounded-md"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Syllabus</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="add"
              className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 rounded-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Items</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <GradeJourneyWidget assignments={course.assignments} currentGrade={gradePercent} targetGrade={90} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <GradeWeightWidget assignments={course.assignments} courseColor={course.color} />
                <UpcomingDeadlinesWidget assignments={course.assignments} />
                <RecentActivityWidget assignments={course.assignments} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <GradingScaleWidget gradingScale={gradingScale} currentGrade={gradePercent} />
                <GradeProjectionWidget assignments={course.assignments} currentGrade={gradePercent} targetGrade={90} />
                <QuickStatsWidget
                  assignments={course.assignments}
                  currentGrade={gradePercent}
                  gradingScale={gradingScale}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="grades">
            <GradesTabApple
              assignments={course.assignments}
              courseColor={course.color}
              courseCode={course.code}
              onScoreAssignment={(a) => openAssignmentModal(a, false)}
              onEditAssignment={handleOpenEditModal}
              onDeleteAssignment={handleDeleteAssignment}
              onAddAssignment={(type) => {
                if (type) setNewAssignment({ ...newAssignment, type });
                setAddModalOpen(true);
              }}
              onSetDueDate={handleSetDueDate}
            />
          </TabsContent>

          <TabsContent value="whatif">
            <WhatIfTab
              assignments={course.assignments}
              courseColor={course.color}
              courseCode={course.code}
              courseName={course.name}
              gradingScale={course.gradingScale}
            />
          </TabsContent>

          {syllabusSectionCount > 0 && (
            <TabsContent value="syllabus" className="space-y-6">
              {(course.aiPolicy || course.policies) && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {course.aiPolicy && (
                      <div className="lg:col-span-1">
                        <AIPolicyWidget aiPolicy={course.aiPolicy} />
                      </div>
                    )}
                    {course.policies && !course.aiPolicy && (
                      <div className="lg:col-span-2">
                        <PoliciesWidget policies={course.policies} />
                      </div>
                    )}
                    {course.policies && course.aiPolicy && <div className="lg:col-span-1"></div>}
                  </div>
                  {course.policies && course.aiPolicy && <PoliciesWidget policies={course.policies} />}
                </div>
              )}
              {(course.importantDates || course.prerequisites) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {course.importantDates && (
                    <ImportantDatesWidget importantDates={course.importantDates} finalExam={course.finalExam} />
                  )}
                  {course.prerequisites && <PrerequisitesWidget prerequisites={course.prerequisites} />}
                </div>
              )}
              {(course.learningObjectives?.length > 0 || course.modules?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {course.learningObjectives && course.learningObjectives.length > 0 && (
                    <LearningObjectivesWidget objectives={course.learningObjectives} />
                  )}
                  {course.modules && course.modules.length > 0 && <ModulesWidget modules={course.modules} />}
                </div>
              )}
              {(course.materials || course.supportResources) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {course.materials &&
                    (Array.isArray(course.materials)
                      ? course.materials.length > 0
                      : Object.keys(course.materials).length > 0) && (
                      <MaterialsWidget materials={course.materials as any} />
                    )}
                  {course.supportResources && <SupportResourcesWidget resources={course.supportResources} />}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="add" className="space-y-6">
            <div className="glass-widget max-w-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Add New Assignment</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newAssignment.name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                    placeholder="Assignment name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={newAssignment.type}
                      onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value as AssignmentType })}
                      className="w-full p-2 rounded-lg border border-input bg-background"
                    >
                      {ASSIGNMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (%) *</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newAssignment.weight}
                      onChange={(e) => setNewAssignment({ ...newAssignment, weight: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Brief description..."
                    className="w-full p-3 rounded-lg border border-input bg-background min-h-[100px] resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setNewAssignment({ name: "", type: "homework", weight: 0, dueDate: "", description: "" })
                    }
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddAssignment} disabled={!course}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditAssignmentModal
        open={gradeModalOpen && editMode}
        onClose={() => setGradeModalOpen(false)}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        assignment={selectedAssignment}
        courseCode={course.code}
        courseColor={course.color}
      />

      <GradeInputModal
        open={gradeModalOpen && !editMode}
        onClose={() => setGradeModalOpen(false)}
        onSave={async (score) => {
          if (!selectedAssignment || !course) return;
          updateAssignmentScore(course.id, selectedAssignment.id, score);
          const { error } = await updateAssignmentInDatabase(selectedAssignment.id, { score });
          setGradeModalOpen(false);
          if (error) {
            toast.error("Error saving", { description: "Local changes saved but database sync failed." });
          } else {
            toast.success("Grade saved", { description: `${selectedAssignment.name} updated to ${score !== null ? score + "%" : "not graded"}.` });
          }
        }}
        assignment={selectedAssignment}
        courseCode={course.code}
        courseColor={course.color}
        initialScore={editFields.score}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{assignmentToDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAssignment}
              disabled={isDeletingAssignment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAssignment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newAssignment.name}
                onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                placeholder="Assignment name"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={newAssignment.type}
                onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value as AssignmentType })}
                className="w-full p-2 rounded-lg border border-input bg-background"
              >
                {ASSIGNMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Weight (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newAssignment.weight}
                onChange={(e) => setNewAssignment({ ...newAssignment, weight: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAssignment} disabled={!course}>
              Add Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 border-t border-border pt-6">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            These grades are estimates based on the information you entered. Your professor may use different
            calculations. Always check your official grades through your university portal.
          </p>
        </div>
      </div>

      {/* Quick grade entry modal */}
      <QuickGradeEntryModal
        open={quickGradeOpen}
        onOpenChange={setQuickGradeOpen}
        course={course}
      />

      {/* Syllabus re-upload modal */}
      {user && (
        <SyllabusUpdateModal
          open={syllabusUpdateOpen}
          onOpenChange={setSyllabusUpdateOpen}
          course={course}
          userId={user.id}
        />
      )}
    </MainLayout>
  );
}
