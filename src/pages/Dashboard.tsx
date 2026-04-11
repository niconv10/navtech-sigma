import { MainLayout } from "@/components/layout/MainLayout";
import { GPAChartWidget } from "@/components/dashboard/GPAChartWidget";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AskAIButton } from "@/components/dashboard/AskAIButton";
import { WorkloadCalendarWidget } from "@/components/dashboard/WorkloadCalendarWidget";
import { TodayWidget } from "@/components/dashboard/TodayWidget";
import { NeedsAttentionCard } from "@/components/dashboard/NeedsAttentionCard";
import { QuickStatsGrid } from "@/components/dashboard/QuickStatsGrid";
import { CourseListWidget } from "@/components/dashboard/CourseListWidget";
import { Target, TrendingUp, Plus, Upload, Settings } from "lucide-react";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";
import {
  calculateGPA,
  calculateCourseGrade,
  calculateCourseProgress,
  percentageToLetter,
} from "@/lib/gradeUtils";
import { calculateAllCourseRisks } from "@/lib/riskAssessment";

import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const navigate = useNavigate();
  const { courses: storeCourses, activeSemesterId } = useSemesterStore();
  const { profile } = useAuth();
  
  // Fetch courses from database and sync to store
  const { refetch } = useCourses();
  
  // Get courses for active semester
  const courses = storeCourses.filter((c) => c.semesterId === activeSemesterId);
  const hasNoCourses = courses.length === 0;
  
  // Calculate stats
  const currentGPA = useMemo(() => calculateGPA(courses), [courses]);
  const targetGPA = profile?.gpa_goal ?? 3.5;
  
  const allAssignments = useMemo(() => courses.flatMap((c) =>
    c.assignments.map((a) => ({
      ...a,
      courseCode: c.code,
      courseColor: c.color,
      courseName: c.name,
    }))
  ), [courses]);

  const totalAssignments = allAssignments.length;
  const completedAssignments = allAssignments.filter((a) => a.score !== null).length;
  const semesterProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  
  const averageGrade = useMemo(() => {
    const coursesWithGrades = courses.filter((c) => calculateCourseGrade(c.assignments) > 0);
    if (coursesWithGrades.length === 0) return 0;
    return (
      coursesWithGrades.reduce((sum, c) => sum + calculateCourseGrade(c.assignments), 0) /
      coursesWithGrades.length
    );
  }, [courses]);
  
  // Calculate course risks
  const courseRisks = useMemo(() => calculateAllCourseRisks(courses), [courses]);
  
  // Get courses that need attention (medium risk or higher)
  const coursesNeedingAttention = useMemo(() => {
    return courseRisks
      .filter(r => r.riskLevel !== 'low')
      .sort((a, b) => {
        const priority = { critical: 0, high: 1, medium: 2, low: 3 };
        return priority[a.riskLevel] - priority[b.riskLevel];
      });
  }, [courseRisks]);
  
  // Course data for sidebar
  const courseItems = useMemo(() => courses.map((c) => {
    const grade = calculateCourseGrade(c.assignments);
    const risk = courseRisks.find(r => r.courseId === c.id);

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      grade: grade > 0 ? percentageToLetter(grade) : "—",
      gradePercent: Math.round(grade),
      progress: Math.round(calculateCourseProgress(c.assignments)),
      color: c.color,
      status: risk?.riskLevel || 'low',
    };
  }), [courses, courseRisks]);
  
  // Count courses by status
  const coursesOnTrack = courseItems.filter(c => c.status === 'low' && c.gradePercent > 0).length;
  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 3), 0);
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  // Get motivational subtext based on performance
  const getSubtext = () => {
    if (currentGPA >= targetGPA) {
      return "You're doing great this semester. Keep it up.";
    } else if (currentGPA >= targetGPA - 0.3) {
      return "You're close to your target. Stay focused.";
    } else {
      return "Let's work on getting you back on track.";
    }
  };
  
  const firstName = profile?.full_name?.split(" ")[0] || "Student";
  const userInitials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "S";

  // Empty state when no courses
  if (hasNoCourses) {
    return (
      <MainLayout>
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[28px] font-medium text-foreground tracking-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">Let's get you started with SIGMA.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mb-6">
            <Upload className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No courses yet</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Upload your first syllabus and let our AI automatically extract your courses, 
            assignments, and grading weights.
          </p>
          <Button
            size="lg"
            className="gradient-primary text-white"
            onClick={() => navigate("/courses/upload")}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Course
          </Button>
        </div>

        <AskAIButton onClick={() => navigate("/advisor")} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-medium text-foreground tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{getSubtext()}</p>
        </div>
        
        {/* Top Right Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="glass-widget border-border/50 w-10 h-10"
            onClick={() => navigate("/courses/upload")}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="glass-widget border-border/50 w-10 h-10"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Main Content Grid - 2 column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        
        {/* Left Column - Primary Content */}
        <div className="space-y-5">
          
          {/* GPA Chart - Hero Widget */}
          <GPAChartWidget currentGPA={currentGPA} targetGPA={targetGPA} />
          
          
          {/* Workload Calendar with Upcoming Assignments */}
          <WorkloadCalendarWidget 
            assignments={allAssignments.map(a => ({
              id: a.id,
              name: a.name,
              dueDate: a.dueDate,
              weight: a.weight,
              courseCode: a.courseCode,
              courseColor: a.courseColor,
              courseName: a.courseName,
            }))}
          />
          
          {/* Add Course Button */}
          <Button
            variant="outline"
            className="w-full glass-widget border-dashed border-border/50 text-muted-foreground hover:text-foreground h-12"
            onClick={() => navigate("/courses/upload")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add course
          </Button>
        </div>

        {/* Right Sidebar - Supporting Info */}
        <div className="space-y-4">
          
          {/* Today Widget */}
          <TodayWidget />
          
          {/* Quick Stats */}
          <QuickStatsGrid
            coursesOnTrack={coursesOnTrack}
            totalCourses={courses.length}
            totalCredits={totalCredits}
          />
          
          {/* My Courses List */}
          <CourseListWidget
            courses={courseItems}
            onViewCourse={(courseId) => navigate(`/courses/${courseId}`)}
            onViewAll={() => navigate("/courses")}
          />
          
          {/* Semester Progress */}
          <MetricCard
            title="Semester Progress"
            value={`${Math.round(semesterProgress)}%`}
            subtitle="complete"
            progress={semesterProgress}
          />
          
          {/* Target GPA */}
          <MetricCard
            title="Target GPA"
            value={targetGPA.toFixed(2)}
            subtitle={currentGPA >= targetGPA ? "On track" : `${(targetGPA - currentGPA).toFixed(2)} to go`}
            icon={Target}
            iconColor={currentGPA >= targetGPA ? "text-success" : "text-warning"}
          />
          
          {/* Average Grade */}
          <MetricCard
            title="Average Grade"
            value={averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : "—"}
            subtitle={averageGrade > 0 ? percentageToLetter(averageGrade) : "No grades yet"}
            icon={TrendingUp}
            iconColor="text-info"
          />
          
          {/* Needs Attention Card */}
          <NeedsAttentionCard
            courseRisks={coursesNeedingAttention}
            onViewCourse={(courseId) => navigate(`/courses/${courseId}`)}
          />
        </div>
      </div>

      {/* Ask AI Floating Button */}
      <AskAIButton onClick={() => navigate("/advisor")} />
    </MainLayout>
  );
}
