import { 
  Clock, 
  Calendar, 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  Star, 
  AlertTriangle,
  Users,
  Check,
  X,
  FileText
} from "lucide-react";
import type { CoursePolicies } from "@/types";

interface PoliciesWidgetProps {
  policies: CoursePolicies | Record<string, any>;
}

function PolicyItem({ 
  icon: Icon, 
  title, 
  allowed, 
  details 
}: { 
  icon: React.ElementType; 
  title: string; 
  allowed: boolean; 
  details?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
      <div className={`p-1.5 rounded ${allowed ? 'bg-success/20' : 'bg-error/20'}`}>
        <Icon className={`w-4 h-4 ${allowed ? 'text-success' : 'text-error'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {allowed ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <X className="w-3.5 h-3.5 text-error" />
          )}
        </div>
        {details && (
          <p className="text-xs text-muted-foreground mt-1">{details}</p>
        )}
      </div>
    </div>
  );
}

// Helper to check if policies is in the new structured format
function isStructuredPolicies(policies: any): policies is CoursePolicies {
  return policies?.lateWork && typeof policies.lateWork === 'object' && 'accepted' in policies.lateWork;
}

export function PoliciesWidget({ policies }: PoliciesWidgetProps) {
  if (!policies || Object.keys(policies).length === 0) {
    return null;
  }

  // Handle legacy flat format (string values)
  if (!isStructuredPolicies(policies)) {
    const entries = Object.entries(policies).filter(([_, value]) => {
      if (!value) return false;
      if (typeof value === 'string') return true;
      if (typeof value === 'object') return true;
      return false;
    });
    if (entries.length === 0) return null;

    const renderValue = (value: unknown): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        // Try common fields
        if (obj.details) return String(obj.details);
        if (obj.description) return String(obj.description);
        // Fallback: join string values
        return Object.entries(obj)
          .filter(([_, v]) => typeof v === 'string' || typeof v === 'boolean')
          .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}`)
          .join(' • ') || '';
      }
      return String(value);
    };

    return (
      <div className="glass-widget">
        <div className="course-widget-header px-5 pt-5">
          <span className="course-widget-title">Course Policies</span>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{renderValue(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle new structured format
  const hasPolicies = policies.lateWork || policies.attendance || 
    policies.makeupExams || policies.dropPolicy || 
    policies.curvePolicy || policies.extraCredit || 
    policies.mustPass || policies.participation;

  if (!hasPolicies) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Course Policies</span>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {policies.lateWork && (
          <PolicyItem
            icon={Clock}
            title="Late Work"
            allowed={policies.lateWork.accepted}
            details={policies.lateWork.details || policies.lateWork.penalty}
          />
        )}

        {policies.attendance && (
          <PolicyItem
            icon={Calendar}
            title="Attendance"
            allowed={!policies.attendance.required || !policies.attendance.impactsGrade}
            details={policies.attendance.details}
          />
        )}

        {policies.makeupExams && (
          <PolicyItem
            icon={RefreshCw}
            title="Makeup Exams"
            allowed={policies.makeupExams.allowed}
            details={policies.makeupExams.conditions}
          />
        )}

        {policies.dropPolicy?.exists && (
          <PolicyItem
            icon={Trash2}
            title="Drop Lowest"
            allowed={true}
            details={policies.dropPolicy.details}
          />
        )}

        {policies.curvePolicy?.exists && (
          <PolicyItem
            icon={TrendingUp}
            title="Grade Curve"
            allowed={true}
            details={policies.curvePolicy.details}
          />
        )}

        {policies.extraCredit && (
          <PolicyItem
            icon={Star}
            title="Extra Credit"
            allowed={policies.extraCredit.available}
            details={policies.extraCredit.details}
          />
        )}

        {policies.mustPass?.exists && (
          <PolicyItem
            icon={AlertTriangle}
            title="Must Pass Requirement"
            allowed={false}
            details={policies.mustPass.requirement}
          />
        )}

        {policies.participation && (
          <PolicyItem
            icon={Users}
            title="Participation"
            allowed={true}
            details={policies.participation.details}
          />
        )}
      </div>
    </div>
  );
}
