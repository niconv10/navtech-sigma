import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO, isBefore, isAfter, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

interface Assignment {
  id?: string;
  name: string;
  dueDate?: string | null;
  weight: number;
  courseCode: string;
  courseColor: string;
  courseName?: string;
  points?: number;
}

interface WorkloadCalendarWidgetProps {
  assignments: Assignment[];
}

export function WorkloadCalendarWidget({ assignments }: WorkloadCalendarWidgetProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(true);

  // Get assignments for the current month
  const monthAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = parseISO(a.dueDate);
      return isSameMonth(dueDate, currentMonth);
    });
  }, [assignments, currentMonth]);

  // Get upcoming assignments (next 30 days, sorted by date)
  const upcomingAssignments = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    
    return assignments
      .filter(a => {
        if (!a.dueDate) return false;
        const dueDate = parseISO(a.dueDate);
        return isAfter(dueDate, today) && isBefore(dueDate, thirtyDaysFromNow);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.dueDate!);
        const dateB = parseISO(b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }, [assignments]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Pad the beginning with empty days to align with week
    const startDay = monthStart.getDay();
    const paddedDays = Array(startDay).fill(null).concat(days);
    
    return paddedDays;
  }, [currentMonth]);

  // Get assignments for a specific day
  const getAssignmentsForDay = (day: Date) => {
    return assignments.filter(a => {
      if (!a.dueDate) return false;
      return isSameDay(parseISO(a.dueDate), day);
    });
  };

  // Check if a day is urgent (assignment due within 7 days)
  const isDayUrgent = (dueDate: string): boolean => {
    const due = parseISO(dueDate);
    const today = new Date();
    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil > 0;
  };

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="glass-widget overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 sm:px-6 sm:py-4 ${isOpen ? 'border-b border-border' : ''} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="calendar-header-nav">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="calendar-nav-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="calendar-month-title">
              Workload in {format(currentMonth, "MMMM")}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="calendar-nav-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/courses/upload")}
            className="calendar-nav-btn"
          >
            <Plus className="w-4 h-4" />
          </button>
          <CollapsibleTrigger asChild>
            <button className="p-1 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
            </button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
      {/* Content - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        {/* Calendar Grid */}
        <div className="p-6 lg:border-r border-border">
          {/* Assignment count */}
          <div className="mb-4">
            <span className="text-2xl font-light text-foreground">{monthAssignments.length}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {monthAssignments.length === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="bg-background/50 min-h-[60px]" />;
              }
              
              const dayAssignments = getAssignmentsForDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day-cell bg-background/50 ${isCurrentDay ? 'today' : ''}`}
                >
                  <span className={`calendar-day-number ${isCurrentDay ? 'today' : ''}`}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Assignment dots */}
                  {dayAssignments.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {dayAssignments.slice(0, 3).map((a, i) => (
                        <div
                          key={`${a.id || a.name}-${i}`}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: a.courseColor }}
                          title={`${a.name} (${a.courseCode})`}
                        />
                      ))}
                      {dayAssignments.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{dayAssignments.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Assignments Sidebar */}
        <div className="p-5 hidden lg:block">
          <h3 className="widget-title mb-4">Upcoming Assignments</h3>
          
          {upcomingAssignments.length > 0 ? (
            <div className="upcoming-list">
              {upcomingAssignments.map((assignment, index) => {
                const dueDate = parseISO(assignment.dueDate!);
                const isUrgent = isDayUrgent(assignment.dueDate!);
                
                return (
                  <div key={assignment.id || `${assignment.name}-${index}`} className="upcoming-item">
                    <div 
                      className={`upcoming-date-box ${isUrgent ? 'urgent' : ''}`}
                      style={{ 
                        borderLeftColor: assignment.courseColor,
                        borderLeftWidth: '3px'
                      }}
                    >
                      <span className="upcoming-date-day">{format(dueDate, "d")}</span>
                      <span className="upcoming-date-month">{format(dueDate, "MMM")}</span>
                    </div>
                    
                    <div className="upcoming-info">
                      <span className="upcoming-name">{assignment.name}</span>
                      <span className="upcoming-course">{assignment.courseCode}</span>
                    </div>
                    
                    <span className="upcoming-points">{assignment.weight}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No upcoming assignments in the next 30 days
              </p>
            </div>
          )}
          
          {upcomingAssignments.length > 0 && (
            <button
              onClick={() => navigate("/calendar")}
              className="w-full mt-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all →
            </button>
          )}
        </div>
      </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
