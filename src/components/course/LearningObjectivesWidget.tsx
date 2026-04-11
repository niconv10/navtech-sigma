import { Target, Check } from "lucide-react";

interface LearningObjectivesWidgetProps {
  objectives: string[];
}

export function LearningObjectivesWidget({ objectives }: LearningObjectivesWidgetProps) {
  if (!objectives || objectives.length === 0) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="course-widget-title">Learning Objectives</span>
        </div>
        <span className="text-xs text-muted-foreground">{objectives.length} objectives</span>
      </div>
      <div className="px-5 pb-5">
        <ul className="space-y-2">
          {objectives.map((objective, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
