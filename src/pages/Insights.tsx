import { useState, useMemo } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { InsightsTabs } from '@/components/insights/InsightsTabs';
import { GradeFlowDiagram } from '@/components/insights/GradeFlowDiagram';
import { InsightsSummaryStats } from '@/components/insights/InsightsSummaryStats';
import { CourseImpactChart } from '@/components/insights/CourseImpactChart';
import { StudyAnalyticsTab } from '@/components/insights/StudyAnalyticsTab';
import { GradePredictionWidget } from '@/components/insights/GradePredictionWidget';
import { ProgressRing } from "@/components/ui/progress-ring";
import { useSemesterStore } from '@/stores/useSemesterStore';
import { useAuth } from '@/hooks/useAuth';
import { calculateCourseGrade, calculateGPA } from '@/lib/gradeUtils';
import { predictAllCourses } from '@/lib/gradePrediction';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { CHART_PALETTE } from '@/lib/chartPalette';

// Mock GPA history data
const gpaHistory = [
  { semester: "Fall '23", gpa: 3.45 },
  { semester: "Spring '24", gpa: 3.52 },
  { semester: "Summer '24", gpa: 3.60 },
  { semester: "Fall '24", gpa: 3.72 },
  { semester: "Spring '25", gpa: 3.68 },
];

export default function Insights() {
  const [activeTab, setActiveTab] = useState('overview');
  const { courses } = useSemesterStore();
  const { profile } = useAuth();
  
  // Calculate predictions
  const predictions = useMemo(() => predictAllCourses(courses), [courses]);
  
  // Calculate metrics from real course data
  const metrics = useMemo(() => {
    if (courses.length === 0) {
      return {
        currentGPA: 3.42,
        targetGPA: profile?.gpa_goal || 3.85,
        averageGrade: 86.2,
        totalCredits: 15,
        courseData: [],
        categoryData: [],
      };
    }

    const courseData = courses.map((course, index) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      grade: calculateCourseGrade(course.assignments),
      credits: course.credits,
      color: course.color,
    }));

    const currentGPA = calculateGPA(courses);
    const averageGrade = courseData.reduce((sum, c) => sum + c.grade, 0) / courseData.length;
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

    // Aggregate assignments by type across all courses
    const assignmentsByType: Record<string, { weight: number; totalScore: number; count: number }> = {};
    
    courses.forEach((course, courseIndex) => {
      course.assignments.forEach((assignment) => {
        const type = assignment.type || 'other';
        if (!assignmentsByType[type]) {
          assignmentsByType[type] = { weight: 0, totalScore: 0, count: 0 };
        }
        assignmentsByType[type].weight += assignment.weight;
        if (assignment.score !== null) {
          assignmentsByType[type].totalScore += assignment.score;
          assignmentsByType[type].count += 1;
        }
      });
    });

    const categoryData = Object.entries(assignmentsByType).map(([type, data], index) => {
      const colors = [...CHART_PALETTE];
      return {
        name: type.charAt(0).toUpperCase() + type.slice(1),
        weight: data.weight,
        performance: data.count > 0 ? data.totalScore / data.count : 85,
        color: colors[index % colors.length],
      };
    });

    return {
      currentGPA,
      targetGPA: profile?.gpa_goal || 3.85,
      averageGrade,
      totalCredits,
      courseData,
      categoryData: categoryData.length > 0 ? categoryData : [
        { name: 'Exams', weight: 40, performance: 82, color: CHART_PALETTE[1] },
        { name: 'Quizzes', weight: 15, performance: 91, color: CHART_PALETTE[0] },
        { name: 'Homework', weight: 20, performance: 95, color: CHART_PALETTE[2] },
        { name: 'Labs', weight: 15, performance: 88, color: CHART_PALETTE[4] },
        { name: 'Projects', weight: 10, performance: 90, color: CHART_PALETTE[3] },
      ],
    };
  }, [courses, profile]);

  // Mock course data if none exists
  const displayCourseData = metrics.courseData.length > 0 ? metrics.courseData : [
    { id: '1', code: 'COP 3530', name: 'Data Structures', grade: 94, credits: 4, color: CHART_PALETTE[1] },
    { id: '2', code: 'QMB 3302', name: 'Business Statistics', grade: 87, credits: 3, color: CHART_PALETTE[0] },
    { id: '3', code: 'ECO 2013', name: 'Macroeconomics', grade: 91, credits: 3, color: CHART_PALETTE[2] },
    { id: '4', code: 'PHI 2010', name: 'Introduction to Philosophy', grade: 88, credits: 3, color: CHART_PALETTE[4] },
  ];

  const totalPointsEarned = metrics.averageGrade;

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground mt-1">Visualize your academic performance</p>
        </div>
        <InsightsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Study Analytics Tab */}
      {activeTab === 'study-analytics' && (
        <StudyAnalyticsTab />
      )}

      {/* Other tabs content */}
      {activeTab !== 'study-analytics' && (
        <>
      {/* Summary Stats Row */}
      <div className="mb-6">
        <InsightsSummaryStats
          currentGPA={metrics.currentGPA}
          targetGPA={metrics.targetGPA}
          averageGrade={metrics.averageGrade}
          semesterCredits={metrics.totalCredits}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Grade Flow Diagram - Takes 2 columns */}
        <div className="lg:col-span-2">
          <GradeFlowDiagram 
            categories={metrics.categoryData}
            totalPointsEarned={totalPointsEarned}
            courses={displayCourseData.map((c, i) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              color: c.color,
              grade: c.grade,
              totalPoints: c.credits * 100,
              categories: metrics.categoryData,
            }))}
          />
        </div>

        {/* Course Impact Chart - Right sidebar */}
        <div className="lg:col-span-1">
          <CourseImpactChart 
            courses={displayCourseData}
            currentGPA={metrics.currentGPA}
          />
        </div>
      </div>

      {/* Second Row - Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* GPA Trend */}
        <div className="insights-widget">
          <div className="insights-widget-header">
            <h3 className="insights-widget-title">GPA TREND</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaHistory}>
                <CartesianGrid strokeDasharray="3 3" className="chart-grid" />
                <XAxis 
                  dataKey="semester" 
                  className="chart-axis"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[3.0, 4.0]} 
                  className="chart-axis"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "var(--glass-bg-solid)",
                    boxShadow: "var(--glass-shadow-elevated)",
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="#14B8A6"
                  strokeWidth={3}
                  dot={{ fill: "#14B8A6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#14B8A6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance by Course */}
        <div className="insights-widget">
          <div className="insights-widget-header">
            <h3 className="insights-widget-title">PERFORMANCE BY COURSE</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayCourseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="chart-grid" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  className="chart-axis"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="code" 
                  className="chart-axis"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "var(--glass-bg-solid)",
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Grade']}
                />
                <Bar 
                  dataKey="grade" 
                  radius={[0, 6, 6, 0]}
                >
                  {displayCourseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grade Predictions Section */}
      <div className="mb-6">
        <GradePredictionWidget predictions={predictions} />
      </div>

      {/* Credits Progress & What-If Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits Earned */}
        <div className="insights-widget">
          <div className="insights-widget-header">
            <h3 className="insights-widget-title">CREDITS EARNED</h3>
          </div>
          <div className="flex justify-center mb-4">
            <ProgressRing progress={75} size={100} strokeWidth={8} color="accent">
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">90</span>
                <p className="text-xs text-muted-foreground">/120</p>
              </div>
            </ProgressRing>
          </div>
          <div className="credits-breakdown">
            <div className="credits-row">
              <span className="credits-category">Core Requirements</span>
              <span className="credits-count">45/48</span>
            </div>
            <div className="credits-row">
              <span className="credits-category">Major Courses</span>
              <span className="credits-count">30/36</span>
            </div>
            <div className="credits-row">
              <span className="credits-category">Electives</span>
              <span className="credits-count">15/36</span>
            </div>
          </div>
        </div>

        {/* What-If Calculator Teaser */}
        <div className="lg:col-span-2 whatif-promo-widget">
          <div className="promo-content">
            <h3 className="promo-title">What-If Calculator</h3>
            <p className="promo-description">
              Curious how your grades might change? Use our what-if calculator to see how different 
              scores could affect your final grade and GPA. Project your semester results before finals!
            </p>
          </div>
          <button className="promo-button">
            Try Calculator
          </button>
        </div>
      </div>
        </>
      )}
    </MainLayout>
  );
}
