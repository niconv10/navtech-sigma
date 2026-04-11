import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CourseData {
  id: string;
  code: string;
  name: string;
  grade: number;
  credits: number;
  color: string;
}

interface CourseImpactChartProps {
  courses: CourseData[];
  currentGPA: number;
}

export function CourseImpactChart({ courses, currentGPA }: CourseImpactChartProps) {
  // Calculate weight based on credits
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  
  const chartData = courses.map(course => ({
    name: course.code,
    value: course.credits,
    color: course.color,
    grade: course.grade,
  }));

  return (
    <div className="insights-widget h-full">
      <div className="insights-widget-header">
        <h3 className="insights-widget-title">COURSE IMPACT</h3>
      </div>
      
      {/* Donut Chart with GPA in center */}
      <div className="relative h-48 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center GPA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{currentGPA.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">This semester</span>
        </div>
      </div>
      
      {/* Course List */}
      <div className="mt-6 space-y-3">
        {courses.map((course) => {
          const weightPercent = ((course.credits / totalCredits) * 100).toFixed(0);
          
          return (
            <div key={course.id} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: course.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">
                    {course.code}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {course.grade.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {course.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {weightPercent}% weight
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
