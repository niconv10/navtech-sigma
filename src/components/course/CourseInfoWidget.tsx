import { Mail, MapPin, Clock } from "lucide-react";
import type { Course, Semester } from "@/types";

interface CourseInfoWidgetProps {
  course: Course;
  semester?: Semester;
}

export function CourseInfoWidget({ course, semester }: CourseInfoWidgetProps) {
  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Course Info</span>
      </div>
      <div className="px-5 pb-5">
        <div>
          <div className="flex justify-between py-3 border-b border-white/[0.06]">
            <span className="text-sm text-muted-foreground">Semester</span>
            <span className="text-sm font-medium text-foreground">{semester?.name || "—"}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/[0.06]">
            <span className="text-sm text-muted-foreground">Credits</span>
            <span className="text-sm font-medium text-foreground">{course.credits}</span>
          </div>
          
          {course.instructor && (
            <>
              <div className="py-3 border-b border-white/[0.06]">
                <p className="text-xs text-muted-foreground mb-1">Instructor</p>
                <p className="text-sm font-medium text-foreground">{course.instructor.name}</p>
              </div>
              {course.instructor.email && (
                <a
                  href={`mailto:${course.instructor.email}`}
                  className="flex items-center gap-2 py-3 text-sm text-primary hover:underline border-b border-white/[0.06]"
                >
                  <Mail className="w-4 h-4" />
                  {course.instructor.email}
                </a>
              )}
              {course.instructor.office && (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground border-b border-white/[0.06]">
                  <MapPin className="w-4 h-4" />
                  {course.instructor.office}
                </div>
              )}
              {course.instructor.officeHours && (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {course.instructor.officeHours}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
