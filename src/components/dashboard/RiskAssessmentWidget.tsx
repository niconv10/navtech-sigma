import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, ChevronRight, Minus } from 'lucide-react';
import { CourseRisk } from '@/lib/riskAssessment';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RiskAssessmentWidgetProps {
  courseRisks: CourseRisk[];
  compact?: boolean;
}

export function RiskAssessmentWidget({ courseRisks, compact = false }: RiskAssessmentWidgetProps) {
  // Filter to show only concerning courses (medium+), or top 4
  const concerningCourses = courseRisks.filter(r => r.riskLevel !== 'low');
  const displayCourses = compact 
    ? courseRisks.slice(0, 3) 
    : concerningCourses.length > 0 ? concerningCourses : courseRisks.slice(0, 4);
  
  const hasCritical = courseRisks.some(r => r.riskLevel === 'critical');
  const hasHigh = courseRisks.some(r => r.riskLevel === 'high');
  
  if (courseRisks.length === 0) {
    return null;
  }
  
  return (
    <div className={cn(
      "risk-assessment-widget",
      hasCritical && "has-critical",
      hasHigh && !hasCritical && "has-high"
    )}>
      <div className="widget-header">
        <div className="header-left">
          <h3 className="widget-title">GRADE RISK ASSESSMENT</h3>
          {hasCritical && (
            <span className="alert-badge critical">
              <AlertTriangle className="w-3 h-3" />
              Action Required
            </span>
          )}
        </div>
        <Link to="/insights" className="widget-action">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="risk-list">
        {displayCourses.map((risk) => (
          <RiskCourseRow key={risk.courseId} risk={risk} />
        ))}
      </div>
      
      {concerningCourses.length === 0 && (
        <div className="all-clear-message">
          <CheckCircle className="check-icon" />
          All courses are on track!
        </div>
      )}
    </div>
  );
}

function RiskCourseRow({ risk }: { risk: CourseRisk }) {
  const TrendIcon = risk.trend === 'improving' ? TrendingUp : 
                    risk.trend === 'declining' ? TrendingDown : Minus;
  
  return (
    <Link 
      to={`/courses/${risk.courseId}`}
      className={cn("risk-row", risk.riskLevel)}
    >
      <div className="risk-row-left">
        <div className="course-indicator">
          <span 
            className="course-color-bar" 
            style={{ background: risk.courseColor }}
          />
          <span className="course-code">{risk.courseCode}</span>
        </div>
        <span className="risk-concern">{risk.primaryConcern}</span>
      </div>
      
      <div className="risk-row-right">
        <div className="risk-meter">
          <div 
            className={cn("risk-meter-fill", risk.riskLevel)}
            style={{ width: `${risk.riskScore}%` }}
          />
        </div>
        <span className={cn("risk-score", risk.riskLevel)}>
          {risk.riskScore}%
        </span>
        <span className={cn("risk-level-badge", risk.riskLevel)}>
          {risk.riskLevel === 'critical' && '🔴 CRITICAL'}
          {risk.riskLevel === 'high' && '🟠 HIGH'}
          {risk.riskLevel === 'medium' && '🟡 MEDIUM'}
          {risk.riskLevel === 'low' && '🟢 LOW'}
        </span>
        <TrendIcon 
          className={cn("trend-icon", risk.trend)} 
          size={16} 
        />
      </div>
    </Link>
  );
}
