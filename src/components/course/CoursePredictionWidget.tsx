import { TrendingUp, TrendingDown, Minus, Target, Sparkles } from 'lucide-react';
import { GradePrediction } from '@/lib/gradePrediction';
import { Link } from 'react-router-dom';

interface CoursePredictionWidgetProps {
  prediction: GradePrediction;
}

export function CoursePredictionWidget({ prediction }: CoursePredictionWidgetProps) {
  const {
    courseId,
    currentGrade,
    currentLetter,
    mostLikely,
    optimistic,
    pessimistic,
    confidence,
    confidencePercent,
    trend,
    insight,
  } = prediction;
  
  const TrendIcon = trend === 'improving' ? TrendingUp : 
                    trend === 'declining' ? TrendingDown : Minus;
  
  const change = mostLikely.grade - currentGrade;
  
  // Calculate range bar positions
  const rangeStart = Math.max(0, pessimistic.grade);
  const rangeEnd = Math.min(100, optimistic.grade);
  const markerPosition = mostLikely.grade;
  
  return (
    <div className="course-prediction-widget">
      <div className="course-widget-header">
        <h3 className="course-widget-title">PREDICTED FINAL GRADE</h3>
        <div className={`trend-badge-small ${trend}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      </div>
      
      {/* Main Prediction Display */}
      <div className="prediction-main-display">
        <div className="prediction-grades">
          {/* Current Grade */}
          <div className="grade-display current">
            <span className="display-label">Now</span>
            <span className="display-letter">{currentLetter}</span>
            <span className="display-percent">{currentGrade.toFixed(1)}%</span>
          </div>
          
          {/* Arrow */}
          <div className="prediction-arrow-display">
            <span className={`arrow-icon ${change > 1 ? 'up' : change < -1 ? 'down' : ''}`}>
              →
            </span>
            <span className={`change-badge ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
          
          {/* Predicted Grade */}
          <div className={`grade-display predicted ${change > 1 ? 'improving' : change < -1 ? 'declining' : ''}`}>
            <span className="display-label">Predicted</span>
            <span className="display-letter">{mostLikely.letter}</span>
            <span className="display-percent">{mostLikely.grade.toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Range */}
        <div className="prediction-range-display">
          <div className="range-track">
            <div 
              className="range-fill"
              style={{ 
                left: `${rangeStart}%`, 
                width: `${rangeEnd - rangeStart}%` 
              }}
            />
            <div 
              className="range-marker"
              style={{ left: `${markerPosition}%` }}
            />
          </div>
          <div className="range-legend">
            <span>{pessimistic.letter}</span>
            <span>{mostLikely.letter}</span>
            <span>{optimistic.letter}</span>
          </div>
        </div>
      </div>
      
      {/* Scenarios Quick View */}
      <div className="scenarios-quick">
        <div className="scenario-mini pessimistic">
          <span className="mini-label">Worst</span>
          <span className="mini-letter">{pessimistic.letter}</span>
        </div>
        <div className="scenario-mini likely">
          <span className="mini-label">Likely</span>
          <span className="mini-letter">{mostLikely.letter}</span>
        </div>
        <div className="scenario-mini optimistic">
          <span className="mini-label">Best</span>
          <span className="mini-letter">{optimistic.letter}</span>
        </div>
      </div>
      
      {/* AI Insight */}
      <div className="prediction-insight">
        <Sparkles className="w-4 h-4 text-primary" />
        <p>{insight.slice(0, 150)}...</p>
      </div>
      
      {/* Confidence */}
      <div className="prediction-confidence-bar">
        <div className="confidence-track">
          <div 
            className={`confidence-fill ${confidence}`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <span className={`confidence-label ${confidence}`}>
          {confidence} confidence ({confidencePercent}% complete)
        </span>
      </div>
      
      {/* Action */}
      <Link to={`/courses/${courseId}?tab=what-if`} className="prediction-cta">
        <Target className="w-4 h-4" />
        See What You Need to Improve
      </Link>
    </div>
  );
}
