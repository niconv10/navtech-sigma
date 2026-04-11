import { TrendingUp, TrendingDown, Minus, Target, GraduationCap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatItem({ label, value, subtext, icon, trend, trendValue }: StatItemProps) {
  return (
    <div className="insights-stat-card">
      <div className="stat-icon-wrapper">
        {icon}
      </div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="stat-value">{value}</span>
          {subtext && <span className="stat-secondary">{subtext}</span>}
        </div>
      </div>
      {trend && trendValue && (
        <div className={cn(
          "stat-change",
          trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : ''
        )}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
           trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
           <Minus className="w-4 h-4" />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

interface InsightsSummaryStatsProps {
  currentGPA: number;
  targetGPA: number;
  averageGrade: number;
  semesterCredits: number;
}

export function InsightsSummaryStats({ 
  currentGPA, 
  targetGPA, 
  averageGrade,
  semesterCredits 
}: InsightsSummaryStatsProps) {
  const gpaGap = currentGPA - targetGPA;
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatItem
        label="Current GPA"
        value={currentGPA.toFixed(2)}
        icon={<GraduationCap className="w-5 h-5" />}
        trend={gpaGap >= 0 ? 'up' : 'down'}
        trendValue={gpaGap >= 0 ? '+0.12' : '-0.08'}
      />
      <StatItem
        label="Target GPA"
        value={targetGPA.toFixed(2)}
        icon={<Target className="w-5 h-5" />}
      />
      <StatItem
        label="GPA Gap"
        value={gpaGap >= 0 ? `+${gpaGap.toFixed(2)}` : gpaGap.toFixed(2)}
        icon={<BarChart3 className="w-5 h-5" />}
        trend={gpaGap >= 0 ? 'up' : 'down'}
        trendValue={gpaGap >= 0 ? 'On track' : 'Behind'}
      />
      <StatItem
        label="Avg Grade/Course"
        value={`${averageGrade.toFixed(1)}%`}
        subtext={`${semesterCredits} credits`}
        icon={<BarChart3 className="w-5 h-5" />}
      />
    </div>
  );
}
