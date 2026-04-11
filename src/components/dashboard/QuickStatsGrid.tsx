interface QuickStatsGridProps {
  coursesOnTrack: number;
  totalCourses: number;
  totalCredits: number;
}

export function QuickStatsGrid({ 
  coursesOnTrack, 
  totalCourses, 
  totalCredits 
}: QuickStatsGridProps) {
  return (
    <div className="quick-stats-grid">
      <div className="quick-stat-card">
        <span className="quick-stat-value success">{coursesOnTrack}</span>
        <span className="quick-stat-label">On Track</span>
      </div>
      <div className="quick-stat-card">
        <span className="quick-stat-value">{totalCourses}</span>
        <span className="quick-stat-label">Courses</span>
      </div>
      <div className="quick-stat-card">
        <span className="quick-stat-value">{totalCredits}</span>
        <span className="quick-stat-label">Credits</span>
      </div>
    </div>
  );
}
