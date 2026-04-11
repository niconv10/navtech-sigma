import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalsStore } from "@/stores/useGoalsStore";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { format } from "date-fns";

interface PremiumFocusTimerProps {
  className?: string;
}

export function PremiumFocusTimer({ className }: PremiumFocusTimerProps) {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  const { addFocusSession } = useGoalsStore();
  const { courses } = useSemesterStore();

  const durations = [15, 25, 45, 60];
  
  // Mock courses if none exist
  const displayCourses = courses.length > 0 ? courses : [
    { id: '1', code: 'COP3530', color: '#14B8A6' },
    { id: '2', code: 'MAP2302', color: '#8B5CF6' },
    { id: '3', code: 'PHY2049', color: '#3B82F6' },
    { id: '4', code: 'STA3032', color: '#F59E0B' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // Timer completed - save session
      addFocusSession({
        date: format(new Date(), 'yyyy-MM-dd'),
        duration: selectedDuration,
        course: selectedCourse || undefined,
      });
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, selectedDuration, selectedCourse, addFocusSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(selectedDuration * 60);
  };

  const selectDuration = (mins: number) => {
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
    setTimerActive(false);
  };

  const timerProgress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;
  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference - (timerProgress / 100) * circumference;
  
  const currentColor = selectedCourse 
    ? displayCourses.find(c => c.id === selectedCourse)?.color || '#14B8A6'
    : '#14B8A6';

  return (
    <div className={cn("focus-timer-widget", className)}>
      <div className="goals-widget-header">
        <h3 className="goals-widget-title">Focus Timer</h3>
      </div>
      
      {/* Course selector pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {displayCourses.slice(0, 4).map((course) => (
          <button
            key={course.id}
            onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
            className={cn(
              "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
              selectedCourse === course.id
                ? "text-white"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
            style={{
              background: selectedCourse === course.id ? course.color : 'transparent',
              boxShadow: selectedCourse === course.id 
                ? `0 4px 20px ${course.color}40` 
                : 'none',
            }}
          >
            {course.code}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative w-[200px] h-[200px] mx-auto mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            strokeWidth="4"
            className="stroke-border/30 dark:stroke-white/10"
          />
          {/* Progress */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              stroke: currentColor,
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear',
              filter: `drop-shadow(0 0 8px ${currentColor}60)`,
            }}
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="text-[56px] font-extralight tracking-tight text-foreground"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mt-2">
            {timerActive ? 'Focusing' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Duration presets */}
      <div className="flex justify-center gap-3 mb-6">
        {durations.map((mins) => (
          <button
            key={mins}
            onClick={() => selectDuration(mins)}
            className={cn(
              "w-14 h-9 rounded-full text-sm font-medium transition-all duration-300",
              selectedDuration === mins
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center items-center">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => setTimerActive(!timerActive)}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: currentColor,
            boxShadow: `0 8px 32px ${currentColor}50`,
          }}
        >
          {timerActive ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
