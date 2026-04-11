import { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp, Minus, Clock, Target, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { CourseRisk, RiskFactor } from '@/lib/riskAssessment';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RiskBreakdownWidgetProps {
  courseRisks: CourseRisk[];
}

export function RiskBreakdownWidget({ courseRisks }: RiskBreakdownWidgetProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  
  // Summary stats
  const criticalCount = courseRisks.filter(r => r.riskLevel === 'critical').length;
  const highCount = courseRisks.filter(r => r.riskLevel === 'high').length;
  const lowCount = courseRisks.filter(r => r.riskLevel === 'low').length;
  const avgRisk = courseRisks.length > 0 
    ? courseRisks.reduce((sum, r) => sum + r.riskScore, 0) / courseRisks.length 
    : 0;
  
  const getAvgRiskLevel = (score: number): string => {
    if (score >= 70) return 'critical';
    if (score >= 45) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  };
  
  if (courseRisks.length === 0) {
    return null;
  }
  
  return (
    <div className="risk-breakdown-widget">
      <div className="insights-widget-header">
        <h3 className="insights-widget-title">GRADE RISK ASSESSMENT</h3>
        <div className="risk-summary-badges">
          {criticalCount > 0 && (
            <span className="summary-badge critical">
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="summary-badge high">
              {highCount} High Risk
            </span>
          )}
        </div>
      </div>
      
      {/* Risk Overview Cards */}
      <div className="risk-overview-cards">
        <div className="overview-card">
          <span className="overview-label">Average Risk</span>
          <span className={cn("overview-value", getAvgRiskLevel(avgRisk))}>
            {avgRisk.toFixed(0)}%
          </span>
        </div>
        <div className="overview-card">
          <span className="overview-label">Needs Attention</span>
          <span className={cn("overview-value", criticalCount + highCount > 0 ? "attention" : "good")}>
            {criticalCount + highCount}
          </span>
        </div>
        <div className="overview-card">
          <span className="overview-label">On Track</span>
          <span className="overview-value good">
            {lowCount}
          </span>
        </div>
      </div>
      
      {/* Course Risk Cards */}
      <div className="risk-cards-list">
        {courseRisks.map((risk) => (
          <RiskCard 
            key={risk.courseId}
            risk={risk}
            isExpanded={expandedCourse === risk.courseId}
            onToggle={() => setExpandedCourse(
              expandedCourse === risk.courseId ? null : risk.courseId
            )}
          />
        ))}
      </div>
    </div>
  );
}

function RiskCard({ 
  risk, 
  isExpanded, 
  onToggle 
}: { 
  risk: CourseRisk; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const TrendIcon = risk.trend === 'improving' ? TrendingUp : 
                    risk.trend === 'declining' ? TrendingDown : Minus;
  
  return (
    <div className={cn("risk-card", risk.riskLevel)}>
      {/* Card Header */}
      <div className="risk-card-header" onClick={onToggle}>
        <div className="header-left">
          <span 
            className="course-color-dot" 
            style={{ background: risk.courseColor }}
          />
          <div className="course-info">
            <span className="course-code">{risk.courseCode}</span>
            <span className="course-name">{risk.courseName}</span>
          </div>
        </div>
        
        <div className="header-right">
          {/* Risk Meter */}
          <div className="risk-meter-container">
            <div className="risk-meter-track">
              <div 
                className={cn("risk-meter-fill", risk.riskLevel)}
                style={{ width: `${risk.riskScore}%` }}
              />
            </div>
            <span className="risk-percentage">{risk.riskScore}%</span>
          </div>
          
          {/* Risk Badge */}
          <span className={cn("risk-badge", risk.riskLevel)}>
            {risk.riskLevel === 'critical' && (
              <><AlertTriangle className="w-3 h-3" /> CRITICAL</>
            )}
            {risk.riskLevel === 'high' && (
              <><AlertTriangle className="w-3 h-3" /> HIGH</>
            )}
            {risk.riskLevel === 'medium' && (
              <><Info className="w-3 h-3" /> MEDIUM</>
            )}
            {risk.riskLevel === 'low' && (
              <><CheckCircle className="w-3 h-3" /> LOW</>
            )}
          </span>
          
          {/* Trend */}
          <div className={cn("trend-indicator", risk.trend)}>
            <TrendIcon className="w-4 h-4" />
          </div>
          
          {/* Expand/Collapse */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Primary Concern */}
      <div className="primary-concern">
        <span>{risk.primaryConcern}</span>
        {risk.daysUntilNextDeadline !== null && risk.daysUntilNextDeadline <= 7 && risk.daysUntilNextDeadline >= 0 && (
          <span className="deadline-badge">
            <Clock className="w-3 h-3" />
            {risk.daysUntilNextDeadline === 0 ? 'Due today' :
             risk.daysUntilNextDeadline === 1 ? 'Due tomorrow' :
             `${risk.daysUntilNextDeadline} days`}
          </span>
        )}
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="risk-card-details">
          {/* Risk Factors */}
          {risk.factors.length > 0 && (
            <div className="factors-section">
              <div className="section-title">
                <AlertTriangle className="w-4 h-4" />
                Risk Factors
              </div>
              <div className="factors-list">
                {risk.factors.map((factor, index) => (
                  <div key={index} className="factor-row">
                    <div className="factor-info">
                      <span className="factor-name">{factor.name}</span>
                      <span className="factor-description">{factor.description}</span>
                    </div>
                    <div className="factor-impact">
                      <div className="impact-bar">
                        <div 
                          className="impact-fill"
                          style={{ width: `${factor.impact}%` }}
                        />
                      </div>
                      <span className="impact-value">+{factor.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendation */}
          <div className="recommendation-section">
            <div className="section-title">
              <Target className="w-4 h-4" />
              Recommendation
            </div>
            <p className="recommendation-text">{risk.recommendation}</p>
          </div>
          
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{risk.upcomingWeight.toFixed(0)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Trend</span>
              <span className={cn("stat-value trend", risk.trend)}>
                {risk.trend === 'improving' && '📈 Improving'}
                {risk.trend === 'stable' && '➡️ Stable'}
                {risk.trend === 'declining' && '📉 Declining'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Next Deadline</span>
              <span className="stat-value">
                {risk.daysUntilNextDeadline === null ? 'None' :
                 risk.daysUntilNextDeadline === 0 ? 'Today' :
                 risk.daysUntilNextDeadline === 1 ? 'Tomorrow' :
                 risk.daysUntilNextDeadline < 0 ? 'Overdue' :
                 `${risk.daysUntilNextDeadline} days`}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="card-actions">
            <Link 
              to={`/courses/${risk.courseId}`}
              className="action-btn primary"
            >
              <BookOpen className="w-4 h-4" />
              View Course
            </Link>
            <Link 
              to={`/courses/${risk.courseId}?tab=whatif`}
              className="action-btn secondary"
            >
              <Target className="w-4 h-4" />
              What Do I Need?
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
