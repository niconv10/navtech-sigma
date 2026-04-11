import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { CourseColorPicker } from "./CourseColorPicker";

interface CourseCardProps {
  code: string;
  name: string;
  grade: string;
  gradePercent: number;
  progress: number;
  color: string;
  className?: string;
  onClick?: () => void;
  onColorChange?: (color: string) => void;
}

export function CourseCard({
  code,
  name,
  grade,
  gradePercent,
  progress,
  color,
  className,
  onClick,
  onColorChange,
}: CourseCardProps) {
  return (
    <div 
      className={cn(
        "glass-widget overflow-hidden cursor-pointer group border border-white/[0.06]",
        className
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Color dot and course code */}
            <div className="flex items-center gap-2.5 mb-2">
              <CourseColorPicker 
                color={color} 
                onColorChange={(newColor) => {
                  onColorChange?.(newColor);
                }}
              />
              <span 
                className="inline-flex px-3 py-1.5 rounded-xl text-lg font-bold text-foreground"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {code}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{name}</p>
          </div>
          
          {/* Grade ring - white/gray styling */}
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(gradePercent / 100) * 150.8} 150.8`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {grade}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar - white/gray styling */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                background: 'rgba(255, 255, 255, 0.5)',
              }}
            />
          </div>
        </div>

        {/* View Details button - white/gray styling */}
        <button 
          className="mt-4 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white border border-white/[0.06]"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
