import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { Plus, ChevronRight, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { useCourses, updateCourseColor } from "@/hooks/useCourses";
import { calculateCourseGrade, calculateCourseProgress, percentageToLetter, calculateGPA } from "@/lib/gradeUtils";
import { Button } from "@/components/ui/button";
import { CourseColorPicker } from "@/components/dashboard/CourseColorPicker";
import { toast } from 'sonner';

export default function Courses() {
  const navigate = useNavigate();
  const { courses: storeCourses, activeSemesterId, semesters, setActiveSemester, updateCourse } = useSemesterStore();
  
  // Fetch courses from database and sync to store
  useCourses();

  // Get active semester info
  const activeSemester = semesters.find(s => s.id === activeSemesterId);

  // Get courses for active semester
  const courses = storeCourses.filter((c) => c.semesterId === activeSemesterId);
  const hasNoCourses = courses.length === 0;

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const totalAssignments = courses.reduce((sum, c) => sum + c.assignments.length, 0);
  const currentGPA = calculateGPA(courses);

  const handleColorChange = async (courseId: string, newColor: string) => {
    // Update locally first
    updateCourse(courseId, { color: newColor });
    
    // Then update in database
    const { error } = await updateCourseColor(courseId, newColor);
    if (error) {
      toast.error("Failed to update color", { description: "Please try again." });
    }
  };

  return (
    <MainLayout>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-medium text-foreground tracking-[-0.5px]">My Courses</h1>
        {!hasNoCourses && (
          <button
            onClick={() => navigate("/courses/upload")}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 hover:border-border/80 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        )}
      </div>

      {/* Semester Tabs - Simple Text Style */}
      <div className="flex items-center gap-6 mb-6">
        {semesters.map((semester) => (
          <button
            key={semester.id}
            onClick={() => setActiveSemester(semester.id)}
            className={cn(
              "text-sm bg-transparent border-none p-0 cursor-pointer transition-colors",
              activeSemesterId === semester.id
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {semester.name}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {hasNoCourses ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mb-6">
            <Upload className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No courses in {activeSemester?.name || 'this semester'}</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Upload your syllabus and let our AI automatically extract course information, 
            assignments, due dates, and grading weights.
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
      ) : (
        <>
          {/* Stats Bar - Glass Widget */}
          <div className="stats-bar flex items-end gap-12 mb-8">
            {/* Primary Stat - GPA */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[1.5px] text-muted-foreground mb-2">
                Current GPA
              </span>
              <div className="flex items-baseline">
                <span className="text-5xl font-light text-foreground leading-none">
                  {currentGPA > 0 ? currentGPA.toFixed(2) : "—"}
                </span>
                <span className="text-lg text-muted-foreground ml-1">/ 4.00</span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-14 bg-border/50" />

            {/* Secondary Stats */}
            <div className="flex gap-12">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[1.5px] text-muted-foreground mb-1">
                  Courses
                </span>
                <span className="text-[28px] font-light text-foreground">{courses.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[1.5px] text-muted-foreground mb-1">
                  Credits
                </span>
                <span className="text-[28px] font-light text-foreground">{totalCredits}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[1.5px] text-muted-foreground mb-1">
                  Assignments
                </span>
                <span className="text-[28px] font-light text-foreground">{totalAssignments}</span>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="space-y-4">
            {courses.map((course) => {
              const gradePercent = calculateCourseGrade(course.assignments);
              const letterGrade = gradePercent > 0 ? percentageToLetter(gradePercent, course.gradingScale) : null;
              const progress = calculateCourseProgress(course.assignments);
              const gradedCount = course.assignments.filter((a) => a.score !== null).length;
              const nextDue = course.assignments
                .filter(a => a.dueDate && a.score === null && new Date(a.dueDate) > new Date())
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

              return (
                <div
                  key={course.id}
                  className="glass-widget overflow-hidden group cursor-pointer hover:bg-secondary/50 transition-all relative"
                  style={{ borderLeft: `4px solid ${course.color}` }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="p-5">
                    {/* Top Section */}
                    <div className="flex items-start justify-between gap-4 mb-1">
                      {/* Left: Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CourseColorPicker
                            color={course.color}
                            onColorChange={(newColor) => handleColorChange(course.id, newColor)}
                          />
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{course.code}</span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground group-hover:text-foreground transition-colors truncate">
                          {course.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {course.instructor?.name || "No instructor"} • {course.credits} Credits
                        </p>
                      </div>

                      {/* Right: Grade */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {gradePercent > 0 ? (
                          <>
                            <span className="text-2xl font-light text-foreground">{gradePercent.toFixed(1)}%</span>
                            <span 
                              className="text-lg font-semibold"
                              style={{ color: course.color }}
                            >
                              {letterGrade}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No grades yet</span>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border my-4" />

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-muted-foreground">{course.assignments.length} items</span>
                        <span className="text-muted-foreground">{gradedCount}/{course.assignments.length} graded</span>
                        <span className="text-muted-foreground">
                          Next: {nextDue ? new Date(nextDue.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: course.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Course Card */}
            <div
              className="border border-dashed border-border hover:border-border/80 rounded-xl cursor-pointer group transition-all hover:bg-secondary/50 flex flex-col items-center justify-center py-12 text-center"
              onClick={() => navigate("/courses/upload")}
            >
              <Plus className="w-8 h-8 text-muted-foreground/60 mb-3 group-hover:text-muted-foreground transition-colors" />
              <h3 className="text-base font-medium text-foreground mb-1">Add New Course</h3>
              <p className="text-sm text-muted-foreground">
                Upload a syllabus to get started
              </p>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}