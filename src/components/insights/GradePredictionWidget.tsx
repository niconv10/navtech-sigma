import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Target, AlertCircle, CheckCircle, Info, Sparkles
} from 'lucide-react';
import { GradePrediction, PredictionFactor } from '@/lib/gradePrediction';
import { percentageToLetter } from '@/lib/gradeUtils';
import { capitalize } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface GradePredictionWidgetProps {
  predictions: GradePrediction[];
}

export function GradePredictionWidget({ predictions }: GradePredictionWidgetProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  
  if (predictions.length === 0) return null;
  
  // Summary stats
  const avgPredicted = predictions.reduce((sum, p) => sum + p.mostLikely.grade, 0) / predictions.length;
  const avgCurrent = predictions.reduce((sum, p) => sum + p.currentGrade, 0) / predictions.length;
  const improving = predictions.filter(p => p.mostLikely.grade > p.currentGrade + 1).length;
  const declining = predictions.filter(p => p.mostLikely.grade < p.currentGrade - 1).length;
  
  return (
    <div className="grade-prediction-widget">
      <div className="widget-header">
        <div className="header-left">
          <h3 className="widget-title">FINAL GRADE PREDICTIONS</h3>
          <span className="header-subtitle">Based on current performance and trends</span>
        </div>
        <div className="prediction-summary-badges">
          {improving > 0 && (
            <span className="summary-badge improving">
              <TrendingUp className="w-3 h-3" />
              {improving} Improving
            </span>
          )}
          {declining > 0 && (
            <span className="summary-badge declining">
              <TrendingDown className="w-3 h-3" />
              {declining} At Risk
            </span>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="prediction-summary-cards">
        <div className="summary-card">
          <span className="summary-label">Current Avg</span>
          <span className="summary-value">{avgCurrent.toFixed(1)}%</span>
          <span className="summary-letter">{percentageToLetter(avgCurrent)}</span>
        </div>
        <div className="summary-card arrow">
          <span className={`trend-arrow ${avgPredicted > avgCurrent ? 'up' : avgPredicted < avgCurrent ? 'down' : ''}`}>
            →
          </span>
        </div>
        <div className="summary-card predicted">
          <span className="summary-label">Predicted Avg</span>
          <span className="summary-value">{avgPredicted.toFixed(1)}%</span>
          <span className="summary-letter">{percentageToLetter(avgPredicted)}</span>
        </div>
      </div>
      
      {/* Course Predictions */}
      <div className="predictions-list">
        {predictions.map((prediction) => (
          <PredictionRow 
            key={prediction.courseId}
            prediction={prediction}
            isExpanded={expandedCourse === prediction.courseId}
            onToggle={() => setExpandedCourse(
              expandedCourse === prediction.courseId ? null : prediction.courseId
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PredictionRow({ 
  prediction, 
  isExpanded, 
  onToggle 
}: { 
  prediction: GradePrediction;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const {
    courseId,
    courseCode,
    courseName,
    courseColor,
    currentGrade,
    currentLetter,
    mostLikely,
    optimistic,
    pessimistic,
    confidence,
    confidencePercent,
    completedWeight,
    trend,
    factors,
    categoryPerformance,
    upcomingCategories,
    insight,
  } = prediction;
  
  const TrendIcon = trend === 'improving' ? TrendingUp : 
                    trend === 'declining' ? TrendingDown : Minus;
  
  const change = mostLikely.grade - currentGrade;
  const willImprove = change > 1;
  const willDecline = change < -1;
  
  return (
    <div className={`prediction-row ${willImprove ? 'improving' : willDecline ? 'declining' : ''}`}>
      {/* Row Header */}
      <div className="prediction-row-header" onClick={onToggle}>
        <div className="row-left">
          <div className="course-color-bar" style={{ background: courseColor }} />
          <div className="course-info">
            <span className="course-code">{courseCode}</span>
            <span className="course-name">{courseName}</span>
          </div>
        </div>
        
        <div className="row-center">
          {/* Current */}
          <div className="grade-block">
            <span className="block-label">Current</span>
            <span className="block-letter">{currentLetter}</span>
            <span className="block-percent">{currentGrade.toFixed(1)}%</span>
          </div>
          
          {/* Arrow */}
          <div className={`grade-arrow ${willImprove ? 'up' : willDecline ? 'down' : ''}`}>
            <span className="arrow-icon">→</span>
            <span className={`change-value ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
          
          {/* Predicted */}
          <div className={`grade-block predicted ${willImprove ? 'improving' : willDecline ? 'declining' : ''}`}>
            <span className="block-label">Predicted</span>
            <span className="block-letter">{mostLikely.letter}</span>
            <span className="block-percent">{mostLikely.grade.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="row-right">
          <div className={`trend-indicator ${trend}`}>
            <TrendIcon className="w-4 h-4" />
          </div>
          <span className={`confidence-pill ${confidence}`}>
            {confidencePercent}%
          </span>
          {isExpanded ? (
            <ChevronUp className="expand-icon rotated" />
          ) : (
            <ChevronDown className="expand-icon" />
          )}
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="prediction-row-details">
          {/* Scenario Cards */}
          <div className="prediction-range-section">
            <h4 className="section-title">Prediction Range</h4>
            <div className="scenario-cards">
              <div className="scenario-card">
                <div className="scenario-header">
                  <span className="scenario-letter">{pessimistic.letter}</span>
                  <span className="scenario-percent">{pessimistic.grade.toFixed(1)}%</span>
                </div>
                <span className="scenario-label">Pessimistic</span>
                <span className="scenario-prob">{pessimistic.probability}% chance</span>
                <p className="scenario-desc">{pessimistic.description}</p>
              </div>
              
              <div className="scenario-card highlighted">
                <div className="scenario-header">
                  <span className="scenario-letter">{mostLikely.letter}</span>
                  <span className="scenario-percent">{mostLikely.grade.toFixed(1)}%</span>
                </div>
                <span className="scenario-label">Most Likely</span>
                <span className="scenario-prob">{mostLikely.probability}% chance</span>
                <p className="scenario-desc">{mostLikely.description}</p>
              </div>
              
              <div className="scenario-card">
                <div className="scenario-header">
                  <span className="scenario-letter">{optimistic.letter}</span>
                  <span className="scenario-percent">{optimistic.grade.toFixed(1)}%</span>
                </div>
                <span className="scenario-label">Optimistic</span>
                <span className="scenario-prob">{optimistic.probability}% chance</span>
                <p className="scenario-desc">{optimistic.description}</p>
              </div>
            </div>
          </div>
          
          {/* Key Factors */}
          {factors.length > 0 && (
            <div className="factors-section">
              <h4 className="section-title">Key Factors</h4>
              <div className="factors-grid">
                {factors.map((factor, i) => (
                  <div key={i} className={`factor-card ${factor.impact}`}>
                    <div className="factor-icon">
                      {factor.impact === 'positive' && <CheckCircle className="w-4 h-4" />}
                      {factor.impact === 'negative' && <AlertCircle className="w-4 h-4" />}
                      {factor.impact === 'neutral' && <Info className="w-4 h-4" />}
                    </div>
                    <div className="factor-content">
                      <span className="factor-name">{factor.name}</span>
                      <span className="factor-description">{factor.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Category Breakdown */}
          {categoryPerformance.length > 0 && (
            <div className="category-section">
              <h4 className="section-title">Category Performance & Upcoming</h4>
              <div className="category-grid">
                {categoryPerformance.map((cat) => {
                  const upcoming = upcomingCategories.find(u => u.category === cat.category);
                  return (
                    <div key={cat.category} className="category-card">
                      <div className="category-header">
                        <span className="category-name">{capitalize(cat.category)}s</span>
                        <span className={`category-trend ${cat.trend}`}>
                          {cat.trend === 'improving' && <TrendingUp className="w-3 h-3" />}
                          {cat.trend === 'declining' && <TrendingDown className="w-3 h-3" />}
                          {cat.trend === 'stable' && <Minus className="w-3 h-3" />}
                        </span>
                      </div>
                      <div className="category-stats">
                        <div className="stat">
                          <span className="stat-value">{cat.average.toFixed(0)}%</span>
                          <span className="stat-label">Avg ({cat.count})</span>
                        </div>
                        {upcoming && (
                          <div className="stat upcoming">
                            <span className="stat-value">{upcoming.weight}%</span>
                            <span className="stat-label">Upcoming</span>
                          </div>
                        )}
                      </div>
                      {/* Performance bar */}
                      <div className="category-bar">
                        <div 
                          className={`bar-fill ${cat.average >= 85 ? 'strong' : cat.average >= 70 ? 'ok' : 'weak'}`}
                          style={{ width: `${cat.average}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* AI Insight */}
          <div className="ai-insight-section">
            <div className="ai-insight-card">
              <div className="ai-badge">
                <Sparkles className="w-3 h-3" />
                AI INSIGHT
              </div>
              <p className="ai-insight-text">{insight}</p>
            </div>
          </div>
          
          {/* Confidence Meter */}
          <div className="confidence-section">
            <div className="confidence-meter">
              <h4 className="meter-label">Prediction Confidence</h4>
              <div className="meter-bar">
                <div 
                  className={`meter-fill ${confidence}`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <div className="meter-info">
                <span className="meter-percent">{confidencePercent}%</span>
                <span className="meter-text">
                  {completedWeight}% of grade completed
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="prediction-actions">
            <Link to={`/courses/${courseId}?tab=what-if`} className="action-btn primary">
              <Target className="w-4 h-4" />
              What Do I Need?
            </Link>
            <Link to={`/courses/${courseId}`} className="action-btn secondary">
              View Course Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
