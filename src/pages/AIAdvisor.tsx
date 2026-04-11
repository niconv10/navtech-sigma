import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles, Calendar, Target, TrendingUp, Clock,
  AlertTriangle, Lightbulb, CheckCircle, ChevronDown,
  BookOpen, MessageCircle, Filter, Info, ExternalLink,
  Brain, RefreshCw, Loader2, Award, Zap,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { generateAIInsights, generateWeeklyDigest, AIInsight, WeeklyDigest as WeeklyDigestType } from '@/lib/aiAdvisor';
import { SENTIMENT_COLORS } from '@/lib/chartPalette';
import { useSemesterStore } from '@/stores/useSemesterStore';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { calculateCourseGrade, calculateGPA } from '@/lib/gradeUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabType = 'insights' | 'weekly' | 'study' | 'claude';
type FilterType = 'all' | 'grades' | 'deadlines' | 'study' | 'achievements';

// ─── Claude Advice types ──────────────────────────────────────────────────────

interface Priority {
  rank: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}
interface StudyStrategy { course: string; strategy: string; }
interface ClaudeAdvice {
  assessment: string;
  priorities: Priority[];
  studyStrategies: StudyStrategy[];
  timeManagement: string;
  motivation: string;
}

const CACHE_KEY_ADVICE   = 'sigma_ai_advice_cache';
const CACHE_KEY_TS       = 'sigma_ai_advice_ts';
const CACHE_KEY_SNAPSHOT = 'sigma_ai_advice_snapshot';
const CACHE_TTL_MS       = 60 * 60 * 1000; // 1 hour

function courseSnapshot(courses: ReturnType<typeof useSemesterStore.getState>['courses']): string {
  return JSON.stringify(
    courses
      .map((c) => ({ id: c.id, grades: c.assignments.map((a) => ({ id: a.id, score: a.score })) }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

export default function AIAdvisorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('insights');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Claude advice state
  const [claudeAdvice, setClaudeAdvice] = useState<ClaudeAdvice | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [claudeError, setClaudeError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const courses = useSemesterStore((state) => state.courses);
  const { user } = useAuth();

  const insights = useMemo(() => generateAIInsights(courses), [courses]);
  const weeklyDigest = useMemo(() => generateWeeklyDigest(courses), [courses]);

  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.category === filter);
  }, [insights, filter]);

  const gpa = useMemo(() => calculateGPA(courses), [courses]);

  // ── Claude advice fetching ──
  const fetchClaudeAdvice = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setClaudeLoading(true);
    setClaudeError(null);

    try {
      const snapshot = courseSnapshot(courses);

      // Check cache unless forced refresh
      if (!force) {
        const cachedTs = localStorage.getItem(CACHE_KEY_TS);
        const cachedSnap = localStorage.getItem(CACHE_KEY_SNAPSHOT);
        const cachedAdvice = localStorage.getItem(CACHE_KEY_ADVICE);
        if (
          cachedTs && cachedAdvice && cachedSnap === snapshot &&
          Date.now() - parseInt(cachedTs) < CACHE_TTL_MS
        ) {
          setClaudeAdvice(JSON.parse(cachedAdvice));
          setClaudeLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      // Check rate limit (1 hour between forced refreshes)
      if (force) {
        const lastTs = localStorage.getItem(CACHE_KEY_TS);
        if (lastTs && Date.now() - parseInt(lastTs) < CACHE_TTL_MS) {
          const minsLeft = Math.ceil((CACHE_TTL_MS - (Date.now() - parseInt(lastTs))) / 60000);
          toast.info(`Rate limited — try again in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}.`);
          setClaudeLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      // Build course payload
      const coursesPayload = courses.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        currentGrade: calculateCourseGrade(c.assignments),
        assignments: c.assignments
          .filter((a) => !a.archived)
          .map((a) => ({
            name: a.name,
            type: a.type,
            weight: a.weight,
            score: a.score,
            dueDate: a.dueDate,
          })),
      }));

      const { data, error } = await supabase.functions.invoke('ai-advisor', {
        body: { courses: coursesPayload, gpa, targetGpa: undefined },
      });

      if (error) throw new Error(error.message || 'Failed to get advice');
      if (!data?.success || !data?.data) throw new Error(data?.error || 'Unexpected response');

      const advice: ClaudeAdvice = data.data;
      setClaudeAdvice(advice);
      localStorage.setItem(CACHE_KEY_ADVICE, JSON.stringify(advice));
      localStorage.setItem(CACHE_KEY_TS, Date.now().toString());
      localStorage.setItem(CACHE_KEY_SNAPSHOT, snapshot);
    } catch (err) {
      setClaudeError((err as Error).message);
    } finally {
      setClaudeLoading(false);
      fetchingRef.current = false;
    }
  }, [courses, gpa]);

  // Auto-fetch when switching to Claude tab
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'claude' && !claudeAdvice && !claudeLoading) {
      fetchClaudeAdvice(false);
    }
  }, [claudeAdvice, claudeLoading, fetchClaudeAdvice]);
  
  return (
    <MainLayout>
      <div className="ai-advisor-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <Sparkles className="icon" />
            </div>
            <div>
              <h1 className="page-title">AI Academic Advisor</h1>
              <p className="page-subtitle">
                Personalized insights and recommendations based on your academic data
              </p>
            </div>
          </div>
          
          {/* Important Disclaimer Banner */}
          <div className="disclaimer-banner">
            <Info className="w-5 h-5" />
            <div className="disclaimer-content">
              <strong>Important:</strong> These AI-generated insights are suggestions based on your data. 
              Always verify important decisions with your professor, academic advisor, or institution's official resources.
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="advisor-tabs">
          <button
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => handleTabChange('insights')}
          >
            <Lightbulb className="w-4 h-4" />
            Insights
            {insights.filter(i => i.priority === 'critical' || i.priority === 'high').length > 0 && (
              <span className="tab-badge urgent">
                {insights.filter(i => i.priority === 'critical' || i.priority === 'high').length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => handleTabChange('weekly')}
          >
            <Calendar className="w-4 h-4" />
            Weekly Digest
          </button>
          <button
            className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`}
            onClick={() => handleTabChange('study')}
          >
            <Clock className="w-4 h-4" />
            Study Plan
          </button>
          <button
            className={`tab-btn ${activeTab === 'claude' ? 'active' : ''}`}
            onClick={() => handleTabChange('claude')}
          >
            <Brain className="w-4 h-4" />
            Claude Advice
            <span className="tab-badge" style={{ background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))' }}>AI</span>
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'insights' && (
            <InsightsTab 
              insights={filteredInsights}
              filter={filter}
              setFilter={setFilter}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
          )}
          
          {activeTab === 'weekly' && (
            <WeeklyDigestTab digest={weeklyDigest} />
          )}
          
          {activeTab === 'study' && (
            <StudyPlanTab digest={weeklyDigest} courses={courses} />
          )}

          {activeTab === 'claude' && (
            <ClaudeAdviceTab
              advice={claudeAdvice}
              loading={claudeLoading}
              error={claudeError}
              onRefresh={() => fetchClaudeAdvice(true)}
              userLoggedIn={!!user}
            />
          )}
        </div>
        
        {/* Footer Disclaimer */}
        <div className="page-footer-disclaimer">
          <Sparkles className="w-5 h-5" />
          <p>
            <strong>SIGMA's AI Advisor</strong> provides data-driven suggestions to support your academic journey. 
            For official guidance on course requirements, grading policies, degree progress, or academic concerns, 
            please consult your professor, academic advisor, or registrar's office.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

// ============================================
// INSIGHTS TAB
// ============================================

function InsightsTab({ 
  insights, 
  filter, 
  setFilter,
  showFilters,
  setShowFilters
}: {
  insights: AIInsight[];
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
}) {
  const criticalInsights = insights.filter(i => i.priority === 'critical');
  const highInsights = insights.filter(i => i.priority === 'high');
  const otherInsights = insights.filter(i => i.priority !== 'critical' && i.priority !== 'high');
  
  return (
    <div className="insights-tab">
      {/* Filter Bar */}
      <div className="filter-bar">
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className={`w-4 h-4 ${showFilters ? 'rotated' : ''}`} />
        </button>
        
        {showFilters && (
          <div className="filter-options">
            {(['all', 'grades', 'deadlines', 'study', 'achievements'] as FilterType[]).map(f => (
              <button
                key={f}
                className={`filter-option ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' && 'All'}
                {f === 'grades' && '📊 Grades'}
                {f === 'deadlines' && '📅 Deadlines'}
                {f === 'study' && '📚 Study'}
                {f === 'achievements' && '🏆 Achievements'}
              </button>
            ))}
          </div>
        )}
        
        <span className="insight-count">{insights.length} insights</span>
      </div>
      
      {/* Critical Alerts Section */}
      {criticalInsights.length > 0 && (
        <div className="insights-section critical">
          <h3 className="section-title">
            <AlertTriangle className="w-5 h-5" />
            Requires Immediate Attention
          </h3>
          <div className="insights-grid">
            {criticalInsights.map(insight => (
              <FullInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
      
      {/* High Priority Section */}
      {highInsights.length > 0 && (
        <div className="insights-section high">
          <h3 className="section-title">
            <AlertTriangle className="w-5 h-5" />
            High Priority
          </h3>
          <div className="insights-grid">
            {highInsights.map(insight => (
              <FullInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
      
      {/* Other Insights */}
      {otherInsights.length > 0 && (
        <div className="insights-section">
          <h3 className="section-title">
            <Lightbulb className="w-5 h-5" />
            Recommendations & Insights
          </h3>
          <div className="insights-grid">
            {otherInsights.map(insight => (
              <FullInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {insights.length === 0 && (
        <div className="empty-state">
          <CheckCircle className="w-12 h-12" />
          <h3>All Caught Up!</h3>
          <p>No urgent insights right now. Keep up the great work!</p>
        </div>
      )}
    </div>
  );
}

function FullInsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  
  const getIcon = () => {
    switch (insight.type) {
      case 'priority-alert': return <AlertTriangle className="w-6 h-6" />;
      case 'opportunity': return <Lightbulb className="w-6 h-6" />;
      case 'celebration': return <TrendingUp className="w-6 h-6" />;
      case 'deadline-warning': return <Calendar className="w-6 h-6" />;
      case 'pattern': return <Target className="w-6 h-6" />;
      case 'study-recommendation': return <BookOpen className="w-6 h-6" />;
      case 'grade-path': return <Target className="w-6 h-6" />;
      default: return <MessageCircle className="w-6 h-6" />;
    }
  };
  
  return (
    <div className={`full-insight-card ${insight.priority}`}>
      {/* Course color indicator */}
      {insight.courseColor && (
        <div 
          className="course-color-stripe"
          style={{ backgroundColor: insight.courseColor }}
        />
      )}
      
      {/* Header */}
      <div className="insight-header">
        <div className="insight-icon-wrapper">
          {getIcon()}
        </div>
        <div className="insight-meta">
          {insight.courseCode && (
            <span className="insight-course">{insight.courseCode}</span>
          )}
          <span className={`insight-priority-badge ${insight.priority}`}>
            {insight.priority}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="insight-body">
        <h4 className="insight-title">{insight.title}</h4>
        <p className="insight-message">{insight.message}</p>
        
        {insight.details && (
          <div className="insight-details">
            <button 
              className="details-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'Show More'}
              <ChevronDown className={`w-4 h-4 ${expanded ? 'rotated' : ''}`} />
            </button>
            {expanded && (
              <p className="details-text">{insight.details}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Action */}
      {insight.actionLabel && insight.actionLink && (
        <div className="insight-footer">
          <Link to={insight.actionLink} className="insight-action-btn">
            {insight.actionLabel}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================
// WEEKLY DIGEST TAB
// ============================================

function WeeklyDigestTab({ digest }: { digest: WeeklyDigestType }) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getSentimentConfig = (sentiment: WeeklyDigestType['overallSentiment']) => {
    switch (sentiment) {
      case 'excellent':
        return { icon: '🌟', label: 'Excellent Week!', color: SENTIMENT_COLORS.excellent };
      case 'good':
        return { icon: '👍', label: 'Good Progress', color: SENTIMENT_COLORS.good };
      case 'needs-attention':
        return { icon: '⚠️', label: 'Needs Focus', color: SENTIMENT_COLORS['needs-attention'] };
      case 'critical':
        return { icon: '🚨', label: 'Action Required', color: SENTIMENT_COLORS.critical };
    }
  };
  
  const sentimentConfig = getSentimentConfig(digest.overallSentiment);
  
  return (
    <div className="weekly-digest-tab">
      {/* Week Overview Card */}
      <div className="digest-overview-card">
        <div className="overview-header">
          <div className="week-info">
            <span className="week-label">WEEK OF</span>
            <span className="week-dates">
              {formatDate(digest.weekStart)} - {formatDate(digest.weekEnd)}
            </span>
          </div>
          <div className="sentiment-badge" style={{ '--sentiment-color': sentimentConfig.color } as React.CSSProperties}>
            <span className="sentiment-icon">{sentimentConfig.icon}</span>
            <span className="sentiment-label" style={{ color: sentimentConfig.color }}>{sentimentConfig.label}</span>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="summary-stats">
          <div className="stat-card">
            <Clock className="w-5 h-5" />
            <span className="stat-value">{digest.summary.studyHours.toFixed(1)}h</span>
            <span className="stat-label">Study Time</span>
          </div>
          <div className="stat-card">
            <CheckCircle className="w-5 h-5" />
            <span className="stat-value">{digest.summary.assignmentsCompleted}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-5 h-5" />
            <span className="stat-value">{digest.summary.averageScore > 0 ? digest.summary.averageScore.toFixed(0) : '--'}%</span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
      </div>
      
      {/* Highlights & Concerns */}
      <div className="digest-grid">
        {/* Highlights */}
        <div className="digest-card highlights">
          <h3 className="card-title">
            <TrendingUp className="w-5 h-5" />
            Highlights
          </h3>
          {digest.highlights.length > 0 ? (
            <ul className="digest-list">
              {digest.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">No highlights this week</p>
          )}
        </div>
        
        {/* Concerns */}
        <div className="digest-card concerns">
          <h3 className="card-title">
            <AlertTriangle className="w-5 h-5" />
            Areas of Concern
          </h3>
          {digest.concerns.length > 0 ? (
            <ul className="digest-list">
              {digest.concerns.map((concern, i) => (
                <li key={i}>{concern}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text success">No concerns this week! 🎉</p>
          )}
        </div>
      </div>
      
      {/* Upcoming Priorities */}
      <div className="upcoming-section">
        <h3 className="section-title">
          <Calendar className="w-5 h-5" />
          Upcoming Priorities
        </h3>
        
        {digest.upcomingPriorities.length > 0 ? (
          <div className="priorities-list">
            {digest.upcomingPriorities.map((priority) => (
              <div key={priority.assignmentId} className={`priority-card ${priority.priority}`}>
                <div 
                  className="priority-color"
                  style={{ backgroundColor: priority.courseColor }}
                />
                <div className="priority-content">
                  <div className="priority-header">
                    <span className="priority-course">{priority.courseCode}</span>
                    <span className={`priority-badge ${priority.priority}`}>
                      {priority.priority}
                    </span>
                  </div>
                  <h4 className="priority-name">{priority.assignmentName}</h4>
                  <div className="priority-meta">
                    <span>
                      Due {priority.dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span>{priority.weight}% of grade</span>
                  </div>
                  <p className="priority-reason">{priority.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small">
            <CheckCircle className="w-8 h-8" />
            <p>No urgent deadlines coming up!</p>
          </div>
        )}
      </div>
      
      {/* Disclaimer */}
      <div className="digest-disclaimer">
        <Info className="w-4 h-4" />
        <span>
          This digest is generated from your SIGMA data. For official deadline information, 
          check your course syllabus or contact your professor.
        </span>
      </div>
    </div>
  );
}

// ============================================
// STUDY PLAN TAB
// ============================================

function StudyPlanTab({ digest, courses }: { digest: WeeklyDigestType; courses: any[] }) {
  const totalRecommendedHours = digest.recommendedFocus.reduce((sum, f) => sum + f.recommendedHours, 0);
  
  return (
    <div className="study-plan-tab">
      {/* Study Overview */}
      <div className="study-overview-card">
        <div className="overview-header">
          <div className="overview-icon">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="overview-text">
            <h3>Recommended Study Plan</h3>
            <p>Based on your current grades, risk levels, and upcoming deadlines</p>
          </div>
        </div>
        
        <div className="total-hours">
          <span className="hours-value">{totalRecommendedHours.toFixed(0)}</span>
          <span className="hours-label">hours this week</span>
        </div>
      </div>
      
      {/* Course Breakdown */}
      <div className="study-breakdown">
        <h3 className="section-title">
          <Clock className="w-5 h-5" />
          Study Time by Course
        </h3>
        
        <div className="study-courses">
          {digest.recommendedFocus.map((focus, index) => {
            const percentage = totalRecommendedHours > 0 
              ? (focus.recommendedHours / totalRecommendedHours) * 100 
              : 0;
            
            return (
              <div key={focus.courseId} className="study-course-card">
                <span className="course-rank">#{index + 1}</span>
                <div 
                  className="course-color-bar"
                  style={{ backgroundColor: focus.courseColor }}
                />
                <div className="course-info">
                  <div className="course-header">
                    <span className="course-code">{focus.courseCode}</span>
                    <span className="course-hours">{focus.recommendedHours.toFixed(1)}h</span>
                  </div>
                  
                  <div className="hours-bar">
                    <div 
                      className="hours-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: focus.courseColor 
                      }}
                    />
                  </div>
                  
                  <p className="course-reason">{focus.reason}</p>
                </div>
                
                <span className="course-percentage">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Study Tips */}
      <div className="study-tips-card">
        <h3 className="card-title">
          <Lightbulb className="w-5 h-5" />
          Study Tips
        </h3>
        <ul className="tips-list">
          <li>
            <strong>High-priority courses first:</strong> Tackle your most at-risk courses during your peak energy hours.
          </li>
          <li>
            <strong>Break it up:</strong> Use 25-50 minute focused sessions with short breaks (Pomodoro technique).
          </li>
          <li>
            <strong>Active recall:</strong> Test yourself frequently instead of passively re-reading notes.
          </li>
          <li>
            <strong>Spread it out:</strong> Distribute study sessions across multiple days for better retention.
          </li>
        </ul>
      </div>
      
      {/* Disclaimer */}
      <div className="study-disclaimer">
        <Info className="w-4 h-4" />
        <span>
          These recommendations are estimates based on course credits and your performance data.
          Adjust based on your personal learning pace and consult your academic advisor for personalized guidance.
        </span>
      </div>
    </div>
  );
}

// ============================================
// CLAUDE ADVICE TAB
// ============================================

const IMPACT_META: Record<'high' | 'medium' | 'low', { cls: string; label: string }> = {
  high:   { cls: 'bg-red-500/10 text-red-600 dark:text-red-400',       label: 'High Impact' },
  medium: { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'Medium Impact' },
  low:    { cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',    label: 'Low Impact' },
};

function AdviceSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="space-y-2 mt-6">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
    </div>
  );
}

function ClaudeAdviceTab({
  advice,
  loading,
  error,
  onRefresh,
  userLoggedIn,
}: {
  advice: ClaudeAdvice | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  userLoggedIn: boolean;
}) {
  if (!userLoggedIn) {
    return (
      <div className="claude-advice-empty">
        <Brain className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign in to Get AI Advice</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Claude-powered academic advice requires an account.
        </p>
        <Link to="/auth" className="text-sm text-primary hover:underline font-medium">Sign In →</Link>
      </div>
    );
  }

  return (
    <div className="claude-advice-tab">
      {/* Header */}
      <div className="claude-advice-header">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-base">Claude Academic Advisor</h2>
          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            Powered by Claude
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
            'hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          {loading ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="claude-advice-card">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Claude is analysing your academic data…
            </span>
          </div>
          <AdviceSkeleton />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="claude-advice-card" style={{ borderColor: 'hsl(var(--destructive)/0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Could not generate advice</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <button
                onClick={onRefresh}
                className="mt-3 text-xs text-primary hover:underline font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty / prompt state */}
      {!loading && !error && !advice && (
        <div className="claude-advice-empty">
          <Brain className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Get Personalised Advice</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs text-center">
            Claude will analyse your courses and grades to give you specific, actionable recommendations.
          </p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Generate Advice
          </button>
        </div>
      )}

      {/* Advice content */}
      {!loading && !error && advice && (
        <div className="space-y-4">
          {/* Assessment */}
          <div className="claude-advice-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Overall Assessment</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{advice.assessment}</p>
          </div>

          {/* Priorities */}
          {advice.priorities?.length > 0 && (
            <div className="claude-advice-card">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Top Priorities</h3>
              </div>
              <div className="space-y-3">
                {advice.priorities.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {p.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{p.title}</span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded font-medium',
                            IMPACT_META[p.impact]?.cls,
                          )}
                        >
                          {IMPACT_META[p.impact]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Strategies */}
          {advice.studyStrategies?.length > 0 && (
            <div className="claude-advice-card">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Study Strategies</h3>
              </div>
              <div className="space-y-2">
                {advice.studyStrategies.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">{s.course}:</span>{' '}
                      <span className="text-muted-foreground">{s.strategy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Management */}
          {advice.timeManagement && (
            <div className="claude-advice-card">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Time Management</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{advice.timeManagement}</p>
            </div>
          )}

          {/* Motivation */}
          {advice.motivation && (
            <div className="claude-advice-card" style={{ borderColor: 'hsl(var(--primary)/0.2)', background: 'hsl(var(--primary)/0.05)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Motivation</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{advice.motivation}"
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="study-disclaimer">
            <Info className="w-4 h-4" />
            <span>
              This advice is generated by Claude AI based on your academic data. Always verify
              important decisions with your professor or academic advisor.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
