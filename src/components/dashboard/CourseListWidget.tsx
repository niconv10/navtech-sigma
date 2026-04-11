import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseItem {
  id: string;
  code: string;
  name: string;
  grade: string;
  gradePercent: number;
  progress: number;
  color: string;
  status: 'low' | 'medium' | 'high' | 'critical';
}

interface CourseListWidgetProps {
  courses: CourseItem[];
  onViewCourse: (courseId: string) => void;
  onViewAll: () => void;
}

export function CourseListWidget({ 
  courses, 
  onViewCourse, 
  onViewAll 
}: CourseListWidgetProps) {
  const getGradeClass = (status: string, gradePercent: number): string => {
    if (gradePercent === 0) return '';
    if (status === 'critical') return 'critical';
    if (status === 'high' || status === 'medium') return 'attention';
    if (gradePercent >= 90) return 'excellent';
    if (gradePercent >= 80) return 'good';
    return 'attention';
  };

  return (
    <div className="glass-widget overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="widget-title">My Courses</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        </div>
        <button
          onClick={onViewAll}
          className="text-[10px] font-medium text-accent hover:text-accent/80 transition-colors uppercase tracking-wider"
        >
          See All
        </button>
      </div>
      
      {/* Course List */}
      <div>
        {courses.map((course) => (
          <div 
            key={course.id}
            className="course-list-item"
            style={{ borderLeftColor: course.color }}
            onClick={() => onViewCourse(course.id)}
          >
            <div className="course-list-left">
              <span className="course-list-code">{course.code}</span>
              <span className="course-list-name">{course.name}</span>
            </div>
            <div className="course-list-right">
              {course.gradePercent > 0 ? (
                <>
                  <span className="course-list-percent">{course.gradePercent}%</span>
                  <span className={cn("course-list-grade", getGradeClass(course.status, course.gradePercent))}>
                    {course.grade}
                  </span>
                </>
              ) : (
                <span className="course-list-new">No grades</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
