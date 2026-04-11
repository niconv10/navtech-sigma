import { useMemo } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  FlaskConical, 
  ClipboardCheck, 
  UserCheck,
  FileText,
  FolderKanban,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";
import { formatAssignmentType } from "@/lib/gradeUtils";
import type { Assignment, AssignmentType } from "@/types";

interface GradeWeightWidgetProps {
  assignments: Assignment[];
  courseColor: string;
}

const TYPE_ICONS: Record<AssignmentType, React.ElementType> = {
  exam: GraduationCap,
  homework: BookOpen,
  lab: FlaskConical,
  quiz: ClipboardCheck,
  participation: UserCheck,
  paper: FileText,
  project: FolderKanban,
  discussion: MessageSquare,
  presentation: UserCheck,
  midterm: GraduationCap,
  final: GraduationCap,
  other: MoreHorizontal,
};

export function GradeWeightWidget({ assignments, courseColor }: GradeWeightWidgetProps) {
  const weightByType = useMemo(() => {
    const grouped: Record<string, { weight: number; graded: number; total: number; avgScore: number }> = {};
    
    assignments.forEach(a => {
      if (!grouped[a.type]) {
        grouped[a.type] = { weight: 0, graded: 0, total: 0, avgScore: 0 };
      }
      grouped[a.type].weight += a.weight;
      grouped[a.type].total += 1;
      if (a.score !== null) {
        grouped[a.type].graded += 1;
        grouped[a.type].avgScore += a.score;
      }
    });

    // Calculate averages
    Object.keys(grouped).forEach(type => {
      if (grouped[type].graded > 0) {
        grouped[type].avgScore = grouped[type].avgScore / grouped[type].graded;
      }
    });

    return grouped;
  }, [assignments]);

  const sortedTypes = useMemo(() => 
    Object.entries(weightByType).sort((a, b) => b[1].weight - a[1].weight),
    [weightByType]
  );

  const totalWeight = useMemo(() => 
    assignments.reduce((sum, a) => sum + a.weight, 0),
    [assignments]
  );

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Grade Weight Breakdown</span>
      </div>
      <div className="px-5 pb-5">
        <div>
          {sortedTypes.map(([type, data], index) => {
            const Icon = TYPE_ICONS[type as AssignmentType] || MoreHorizontal;
            const isLast = index === sortedTypes.length - 1;
            
            return (
              <div 
                key={type} 
                className={`py-4 ${!isLast ? 'border-b border-border/50' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {formatAssignmentType(type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({data.graded}/{data.total})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">{data.weight.toFixed(0)}%</span>
                    {data.graded > 0 && (
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {data.avgScore.toFixed(0)}% avg
                      </span>
                    )}
                  </div>
                </div>
                {/* Progress bar showing weight percentage */}
                <div className="h-1 bg-border/50 rounded-full overflow-hidden dark:bg-white/10">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${data.weight}%`,
                      backgroundColor: courseColor
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Total */}
        <div className="mt-4 pt-4 border-t border-border/50 dark:border-white/[0.06] flex justify-between text-sm">
          <span className="text-muted-foreground">Total Weight</span>
          <span className={`font-semibold ${totalWeight === 100 ? 'text-success' : 'text-warning'}`}>
            {totalWeight.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
