import { useState, useMemo, useCallback } from "react";
import { ChevronDown, AlertTriangle, CheckCircle, RotateCcw, Target, Calculator, TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatIfSlider } from "@/components/ui/whatif-slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { percentageToLetter, formatAssignmentType } from "@/lib/gradeUtils";
import type { Assignment, AssignmentType } from "@/types";
import { DEFAULT_GRADING_SCALE } from "@/types";
import { WhatDoINeedCalculator } from "@/components/calculator/WhatDoINeedCalculator";

type CalculatorMode = 'what-need' | 'what-if';

interface WhatIfTabProps {
  assignments: Assignment[];
  courseColor: string;
  courseCode?: string;
  courseName?: string;
  gradingScale?: Record<string, number>;
}

// Grade targets for the goal calculator
const GRADE_TARGETS = [
  { letter: 'A', min: 93 },
  { letter: 'A-', min: 90 },
  { letter: 'B+', min: 87 },
  { letter: 'B', min: 83 },
  { letter: 'B-', min: 80 },
  { letter: 'C+', min: 77 },
];

// Quick select grade options
const QUICK_GRADES = [
  { letter: 'F', value: 50 },
  { letter: 'D', value: 65 },
  { letter: 'C', value: 75 },
  { letter: 'C+', value: 78 },
  { letter: 'B-', value: 80 },
  { letter: 'B', value: 85 },
  { letter: 'B+', value: 88 },
  { letter: 'A-', value: 91 },
  { letter: 'A', value: 95 },
];

// Helper to get grade class
const getGradeClass = (score: number): string => {
  if (score >= 90) return 'grade-a';
  if (score >= 80) return 'grade-b';
  if (score >= 70) return 'grade-c';
  if (score >= 60) return 'grade-d';
  return 'grade-f';
};

// Helper to find which quick grade is selected
const getSelectedQuickGrade = (score: number): string | null => {
  const match = QUICK_GRADES.find(g => g.value === score);
  return match?.letter || null;
};

export function WhatIfTab({ assignments, courseColor, courseCode = '', courseName = '', gradingScale }: WhatIfTabProps) {
  // Mode toggle state
  const [mode, setMode] = useState<CalculatorMode>('what-need');
  
  // State for hypothetical scores - default 85%
  const [hypotheticalScores, setHypotheticalScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    assignments.filter(a => a.score === null).forEach(a => {
      initial[a.id] = 85;
    });
    return initial;
  });

  // State for selected goal grade
  const [selectedGoal, setSelectedGoal] = useState<string>('B');

  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['exam', 'discussion']));

  // State for Goal Calculator expanded
  const [goalCalculatorExpanded, setGoalCalculatorExpanded] = useState(true);

  const scale = gradingScale || DEFAULT_GRADING_SCALE;

  // Calculations
  const gradedAssignments = useMemo(() => 
    assignments.filter(a => a.score !== null), [assignments]);
  
  const ungradedAssignments = useMemo(() => 
    assignments.filter(a => a.score === null), [assignments]);

  const gradedWeight = useMemo(() => 
    gradedAssignments.reduce((sum, a) => sum + a.weight, 0), [gradedAssignments]);

  const ungradedWeight = useMemo(() => 
    ungradedAssignments.reduce((sum, a) => sum + a.weight, 0), [ungradedAssignments]);

  const totalWeight = useMemo(() => 
    assignments.reduce((sum, a) => sum + a.weight, 0), [assignments]);

  // Current grade from graded work only
  const currentGrade = useMemo(() => {
    if (gradedWeight === 0) return 0;
    const earnedPoints = gradedAssignments.reduce((sum, a) => 
      sum + (a.weight / 100) * a.score!, 0);
    return (earnedPoints / gradedWeight) * 100;
  }, [gradedAssignments, gradedWeight]);

  // Projected grade including hypotheticals
  const projectedGrade = useMemo(() => {
    let totalEarned = 0;
    let totalW = 0;

    assignments.forEach(a => {
      if (a.score !== null) {
        totalEarned += (a.weight / 100) * a.score;
        totalW += a.weight;
      } else if (hypotheticalScores[a.id] !== undefined) {
        totalEarned += (a.weight / 100) * hypotheticalScores[a.id];
        totalW += a.weight;
      }
    });

    return totalW > 0 ? (totalEarned / totalW) * 100 : 0;
  }, [assignments, hypotheticalScores]);

  const projectedLetter = useMemo(() => 
    projectedGrade > 0 ? percentageToLetter(projectedGrade) : '—', [projectedGrade]);

  // Group ungraded by type
  const ungradedByType = useMemo(() => {
    const grouped: Record<AssignmentType, Assignment[]> = {} as Record<AssignmentType, Assignment[]>;
    ungradedAssignments.forEach(a => {
      if (!grouped[a.type]) grouped[a.type] = [];
      grouped[a.type].push(a);
    });
    return grouped;
  }, [ungradedAssignments]);

  // Calculate weight per type for ungraded
  const weightByType = useMemo(() => {
    const weights: Record<string, number> = {};
    ungradedAssignments.forEach(a => {
      weights[a.type] = (weights[a.type] || 0) + a.weight;
    });
    return weights;
  }, [ungradedAssignments]);

  // Goal calculation
  const goalResult = useMemo(() => {
    const targetGrade = scale[selectedGoal] || 83;
    
    // Points already earned from graded work
    const earnedPoints = gradedAssignments.reduce((sum, a) => 
      sum + (a.weight / 100) * a.score!, 0);

    // Maximum possible = earned + all remaining at 100%
    const maxPossible = earnedPoints + ungradedWeight;

    // Points needed for target
    const targetPoints = (targetGrade / 100) * totalWeight;
    const pointsNeeded = targetPoints - earnedPoints;

    // Average needed on remaining
    const neededAverage = ungradedWeight > 0 ? (pointsNeeded / ungradedWeight) * 100 : 0;
    const achievable = neededAverage <= 100 && neededAverage >= 0;

    // Calculate per-category requirements (simplified - equal distribution)
    const categoryBreakdown = Object.entries(weightByType).map(([type, weight]) => ({
      type,
      weight,
      neededScore: neededAverage,
    }));

    return {
      targetGrade,
      achievable,
      neededAverage,
      maxPossible: (maxPossible / totalWeight) * 100,
      categoryBreakdown,
    };
  }, [selectedGoal, scale, gradedAssignments, ungradedWeight, totalWeight, weightByType]);

  // Handlers
  const updateScore = useCallback((id: string, value: number) => {
    setHypotheticalScores(prev => ({ ...prev, [id]: value }));
  }, []);

  const setAllScores = useCallback((score: number) => {
    const scores: Record<string, number> = {};
    ungradedAssignments.forEach(a => {
      scores[a.id] = score;
    });
    setHypotheticalScores(scores);
  }, [ungradedAssignments]);

  const resetScores = useCallback(() => {
    const scores: Record<string, number> = {};
    ungradedAssignments.forEach(a => {
      scores[a.id] = 85;
    });
    setHypotheticalScores(scores);
  }, [ungradedAssignments]);

  const toggleCategory = useCallback((type: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Get goal summary text
  const getGoalSummary = () => {
    const target = GRADE_TARGETS.find(g => g.letter === selectedGoal);
    if (!target) return null;
    
    if (ungradedWeight === 0) {
      return { text: "All graded", achievable: true };
    }
    
    return {
      target: `${selectedGoal} (${target.min}%)`,
      needed: `${goalResult.neededAverage.toFixed(1)}% avg`,
      achievable: goalResult.achievable,
    };
  };

  const goalSummary = getGoalSummary();

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="calculator-mode-toggle">
        <button 
          className={cn("mode-btn", mode === 'what-need' && "active")}
          onClick={() => setMode('what-need')}
        >
          <Target className="w-4 h-4" />
          <span>What Do I Need?</span>
        </button>
        <button 
          className={cn("mode-btn", mode === 'what-if' && "active")}
          onClick={() => setMode('what-if')}
        >
          <Calculator className="w-4 h-4" />
          <span>What If?</span>
        </button>
      </div>

      {/* What Do I Need Calculator */}
      {mode === 'what-need' ? (
        <WhatDoINeedCalculator
          assignments={assignments}
          courseColor={courseColor}
          courseCode={courseCode}
          courseName={courseName}
          gradingScale={gradingScale}
          onSwitchToWhatIf={() => setMode('what-if')}
        />
      ) : (
      <>
      {/* Grade Comparison Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Standing */}
        <div className="grade-comparison-widget">
          <div className="grade-comparison-header">
            <span className="widget-glass-title">
              Current Standing
            </span>
          </div>
          <div className="grade-comparison-content">
            <p className="grade-letter">
              {currentGrade > 0 ? percentageToLetter(currentGrade) : '—'}
            </p>
            {currentGrade > 0 && (
              <p className="grade-percentage">
                {currentGrade.toFixed(1)}%
              </p>
            )}
            <p className="grade-subtitle">
              Based on {gradedAssignments.length}/{assignments.length} assignments
            </p>
          </div>
        </div>

        {/* Projected Outcome */}
        <div className="grade-comparison-widget">
          <div className="grade-comparison-header">
            <span className="widget-glass-title">
              Projected Outcome
            </span>
          </div>
          <div className="grade-comparison-content">
            <p 
              className="grade-letter"
              style={{ color: projectedGrade > 0 ? courseColor : undefined }}
            >
              {projectedLetter}
            </p>
            {projectedGrade > 0 && (
              <p className="grade-percentage">
                {projectedGrade.toFixed(1)}%
              </p>
            )}
            <p className="grade-subtitle">
              Based on hypothetical scores
            </p>
          </div>
        </div>
      </div>

      {/* Goal Calculator - Collapsible */}
      <div className="goal-calculator">
        <button
          onClick={() => setGoalCalculatorExpanded(!goalCalculatorExpanded)}
          className="goal-calculator-header w-full"
        >
          <div className="flex items-center gap-4">
            <span className="widget-glass-title">
              Goal Calculator
            </span>
            
            {/* Collapsed Summary */}
            {!goalCalculatorExpanded && goalSummary && (
              <div className="flex items-center gap-3 text-sm goal-summary-collapsed">
                {goalSummary.target && (
                  <>
                    <span className="text-muted-foreground">
                      Target: <span className="text-foreground/80">{goalSummary.target}</span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span style={{ color: courseColor }}>
                      Need {goalSummary.needed}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span 
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] uppercase tracking-[0.5px]",
                        goalSummary.achievable 
                          ? "bg-[#4A8522]/20 text-[#4A8522]" 
                          : "bg-[#96172E]/20 text-[#96172E]"
                      )}
                    >
                      {goalSummary.achievable ? 'Achievable' : 'Not achievable'}
                    </span>
                  </>
                )}
                {goalSummary.text && (
                  <span className="text-[#4A8522]">{goalSummary.text}</span>
                )}
              </div>
            )}
          </div>
          
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              goalCalculatorExpanded && "rotate-180"
            )} 
          />
        </button>
        
        {goalCalculatorExpanded && (
          <div className="goal-calculator-content">
            <p className="text-sm text-muted-foreground mb-4">What grade do you want?</p>
            
            {/* Grade Target Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {GRADE_TARGETS.map(({ letter, min }) => (
                <button
                  key={letter}
                  onClick={() => setSelectedGoal(letter)}
                  className={cn(
                    "grade-target-btn",
                    selectedGoal === letter && "selected"
                  )}
                  style={selectedGoal === letter ? { borderColor: courseColor, '--course-color': courseColor } as React.CSSProperties : undefined}
                >
                  <p className="grade-target-letter">{letter}</p>
                  <p className="grade-target-percent">{min}%</p>
                </button>
              ))}
            </div>

            {/* Goal Result */}
            {ungradedWeight > 0 ? (
              goalResult.achievable ? (
                <div className="goal-result-achievable">
                  <div className="inline-block px-3 py-1 rounded text-[11px] tracking-[1px] uppercase bg-[#4A8522]/20 text-[#4A8522] mb-3">
                    Achievable
                  </div>
                  <p className="text-base text-foreground mb-4">
                    You need an average of <strong className="text-[#4A8522]">{goalResult.neededAverage.toFixed(1)}%</strong> on remaining assignments
                  </p>
                  
                  {/* Breakdown */}
                  <div className="mt-5">
                    <p className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mb-3">Breakdown</p>
                    <div className="border-t border-border">
                      {goalResult.categoryBreakdown.map(({ type, weight, neededScore }) => (
                        <div key={type} className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
                          <div>
                            <p className="text-sm text-foreground/80">{formatAssignmentType(type)}</p>
                            <p className="text-xs text-muted-foreground">{weight}% of grade</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Need at least</span>
                            <span className="text-sm font-medium text-foreground">{neededScore.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="goal-result-not-achievable">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#96172E] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Not achievable with current remaining assignments</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Maximum possible: {goalResult.maxPossible.toFixed(1)}%<br />
                        You would need: {goalResult.neededAverage.toFixed(1)}% average on remaining (impossible)
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="p-5 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 text-[#4A8522]">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">All assignments graded! Your final grade is set.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario Builder */}
      <div className="scenario-builder">
        <div className="scenario-builder-header">
          <span className="widget-glass-title">
            Scenario Builder
          </span>
        </div>
        <div className="scenario-builder-content">
          <p className="text-sm text-muted-foreground mb-4">Quick Scenarios:</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAllScores(95)}
              className="scenario-btn text-center"
            >
              <p className="text-sm font-medium text-foreground">All A's</p>
              <p className="text-xs text-muted-foreground mt-1">95%</p>
            </button>
            <button
              onClick={() => setAllScores(85)}
              className="scenario-btn text-center"
            >
              <p className="text-sm font-medium text-foreground">All B's</p>
              <p className="text-xs text-muted-foreground mt-1">85%</p>
            </button>
            <button
              onClick={() => setAllScores(75)}
              className="scenario-btn text-center"
            >
              <p className="text-sm font-medium text-foreground">All C's</p>
              <p className="text-xs text-muted-foreground mt-1">75%</p>
            </button>
            <button
              onClick={resetScores}
              className="scenario-btn scenario-btn-reset text-center"
            >
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Hypothetical Scores */}
      {ungradedAssignments.length > 0 && (
        <div className="hypothetical-scores">
          <div className="hypothetical-scores-header">
            <span className="widget-glass-title">
              Adjust Hypothetical Scores
            </span>
            <span className="text-xs text-muted-foreground">
              {ungradedAssignments.length} remaining
            </span>
          </div>
          
          <div>
            {Object.entries(ungradedByType).map(([type, typeAssignments]) => {
              // Calculate category average
              const categoryAvg = typeAssignments.reduce((sum, a) => sum + (hypotheticalScores[a.id] ?? 85), 0) / typeAssignments.length;
              
              return (
                <Collapsible
                  key={type}
                  open={expandedCategories.has(type)}
                  onOpenChange={() => toggleCategory(type)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="category-header-enhanced w-full">
                      <div className="category-info">
                        <span className="category-name">
                          {formatAssignmentType(type as AssignmentType)}
                        </span>
                        <span className="category-weight-badge">
                          {weightByType[type]}% of grade
                        </span>
                        <span className="category-average">
                          Avg: <span className="category-average-value" style={{ color: courseColor }}>{categoryAvg.toFixed(0)}%</span>
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "category-expand-icon w-5 h-5",
                        expandedCategories.has(type) && "expanded"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="category-assignments">
                      {typeAssignments.map((assignment) => {
                        const score = hypotheticalScores[assignment.id] ?? 85;
                        const letterGrade = percentageToLetter(score);
                        const gradeClass = getGradeClass(score);
                        const selectedQuickGrade = getSelectedQuickGrade(score);
                        
                        // Calculate impact (simplified - weight * score contribution)
                        const impact = (assignment.weight / 100) * score;
                        const baselineImpact = (assignment.weight / 100) * 85; // Baseline at 85%
                        const impactDiff = impact - baselineImpact;
                        
                        return (
                          <div
                            key={assignment.id}
                            className="assignment-score-card"
                            style={{ '--course-color': courseColor } as React.CSSProperties}
                          >
                            {/* Header with grade badge */}
                            <div className="assignment-header">
                              <div className={cn("grade-badge", gradeClass)}>
                                <span className="grade-badge-letter">{letterGrade}</span>
                                <span className="grade-badge-percent">{score}%</span>
                              </div>
                              <div className="assignment-info">
                                <h4 className="assignment-title">{assignment.name}</h4>
                                <span className="assignment-weight">{assignment.weight}% of grade</span>
                              </div>
                              <span className={cn(
                                "assignment-impact",
                                impactDiff < 0 && "negative"
                              )}>
                                {impactDiff >= 0 ? '+' : ''}{impactDiff.toFixed(1)}%
                              </span>
                            </div>
                            
                            {/* Slider with markers */}
                            <div className="slider-container">
                              <div className="premium-slider-track flex-1">
                                <WhatIfSlider
                                  value={[score]}
                                  onValueChange={([v]) => updateScore(assignment.id, v)}
                                  min={0}
                                  max={100}
                                  step={1}
                                  accentColor={courseColor}
                                  className="w-full"
                                />
                              </div>
                              <div className="score-input-container">
                                <input 
                                  type="number" 
                                  className="premium-score-input"
                                  value={score}
                                  min={0}
                                  max={100}
                                  onChange={(e) => updateScore(assignment.id, Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                                />
                                <span className="score-input-percent">%</span>
                              </div>
                            </div>
                            
                            {/* Grade markers */}
                            <div className="slider-markers">
                              <span className="slider-marker"><span>F</span><span>0</span></span>
                              <span className="slider-marker"><span>D</span><span>60</span></span>
                              <span className="slider-marker"><span>C</span><span>73</span></span>
                              <span className="slider-marker"><span>B</span><span>83</span></span>
                              <span className="slider-marker"><span>A</span><span>93</span></span>
                            </div>
                            
                            {/* Quick select buttons */}
                            <div className="quick-select-row">
                              {QUICK_GRADES.map((grade) => (
                                <button
                                  key={grade.letter}
                                  className={cn(
                                    "quick-select-btn",
                                    selectedQuickGrade === grade.letter && "selected"
                                  )}
                                  onClick={() => updateScore(assignment.id, grade.value)}
                                  style={selectedQuickGrade === grade.letter ? { 
                                    '--course-color': courseColor,
                                    borderColor: courseColor,
                                    background: `${courseColor}20`
                                  } as React.CSSProperties : undefined}
                                >
                                  {grade.letter}
                                </button>
                              ))}
                              <span className="quick-select-label">Quick select</span>
                            </div>
                            
                            {/* Live impact indicator */}
                            {Math.abs(impactDiff) > 0.1 && (
                              <div className={cn("live-impact", impactDiff < 0 && "negative")}>
                                {impactDiff >= 0 ? (
                                  <TrendingUp className="w-4 h-4 text-[#4A8522]" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-[#96172E]" />
                                )}
                                <span className="live-impact-text">
                                  This score {impactDiff >= 0 ? 'adds' : 'reduces'} <span className="live-impact-value">{Math.abs(impactDiff).toFixed(1)}%</span> {impactDiff >= 0 ? 'to' : 'from'} your projected grade
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 px-5 py-4 border-t border-border">
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          What-If analysis is for planning purposes only. Actual grades may vary based on your course's specific grading policies and curve adjustments.
        </p>
      </div>
      </>
      )}
    </div>
  );
}
