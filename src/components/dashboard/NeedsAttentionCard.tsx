import { ChevronRight, CheckCircle } from "lucide-react";
import { CourseRisk } from "@/lib/riskAssessment";
import { percentageToLetter } from "@/lib/gradeUtils";

interface NeedsAttentionCardProps {
  courseRisks: CourseRisk[];
  onViewCourse: (courseId: string) => void;
}

export function NeedsAttentionCard({ courseRisks, onViewCourse }: NeedsAttentionCardProps) {
  // Get the most critical course to highlight
  const primaryCourse = courseRisks[0];
  const hasCritical = courseRisks.some(r => r.riskLevel === 'critical');
  
  if (courseRisks.length === 0) {
    return (
      <div className="glass-widget overflow-hidden">
        <div className="attention-card-header">
          <span className="widget-title">Needs Your Attention</span>
        </div>
        <div className="attention-all-clear">
          <div className="attention-all-clear-icon">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="attention-all-clear-title">All courses on track</h3>
          <p className="attention-all-clear-subtitle">
            You're doing great! Keep up the good work.
          </p>
        </div>
      </div>
    );
  }

  // Get actionable advice based on the primary concern
  const getActionableAdvice = (risk: CourseRisk): string => {
    if (risk.primaryConcern.toLowerCase().includes('exam')) {
      return `Focus on exam preparation. Review past materials and practice problems.`;
    }
    if (risk.primaryConcern.toLowerCase().includes('assignment')) {
      return `You have upcoming assignments that could significantly impact your grade.`;
    }
    if (risk.primaryConcern.toLowerCase().includes('grade') || risk.primaryConcern.toLowerCase().includes('drop')) {
      return `Your grade has been trending down. Consider meeting with your professor or getting tutoring help.`;
    }
    if (risk.primaryConcern.toLowerCase().includes('participation')) {
      return `Attendance and participation can boost your grade. Make sure you're engaged in class.`;
    }
    return `Review your recent performance and identify areas where you can improve.`;
  };

  const currentLetter = primaryCourse.currentGrade > 0 
    ? percentageToLetter(primaryCourse.currentGrade) 
    : '—';

  return (
    <div className={`glass-widget overflow-hidden attention-card ${hasCritical ? 'critical' : ''}`}>
      {/* Header */}
      <div className="attention-card-header">
        <span className="widget-title">Needs Your Attention</span>
        <span className="attention-count-badge">
          {courseRisks.length} {courseRisks.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {/* Primary Course Highlight */}
      <div 
        className={`attention-item ${hasCritical ? 'critical' : ''}`}
        onClick={() => onViewCourse(primaryCourse.courseId)}
        role="button"
        tabIndex={0}
      >
        <div className="attention-item-left">
          <div 
            className={`attention-dot ${hasCritical ? 'critical' : ''}`}
            style={{ backgroundColor: primaryCourse.courseColor }}
          />
          <div>
            <div className="attention-course-code">{primaryCourse.courseCode}</div>
            <div className="attention-course-name">{primaryCourse.primaryConcern}</div>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`attention-grade ${hasCritical ? 'critical' : ''}`}>
            {primaryCourse.currentGrade?.toFixed(0) || '—'}%
          </span>
          <span className={`attention-letter ${hasCritical ? 'critical' : ''}`}>
            {currentLetter}
          </span>
        </div>
      </div>

      {/* Actionable Advice */}
      <p className="attention-advice">
        {getActionableAdvice(primaryCourse)}
      </p>

      {/* Action Button */}
      <button 
        className="attention-action-btn"
        onClick={() => onViewCourse(primaryCourse.courseId)}
      >
        View Course Details
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Additional Courses (if more than one) */}
      {courseRisks.length > 1 && (
        <div className="px-5 pb-5">
          <div className="text-xs text-muted-foreground mb-2">
            Also needs attention:
          </div>
          <div className="flex flex-wrap gap-2">
            {courseRisks.slice(1, 4).map((risk) => (
              <button
                key={risk.courseId}
                onClick={() => onViewCourse(risk.courseId)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                  bg-secondary/50 text-foreground hover:bg-secondary
                  border border-border/50 hover:border-border"
                style={{ borderLeftColor: risk.courseColor, borderLeftWidth: '3px' }}
              >
                {risk.courseCode}
              </button>
            ))}
            {courseRisks.length > 4 && (
              <span className="px-3 py-1.5 text-xs text-muted-foreground">
                +{courseRisks.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
