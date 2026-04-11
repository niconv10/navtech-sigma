import type { Course } from "@/types";

interface ClassScheduleWidgetProps {
  schedule: Course["schedule"];
}

export function ClassScheduleWidget({ schedule }: ClassScheduleWidgetProps) {
  if (!schedule || !schedule.days || schedule.days.length === 0) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Class Schedule</span>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-1">
          {schedule.days.map((day, index) => (
            <div 
              key={day} 
              className={`flex items-center justify-between py-2 ${
                index !== schedule.days!.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <span className="text-sm font-medium text-foreground">{day}</span>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">
                  {schedule.startTime} - {schedule.endTime}
                </span>
                {schedule.location && (
                  <p className="text-xs text-muted-foreground">{schedule.location}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
