import { useState } from 'react';
import { 
  Sparkles, ChevronRight, AlertTriangle, Lightbulb, 
  TrendingUp, Calendar, Target, MessageCircle, Info
} from 'lucide-react';
import { AIInsight } from '@/lib/aiAdvisor';
import { Link } from 'react-router-dom';

interface AIAdvisorWidgetProps {
  insights: AIInsight[];
  compact?: boolean;
}

export function AIAdvisorWidget({ insights, compact = false }: AIAdvisorWidgetProps) {
  const topInsights = insights.slice(0, compact ? 3 : 5);
  const hasUrgent = insights.some(i => i.priority === 'critical' || i.priority === 'high');
  
  return (
    <div className={`ai-advisor-widget ${hasUrgent ? 'has-urgent' : ''}`}>
      {/* Header */}
      <div className="widget-header">
        <div className="header-left">
          <div className="ai-icon-wrapper">
            <Sparkles className="ai-icon" />
          </div>
          <div className="header-text">
            <h3 className="widget-title">AI ACADEMIC ADVISOR</h3>
            <span className="widget-subtitle">Personalized insights for you</span>
          </div>
        </div>
        <Link to="/advisor" className="text-sm font-medium text-primary hover:opacity-80 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Urgent Alert Banner (if any) */}
      {hasUrgent && (
        <div className="urgent-banner">
          <AlertTriangle className="w-4 h-4" />
          You have {insights.filter(i => i.priority === 'critical').length || insights.filter(i => i.priority === 'high').length} item(s) requiring attention
        </div>
      )}
      
      {/* Insights List */}
      <div className="insights-list">
        {topInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
      
      {/* Disclaimer */}
      <div className="advisor-disclaimer">
        <Info className="w-4 h-4" />
        AI suggestions are recommendations only. Always verify with your professor or academic advisor.
      </div>
      
      {/* Quick Actions */}
      {!compact && (
        <div className="quick-actions">
          <Link to="/advisor?tab=weekly" className="quick-action-btn">
            <Calendar className="w-4 h-4" />
            Weekly Digest
          </Link>
          <Link to="/advisor?tab=study" className="quick-action-btn">
            <Target className="w-4 h-4" />
            Study Plan
          </Link>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const getIcon = () => {
    switch (insight.type) {
      case 'priority-alert': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <Lightbulb className="w-5 h-5" />;
      case 'celebration': return <TrendingUp className="w-5 h-5" />;
      case 'deadline-warning': return <Calendar className="w-5 h-5" />;
      case 'pattern': return <Target className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };
  
  return (
    <div className={`insight-card ${insight.priority}`}>
      <div className="insight-icon-wrapper">
        {getIcon()}
      </div>
      
      <div className="insight-content">
        <h4 className="insight-title">{insight.title}</h4>
        <p className="insight-message">{insight.message}</p>
        
        {insight.actionLabel && insight.actionLink && (
          <Link to={insight.actionLink} className="insight-action">
            {insight.actionLabel} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      {insight.courseColor && (
        <div 
          className="insight-course-indicator"
          style={{ backgroundColor: insight.courseColor }}
        />
      )}
    </div>
  );
}
