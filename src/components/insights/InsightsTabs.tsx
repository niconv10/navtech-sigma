import { cn } from '@/lib/utils';

interface InsightsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'breakdown', label: 'Grade Breakdown' },
  { id: 'performance', label: 'Performance' },
  { id: 'study-analytics', label: 'Study Analytics' },
  { id: 'reports', label: 'Reports' },
];

export function InsightsTabs({ activeTab, onTabChange }: InsightsTabsProps) {
  return (
    <div className="insights-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "insights-tab",
            activeTab === tab.id && "active"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
