import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { isSameDay, isSameMonth, format, differenceInDays } from "date-fns";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { TodayWidget } from "@/components/calendar/TodayWidget";
import { SyncStatusWidget } from "@/components/calendar/SyncStatusWidget";
import { NotificationsWidget } from "@/components/calendar/NotificationsWidget";
import { MonthSummaryWidget } from "@/components/calendar/MonthSummaryWidget";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";
import { AddEventModal } from "@/components/calendar/AddEventModal";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { useCourses } from "@/hooks/useCourses";
import { getColorByIndex, hexToRgba, LEGACY_DEFAULT_COURSE_COLOR } from "@/lib/courseColors";
import { categorizeAssignment, getCategoryIcon } from "@/lib/assignmentUtils";
import { Plus, Settings, MoreVertical, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IcsImportModal } from "@/components/calendar/IcsImportModal";

// No sample data - only show real assignments from database

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [modalOpen, setModalOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [icsImportOpen, setIcsImportOpen] = useState(false);

  const { courses: storeCourses, activeSemesterId } = useSemesterStore();
  
  // Fetch courses from database and sync to store
  const { refetch } = useCourses();
  
  // Refetch when component mounts to ensure fresh data
  useEffect(() => {
    refetch();
  }, []);
  
  // Get courses for active semester (or all if no semester filter)
  const courses = storeCourses.filter((c) => 
    !activeSemesterId || c.semesterId === activeSemesterId || c.semesterId === 'fall-2025'
  );

  // Get real assignments from courses
  const realAssignments = courses.flatMap((c, courseIndex) =>
    c.assignments
      .filter(a => a.dueDate)
      .map((a) => ({
        id: a.id,
        name: a.name,
        course: c.code,
        color: c.color && c.color !== LEGACY_DEFAULT_COURSE_COLOR ? c.color : getColorByIndex(courseIndex),
        date: new Date(a.dueDate!),
        time: "11:59 PM",
        weight: a.weight || 100,
        type: a.type,
      }))
  );

  // Only use real assignments from database
  const assignments = realAssignments;

  const getAssignmentsForDate = (date: Date) => 
    assignments.filter((a) => isSameDay(a.date, date));

  const selectedDateAssignments = getAssignmentsForDate(selectedDate);

  // Calculate this month stats
  const thisMonthAssignments = assignments.filter(a => isSameMonth(a.date, currentMonth));
  const examCount = thisMonthAssignments.filter(a => {
    const type = a.type || categorizeAssignment(a.name);
    return type === 'exam';
  }).length;

  // Today's assignments
  const todayAssignments = getAssignmentsForDate(new Date());

  // Upcoming assignments (sorted, next 6)
  const today = new Date();
  const upcomingAssignments = assignments
    .filter((a) => a.date >= today || isSameDay(a.date, today))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    const dayAssignments = getAssignmentsForDate(date);
    if (dayAssignments.length > 0) {
      setModalOpen(true);
    }
  };

  const getCountdownText = (date: Date) => {
    const days = differenceInDays(date, today);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `in ${days} days`;
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="calendar-page-header">
        <div>
          <h1 className="calendar-page-title">Calendar</h1>
          <p className="calendar-page-subtitle">Track your assignments and deadlines</p>
        </div>
        <div className="calendar-header-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIcsImportOpen(true)}
            className="text-xs gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import .ics
          </Button>
          <Button
            className="add-event-btn"
            onClick={() => setAddEventOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
          <Button variant="ghost" className="settings-btn">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="calendar-page-grid">
        {/* Left Column - Main Content */}
        <div className="calendar-main-column">
          {/* Calendar Grid */}
          <CalendarGrid
            assignments={assignments}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          {/* Month Summary */}
          <MonthSummaryWidget
            month={currentMonth}
            assignments={thisMonthAssignments}
            examCount={examCount}
          />

          {/* Upcoming Assignments */}
          <div className="calendar-widget">
            <div className="calendar-widget-header">
              <span className="calendar-widget-title">Upcoming</span>
              <Button variant="ghost" size="sm" className="view-all-btn">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="upcoming-content">
              {upcomingAssignments.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No upcoming assignments</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                      Add due dates to your assignments in each course, or click{" "}
                      <button
                        className="text-primary underline-offset-2 hover:underline"
                        onClick={() => setAddEventOpen(true)}
                      >
                        Add Event
                      </button>{" "}
                      to add one now.
                    </p>
                  </div>
                </div>
              )}
              {upcomingAssignments.map((assignment) => {
                const type = assignment.type || categorizeAssignment(assignment.name);
                const Icon = getCategoryIcon(type as any);
                
                return (
                  <div key={assignment.id} className="upcoming-item">
                    {/* Use course color for icons */}
                    <div 
                      className="upcoming-item-icon"
                      style={{ 
                        backgroundColor: hexToRgba(assignment.color, 0.15),
                        color: assignment.color
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="upcoming-item-info">
                      <p className="upcoming-item-title">{assignment.name}</p>
                      <p className="upcoming-item-meta">
                        {assignment.course} • Due {format(assignment.date, "MMM d")}
                      </p>
                      <p className="upcoming-item-countdown">{getCountdownText(assignment.date)}</p>
                    </div>
                    <div className="upcoming-item-right">
                      <p className="upcoming-item-points">{assignment.weight} pts</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="upcoming-item-menu">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="calendar-sidebar-column">
          {/* Today Widget */}
          <TodayWidget assignmentsToday={todayAssignments.length} />

          {/* Sync Status */}
          <SyncStatusWidget />

          {/* Notifications */}
          <NotificationsWidget />
        </div>
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        date={selectedDate}
        assignments={selectedDateAssignments}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Add Event Modal */}
      <AddEventModal
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        courses={courses.map(c => ({ id: c.id, name: c.name, code: c.code }))}
      />

      {/* .ics Import Modal */}
      <IcsImportModal
        open={icsImportOpen}
        onOpenChange={setIcsImportOpen}
        courses={courses}
      />
    </MainLayout>
  );
}
