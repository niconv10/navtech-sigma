import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { CourseRisk } from '@/lib/riskAssessment';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  risk: CourseRisk;
  showDetails?: boolean;
}

export function RiskBadge({ risk, showDetails = false }: RiskBadgeProps) {
  return (
    <div className={cn("course-risk-badge", risk.riskLevel)}>
      <div className="badge-main">
        {risk.riskLevel === 'critical' && <AlertTriangle className="w-4 h-4" />}
        {risk.riskLevel === 'high' && <AlertTriangle className="w-4 h-4" />}
        {risk.riskLevel === 'medium' && <Info className="w-4 h-4" />}
        {risk.riskLevel === 'low' && <CheckCircle className="w-4 h-4" />}
        
        <span className="badge-text">
          {risk.riskLevel.toUpperCase()} RISK
        </span>
        <span className="badge-score">{risk.riskScore}%</span>
      </div>
      
      {showDetails && risk.riskLevel !== 'low' && (
        <div className="badge-detail">
          {risk.primaryConcern}
        </div>
      )}
    </div>
  );
}
