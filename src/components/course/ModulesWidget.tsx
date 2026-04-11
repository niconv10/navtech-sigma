import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, FileText, ClipboardList } from "lucide-react";
import type { CourseModule } from "@/types";

interface ModulesWidgetProps {
  modules: CourseModule[];
}

function ModuleItem({ module }: { module: CourseModule }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasTopics = module.topics && module.topics.length > 0;
  const hasReadings = module.readings && module.readings.length > 0;
  const hasAssignments = module.assignments && module.assignments.length > 0;
  const hasDetails = hasTopics || hasReadings || hasAssignments;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
            {module.number}
          </span>
          <span className="text-sm font-medium text-foreground text-left">{module.title}</span>
        </div>
        {hasDetails && (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )
        )}
      </button>
      
      {isExpanded && hasDetails && (
        <div className="p-3 space-y-3 bg-background">
          {/* Topics */}
          {hasTopics && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Topics</span>
              </div>
              <ul className="space-y-1 pl-5">
                {module.topics!.map((topic, idx) => (
                  <li key={idx} className="text-xs text-foreground list-disc">{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Readings */}
          {hasReadings && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Readings</span>
              </div>
              <ul className="space-y-1 pl-5">
                {module.readings!.map((reading, idx) => (
                  <li key={idx} className="text-xs text-foreground list-disc">{reading}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Assignments */}
          {hasAssignments && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Assignments</span>
              </div>
              <ul className="space-y-1 pl-5">
                {module.assignments!.map((assignment, idx) => (
                  <li key={idx} className="text-xs text-foreground list-disc">{assignment}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ModulesWidget({ modules }: ModulesWidgetProps) {
  if (!modules || modules.length === 0) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Course Modules</span>
        <span className="text-xs text-muted-foreground">{modules.length} modules</span>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {modules.map((module, idx) => (
          <ModuleItem key={idx} module={module} />
        ))}
      </div>
    </div>
  );
}
