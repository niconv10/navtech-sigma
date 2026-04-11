import { GitBranch, AlertTriangle, Lightbulb } from "lucide-react";
import type { Prerequisites } from "@/types";

interface PrerequisitesWidgetProps {
  prerequisites: Prerequisites;
}

export function PrerequisitesWidget({ prerequisites }: PrerequisitesWidgetProps) {
  const hasRequired = prerequisites.required && prerequisites.required.length > 0;
  const hasCoreqs = prerequisites.corequisites && prerequisites.corequisites.length > 0;
  const hasRecommended = prerequisites.recommended && prerequisites.recommended.length > 0;

  if (!hasRequired && !hasCoreqs && !hasRecommended) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="course-widget-title">Prerequisites</span>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {/* Required Prerequisites */}
        {hasRequired && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-error" />
              <span className="text-xs text-error font-medium">Required</span>
            </div>
            <div className="space-y-1">
              {prerequisites.required!.map((prereq, idx) => (
                <div key={idx} className="p-2 bg-error/10 border border-error/20 rounded text-sm text-foreground">
                  {prereq}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corequisites */}
        {hasCoreqs && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs text-warning font-medium">Corequisites</span>
            </div>
            <div className="space-y-1">
              {prerequisites.corequisites!.map((coreq, idx) => (
                <div key={idx} className="p-2 bg-warning/10 border border-warning/20 rounded text-sm text-foreground">
                  {coreq}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended */}
        {hasRecommended && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Recommended</span>
            </div>
            <div className="space-y-1">
              {prerequisites.recommended!.map((rec, idx) => (
                <div key={idx} className="p-2 bg-primary/10 border border-primary/20 rounded text-sm text-foreground">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
