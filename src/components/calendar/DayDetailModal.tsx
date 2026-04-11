import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getCategoryIcon, categorizeAssignment } from "@/lib/assignmentUtils";
import { hexToRgba } from "@/lib/courseColors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Assignment {
  id: string | number;
  name: string;
  course: string;
  color: string;
  date: Date;
  weight?: number;
  type?: string;
  time?: string;
}

interface DayDetailModalProps {
  date: Date;
  assignments: Assignment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DayDetailModal({ date, assignments, open, onOpenChange }: DayDetailModalProps) {
  const totalPoints = assignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  const formattedPoints = Math.round(totalPoints * 100) / 100;
  const displayPoints = formattedPoints % 1 === 0 ? formattedPoints.toString() : formattedPoints.toFixed(2).replace(/\.?0+$/, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/6 max-w-md">
        <DialogHeader>
          <DialogTitle className="widget-title">
            Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Widget */}
          <div className="bg-white/2 rounded-2xl p-6 text-center border border-white/6">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              {format(date, "MMMM")}
            </p>
            <p className="text-6xl font-bold text-foreground my-2">
              {format(date, "d")}
            </p>
            <p className="text-lg font-semibold text-cyan-400">
              {displayPoints} pts
            </p>
          </div>

          {/* Assignments List */}
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const type = assignment.type || categorizeAssignment(assignment.name);
                const Icon = getCategoryIcon(type as any);
                
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-4 bg-white/2 rounded-xl border border-white/6"
                  >
                    {/* Icon - use course color */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: hexToRgba(assignment.color, 0.2),
                        color: assignment.color
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {assignment.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.course}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-cyan-400">
                        {assignment.weight || 0} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No assignments due this day</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
