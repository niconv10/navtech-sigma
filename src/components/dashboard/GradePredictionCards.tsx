import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { GradePrediction } from '@/lib/gradePrediction';
import { Link } from 'react-router-dom';

interface GradePredictionCardsProps {
  predictions: GradePrediction[];
}

export function GradePredictionCards({ predictions }: GradePredictionCardsProps) {
  if (predictions.length === 0) return null;

  return (
    <div className="prediction-cards-widget">
      <div className="widget-header">
        <h3 className="widget-title">GRADE PREDICTIONS</h3>
        <Link to="/insights" className="widget-action">
          View Details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="prediction-cards-grid">
        {predictions.slice(0, 4).map((prediction) => (
          <PredictionCard key={prediction.courseId} prediction={prediction} />
        ))}
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: GradePrediction }) {
  const {
    courseId,
    courseCode,
    courseColor,
    currentGrade,
    currentLetter,
    mostLikely,
    optimistic,
    pessimistic,
    confidence,
    confidencePercent,
    trend,
  } = prediction;
  
  const TrendIcon = trend === 'improving' ? TrendingUp : 
                    trend === 'declining' ? TrendingDown : Minus;
  
  const willImprove = mostLikely.grade > currentGrade + 1;
  const willDecline = mostLikely.grade < currentGrade - 1;
  
  // Calculate range bar positions (0-100 scale)
  const rangeStart = Math.max(0, Math.min(pessimistic.grade, 100));
  const rangeEnd = Math.max(0, Math.min(optimistic.grade, 100));
  const markerPosition = Math.max(0, Math.min(mostLikely.grade, 100));
  
  return (
    <Link 
      to={`/courses/${courseId}`}
      className={`prediction-card ${willImprove ? 'improving' : willDecline ? 'declining' : ''}`}
    >
      {/* Header */}
      <div className="prediction-card-header">
        <div className="course-indicator">
          <span className="course-dot" style={{ background: courseColor }} />
          <span className="course-code">{courseCode}</span>
        </div>
        <div className={`trend-badge ${trend}`}>
          <TrendIcon className="w-4 h-4" />
        </div>
      </div>
      
      {/* Current vs Predicted */}
      <div className="prediction-comparison">
        <div className="current-grade">
          <span className="grade-label">Now</span>
          <span className="grade-value">{currentLetter}</span>
          <span className="grade-percent">{currentGrade.toFixed(1)}%</span>
        </div>
        
        <div className="prediction-arrow">
          <span className={`arrow ${willImprove ? 'up' : willDecline ? 'down' : ''}`}>
            →
          </span>
        </div>
        
        <div className={`predicted-grade ${willImprove ? 'improving' : willDecline ? 'declining' : ''}`}>
          <span className="grade-label">Predicted</span>
          <span className="grade-value">{mostLikely.letter}</span>
          <span className="grade-percent">{mostLikely.grade.toFixed(1)}%</span>
        </div>
      </div>
      
      {/* Range Bar */}
      <div className="prediction-range">
        <div className="range-bar">
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
        <div className="range-labels">
          <span>{pessimistic.letter}</span>
          <span>{optimistic.letter}</span>
        </div>
      </div>
      
      {/* Confidence */}
      <div className="prediction-confidence">
        <span className={`confidence-badge ${confidence}`}>
          {confidence === 'high' && '✓ High Confidence'}
          {confidence === 'medium' && '~ Medium Confidence'}
          {confidence === 'low' && '? Low Confidence'}
        </span>
        <span className="confidence-percent">{confidencePercent}% complete</span>
      </div>
    </Link>
  );
}
