import { Calendar, AlertCircle, Umbrella, GraduationCap } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ImportantDates, FinalExam } from "@/types";

interface ImportantDatesWidgetProps {
  importantDates: ImportantDates;
  finalExam?: FinalExam;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function ImportantDatesWidget({ importantDates, finalExam }: ImportantDatesWidgetProps) {
  const hasAnyDates = importantDates.firstDay || importantDates.lastDay || 
    importantDates.lastDayToDrop || importantDates.withdrawalDeadline ||
    importantDates.springBreak || importantDates.finalExamDate ||
    (importantDates.holidays && importantDates.holidays.length > 0) ||
    finalExam?.date;

  if (!hasAnyDates) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="course-widget-title">Important Dates</span>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {/* First/Last Day */}
        {(importantDates.firstDay || importantDates.lastDay) && (
          <div className="grid grid-cols-2 gap-3">
            {importantDates.firstDay && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-xs text-success font-medium">First Day</p>
                <p className="text-sm text-foreground mt-1">{formatDate(importantDates.firstDay)}</p>
              </div>
            )}
            {importantDates.lastDay && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-xs text-error font-medium">Last Day</p>
                <p className="text-sm text-foreground mt-1">{formatDate(importantDates.lastDay)}</p>
              </div>
            )}
          </div>
        )}

        {/* Drop & Withdrawal Deadlines */}
        {(importantDates.lastDayToDrop || importantDates.withdrawalDeadline) && (
          <div className="space-y-2">
            {importantDates.lastDayToDrop && (
              <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">Drop Deadline</span>
                </div>
                <span className="text-sm font-medium text-foreground">{formatDate(importantDates.lastDayToDrop)}</span>
              </div>
            )}
            {importantDates.withdrawalDeadline && (
              <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">Withdrawal Deadline</span>
                </div>
                <span className="text-sm font-medium text-foreground">{formatDate(importantDates.withdrawalDeadline)}</span>
              </div>
            )}
          </div>
        )}

        {/* Spring Break */}
        {importantDates.springBreak && (
          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Umbrella className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Spring Break</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {typeof importantDates.springBreak === 'object' && importantDates.springBreak !== null
                ? `${formatDate((importantDates.springBreak as any).start)} – ${formatDate((importantDates.springBreak as any).end)}`
                : String(importantDates.springBreak)}
            </span>
          </div>
        )}

        {/* Final Exam */}
        {(importantDates.finalExamDate || finalExam?.date) && (
          <div className="p-3 bg-secondary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Final Exam</span>
            </div>
            <p className="text-sm text-foreground">{formatDate(importantDates.finalExamDate || finalExam?.date)}</p>
            {finalExam?.time && <p className="text-xs text-muted-foreground mt-1">{finalExam.time}</p>}
            {finalExam?.location && <p className="text-xs text-muted-foreground">{finalExam.location}</p>}
          </div>
        )}

        {/* Holidays */}
        {importantDates.holidays && importantDates.holidays.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Holidays</p>
            <div className="flex flex-wrap gap-2">
              {importantDates.holidays.map((holiday, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded text-foreground">
                  {typeof holiday === 'object' && holiday !== null
                    ? `${(holiday as any).name || ''}${(holiday as any).date ? ` (${formatDate((holiday as any).date)})` : ''}`
                    : String(holiday)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
