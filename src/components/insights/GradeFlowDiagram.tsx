import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getColorByIndex } from '@/lib/courseColors';

// Category color definitions
const CATEGORY_COLORS: Record<string, string> = {
  homework: '#78716C',
  labs: '#3B82F6',
  lab: '#3B82F6',
  quizzes: '#EAB308',
  quiz: '#EAB308',
  exams: '#22C55E',
  exam: '#22C55E',
  participation: '#EC4899',
  projects: '#8B5CF6',
  project: '#8B5CF6',
  other: '#06B6D4',
};

interface CategoryFlow {
  name: string;
  weight: number;
  performance: number;
  color?: string;
}

interface CourseData {
  id: string;
  code: string;
  name: string;
  color: string;
  grade: number;
  totalPoints?: number;
  categories: CategoryFlow[];
}

interface GradeFlowDiagramProps {
  categories: CategoryFlow[];
  totalPointsEarned: number;
  courses?: CourseData[];
}

export function GradeFlowDiagram({ categories, totalPointsEarned, courses = [] }: GradeFlowDiagramProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock course data if none provided
  const displayCourses: CourseData[] = courses.length > 0 ? courses : [
    {
      id: 'cop3530',
      code: 'COP 3530',
      name: 'Data Structures',
      color: '#6366F1',
      grade: 94.8,
      totalPoints: 500,
      categories: [
        { name: 'Homework', weight: 20, performance: 95 },
        { name: 'Labs', weight: 15, performance: 92 },
        { name: 'Quizzes', weight: 10, performance: 88 },
        { name: 'Exams', weight: 40, performance: 96 },
        { name: 'Projects', weight: 10, performance: 98 },
        { name: 'Participation', weight: 5, performance: 100 },
      ]
    },
    {
      id: 'map2302',
      code: 'MAP 2302',
      name: 'Differential Equations',
      color: '#0EA5E9',
      grade: 88.0,
      totalPoints: 400,
      categories: [
        { name: 'Homework', weight: 25, performance: 92 },
        { name: 'Quizzes', weight: 15, performance: 85 },
        { name: 'Exams', weight: 50, performance: 86 },
        { name: 'Participation', weight: 10, performance: 95 },
      ]
    },
    {
      id: 'phy2049',
      code: 'PHY 2049',
      name: 'Physics II',
      color: '#F59E0B',
      grade: 82.0,
      totalPoints: 600,
      categories: [
        { name: 'Homework', weight: 15, performance: 88 },
        { name: 'Labs', weight: 20, performance: 90 },
        { name: 'Quizzes', weight: 10, performance: 75 },
        { name: 'Exams', weight: 45, performance: 78 },
        { name: 'Participation', weight: 10, performance: 85 },
      ]
    },
    {
      id: 'sta3032',
      code: 'STA 3032',
      name: 'Probability & Statistics',
      color: '#10B981',
      grade: 91.5,
      totalPoints: 450,
      categories: [
        { name: 'Homework', weight: 20, performance: 94 },
        { name: 'Quizzes', weight: 15, performance: 88 },
        { name: 'Exams', weight: 40, performance: 90 },
        { name: 'Projects', weight: 15, performance: 96 },
        { name: 'Participation', weight: 10, performance: 92 },
      ]
    },
  ];

  // Get current data based on selection
  const currentData = useMemo(() => {
    if (selectedCourse === 'all') {
      const totalPoints = 2000;
      const earnedPercent = totalPointsEarned;
      const lostPercent = 100 - earnedPercent;
      
      // Add colors to categories
      const categoriesWithColors = categories.map((cat, index) => ({
        ...cat,
        color: cat.color || CATEGORY_COLORS[cat.name.toLowerCase()] || getColorByIndex(index),
      }));

      return {
        code: 'All Courses',
        name: 'Combined view',
        color: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
        isGradient: true,
        totalPoints,
        earnedPercent,
        lostPercent,
        earnedPoints: Math.round(totalPoints * earnedPercent / 100),
        lostPoints: Math.round(totalPoints * lostPercent / 100),
        categories: categoriesWithColors,
      };
    }

    const course = displayCourses.find(c => c.id === selectedCourse);
    if (!course) return null;

    const earnedPercent = course.grade;
    const lostPercent = 100 - earnedPercent;
    const totalPoints = course.totalPoints || 500;

    const categoriesWithColors = course.categories.map((cat, index) => ({
      ...cat,
      color: CATEGORY_COLORS[cat.name.toLowerCase()] || getColorByIndex(index),
    }));

    return {
      code: course.code,
      name: course.name,
      color: course.color,
      isGradient: false,
      totalPoints,
      earnedPercent,
      lostPercent,
      earnedPoints: Math.round(totalPoints * earnedPercent / 100),
      lostPoints: Math.round(totalPoints * lostPercent / 100),
      categories: categoriesWithColors,
    };
  }, [selectedCourse, categories, totalPointsEarned, displayCourses]);

  if (!currentData) return null;

  // SVG dimensions - Origin 3-column layout with source area
  const svgWidth = 900;
  const svgHeight = 550;
  const topPadding = 50;
  const bottomPadding = 30;
  const contentHeight = svgHeight - topPadding - bottomPadding;
  
  // === FIX 1: SOURCE AREA (3 elements: dark edge + gradient fill + light edge) ===
  const sourceEdgeLeftX = 50;
  const sourceEdgeWidth = 10;
  const sourceAreaFillX = 60;
  const sourceAreaFillWidth = 150;
  const sourceEdgeRightX = 210;
  
  // === FIX 3: CONNECTING FLOW between source and middle ===
  const connectFlowX = 220;
  const connectFlowWidth = 130;
  
  // Middle area (Earned)
  const middleEdgeLeftX = 350;
  const middleAreaFillX = 360;
  const middleAreaFillWidth = 120;
  const middleEdgeRightX = 480;
  const distBarWidth = 10;
  
  // Category section
  const categoryBarX = 800;
  const categoryLabelX = 780;

  // Create smooth ribbon path with natural bezier curves
  const createSmoothRibbon = (
    startX: number,
    startYTop: number,
    startYBottom: number,
    endX: number,
    endYTop: number,
    endYBottom: number
  ) => {
    const cp1X = startX + (endX - startX) * 0.4;
    const cp2X = startX + (endX - startX) * 0.7;
    
    return `
      M ${startX} ${startYTop}
      C ${cp1X} ${startYTop}, ${cp2X} ${endYTop}, ${endX} ${endYTop}
      L ${endX} ${endYBottom}
      C ${cp2X} ${endYBottom}, ${cp1X} ${startYBottom}, ${startX} ${startYBottom}
      Z
    `;
  };

  // === FIX 4 & 5: Calculate category positions with proper spacing across full height ===
  const categoryRibbons = useMemo(() => {
    const totalWeight = currentData.categories.reduce((sum, cat) => sum + cat.weight, 0);
    const categoryCount = currentData.categories.length;
    
    // Minimum gap between categories (FIX 4: prevent overlap)
    const minGap = 60;
    const availableHeight = contentHeight - 40; // Leave padding top/bottom
    
    // Calculate how much vertical space each category needs based on weight
    let distY = topPadding + 10;
    
    // === FIX 5: Spread categories evenly across full height ===
    interface CategoryRibbon extends CategoryFlow {
      distYTop: number;
      distYBottom: number;
      catY: number;
      catBarHeight: number;
      color: string;
    }
    
    const positions: CategoryRibbon[] = [];
    
    currentData.categories.forEach((cat, index) => {
      const normalizedWeight = (cat.weight / totalWeight);
      const ribbonHeightAtSource = normalizedWeight * (contentHeight - 20);
      
      // Category position: spread evenly with minimum gaps
      const sectionHeight = availableHeight / categoryCount;
      const catY = topPadding + 20 + (index * sectionHeight);
      const catBarHeight = Math.max(sectionHeight - minGap, 30);
      
      positions.push({
        ...cat,
        color: cat.color || CATEGORY_COLORS[cat.name.toLowerCase()] || getColorByIndex(index),
        distYTop: distY,
        distYBottom: distY + ribbonHeightAtSource,
        catY,
        catBarHeight,
      });
      
      distY += ribbonHeightAtSource;
    });
    
    return positions;
  }, [currentData.categories, contentHeight, topPadding]);

  return (
    <div className="origin-grade-flow">
      {/* Header */}
      <div className="origin-flow-header">
        <div className="origin-flow-header-left">
          <h3 className="origin-flow-title">Grade Flow</h3>
          <div className="origin-flow-summary">
            <span className="origin-stat earned">{currentData.earnedPoints}pts earned</span>
            <span className="origin-stat-divider">•</span>
            <span className="origin-stat lost">{currentData.lostPoints}pts lost</span>
          </div>
        </div>
        
        {/* Course Selector */}
        <div className="origin-selector" ref={dropdownRef}>
          <button 
            className={`origin-dropdown-btn ${isDropdownOpen ? 'open' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span 
              className="origin-color-dot"
              style={{ background: currentData.isGradient ? currentData.color : currentData.color }}
            />
            <span className="origin-dropdown-text">{currentData.code}</span>
            <ChevronDown className="origin-dropdown-arrow" size={14} />
          </button>
          
          {/* Dropdown Menu */}
          <div className={`origin-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
            <div 
              className={`origin-dropdown-item ${selectedCourse === 'all' ? 'active' : ''}`}
              onClick={() => { setSelectedCourse('all'); setIsDropdownOpen(false); }}
            >
              <span className="origin-color-dot" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }} />
              <div className="origin-item-info">
                <span className="origin-item-code">All Courses</span>
                <span className="origin-item-name">Combined view</span>
              </div>
              <span className="origin-item-grade">{totalPointsEarned.toFixed(1)}%</span>
              {selectedCourse === 'all' && <Check size={14} className="origin-check" />}
            </div>
            
            <div className="origin-dropdown-divider" />
            
            {displayCourses.map((course) => (
              <div 
                key={course.id}
                className={`origin-dropdown-item ${selectedCourse === course.id ? 'active' : ''}`}
                onClick={() => { setSelectedCourse(course.id); setIsDropdownOpen(false); }}
              >
                <span className="origin-color-dot" style={{ background: course.color }} />
                <div className="origin-item-info">
                  <span className="origin-item-code">{course.code}</span>
                  <span className="origin-item-name">{course.name}</span>
                </div>
                <span className="origin-item-grade">{course.grade.toFixed(1)}%</span>
                {selectedCourse === course.id && <Check size={14} className="origin-check" />}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Origin-Style 3-Column Sankey Chart */}
      <div className="origin-sankey-container">
        <svg 
          className="origin-sankey-svg" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Source edge bars gradient - deep emerald */}
            <linearGradient id="sourceEdgeLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
            
            <linearGradient id="sourceEdgeRightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            
            {/* FIX 1: Source area fill gradient */}
            <linearGradient id="sourceAreaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
              <stop offset="50%" stopColor="rgba(110, 231, 183, 0.4)" />
              <stop offset="100%" stopColor="rgba(167, 243, 208, 0.5)" />
            </linearGradient>
            
            {/* FIX 3: Connecting flow gradient */}
            <linearGradient id="connectFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(167, 243, 208, 0.35)" />
              <stop offset="50%" stopColor="rgba(153, 246, 228, 0.25)" />
              <stop offset="100%" stopColor="rgba(165, 243, 252, 0.3)" />
            </linearGradient>
            
            {/* Middle area gradient */}
            <linearGradient id="middleAreaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(153, 246, 228, 0.3)" />
              <stop offset="50%" stopColor="rgba(165, 243, 252, 0.25)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.35)" />
            </linearGradient>
            
            {/* Middle edge bars gradient - cyan */}
            <linearGradient id="middleEdgeLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#99F6E4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#5EEAD4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#99F6E4" stopOpacity="0.8" />
            </linearGradient>
            
            <linearGradient id="middleEdgeRightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0E7490" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0E7490" />
            </linearGradient>
            
            {/* Category ribbon gradients - from cyan to category color */}
            {categoryRibbons.map((cat, index) => (
              <linearGradient key={`catRibbonGrad-${index}`} id={`catRibbonGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.25)" />
                <stop offset="40%" stopColor={cat.color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={cat.color} stopOpacity="0.3" />
              </linearGradient>
            ))}
          </defs>
          
          {/* ========================================== */}
          {/* FIX 1: SOURCE AREA (3 elements like Origin) */}
          {/* ========================================== */}
          {/* Dark edge bar (left) */}
          <rect 
            x={sourceEdgeLeftX} 
            y={topPadding} 
            width={sourceEdgeWidth} 
            height={contentHeight} 
            rx={5} 
            fill="url(#sourceEdgeLeftGrad)"
            className="origin-bar"
          />
          
          {/* Large gradient fill */}
          <rect 
            x={sourceAreaFillX} 
            y={topPadding} 
            width={sourceAreaFillWidth} 
            height={contentHeight} 
            fill="url(#sourceAreaGrad)"
            className="origin-flow-area"
          />
          
          {/* Light edge bar (right) */}
          <rect 
            x={sourceEdgeRightX} 
            y={topPadding} 
            width={sourceEdgeWidth} 
            height={contentHeight} 
            rx={5} 
            fill="url(#sourceEdgeRightGrad)"
            className="origin-bar"
          />
          
          {/* ========================================== */}
          {/* FIX 3: CONNECTING FLOW                    */}
          {/* ========================================== */}
          <rect 
            x={connectFlowX} 
            y={topPadding} 
            width={connectFlowWidth} 
            height={contentHeight} 
            fill="url(#connectFlowGrad)"
            className="origin-connect-flow"
          />
          
          {/* ========================================== */}
          {/* MIDDLE AREA (Earned) - 3 elements         */}
          {/* ========================================== */}
          {/* Light edge bar (left) */}
          <rect 
            x={middleEdgeLeftX} 
            y={topPadding} 
            width={distBarWidth} 
            height={contentHeight} 
            rx={5} 
            fill="url(#middleEdgeLeftGrad)"
            className="origin-bar"
          />
          
          {/* Large gradient fill */}
          <rect 
            x={middleAreaFillX} 
            y={topPadding} 
            width={middleAreaFillWidth} 
            height={contentHeight} 
            fill="url(#middleAreaGrad)"
            className="origin-flow-area"
          />
          
          {/* Cyan edge bar (right - distribution bar) */}
          <rect 
            x={middleEdgeRightX} 
            y={topPadding} 
            width={distBarWidth} 
            height={contentHeight} 
            rx={5} 
            fill="url(#middleEdgeRightGrad)"
            className="origin-bar origin-dist-bar"
          />
          
          {/* ============================= */}
          {/* RIBBONS: From dist bar to categories */}
          {/* ============================= */}
          {categoryRibbons.map((cat, index) => (
            <path
              key={`ribbon-${index}`}
              d={createSmoothRibbon(
                middleEdgeRightX + distBarWidth,
                cat.distYTop,
                cat.distYBottom,
                categoryBarX,
                cat.catY,
                cat.catY + cat.catBarHeight
              )}
              fill={`url(#catRibbonGrad-${index})`}
              className="origin-ribbon origin-ribbon-category"
            />
          ))}
          
          {/* ============================= */}
          {/* CATEGORY BARS (Right side)    */}
          {/* ============================= */}
          {categoryRibbons.map((cat, index) => (
            <rect
              key={`catBar-${index}`}
              x={categoryBarX}
              y={cat.catY}
              width={14}
              height={cat.catBarHeight}
              rx={5}
              fill={cat.color}
              className="origin-cat-bar"
            />
          ))}
          
          {/* ============================= */}
          {/* LABELS                        */}
          {/* ============================= */}
          
          {/* FIX 2: Source label - INSIDE the green area, centered */}
          <g className="origin-label-group">
            <text x={sourceAreaFillX + sourceAreaFillWidth / 2} y={topPadding + contentHeight / 2 - 20} className="origin-label-title" textAnchor="middle">
              Total Points
            </text>
            <text x={sourceAreaFillX + sourceAreaFillWidth / 2} y={topPadding + contentHeight / 2 + 10} className="origin-label-value-lg origin-source-value" textAnchor="middle">
              {currentData.totalPoints}pts
            </text>
            <text x={sourceAreaFillX + sourceAreaFillWidth / 2} y={topPadding + contentHeight / 2 + 32} className="origin-label-subtitle" textAnchor="middle">
              (100%)
            </text>
          </g>
          
          {/* Middle area label - INSIDE the cyan area, centered */}
          <g className="origin-label-group">
            <text x={middleAreaFillX + middleAreaFillWidth / 2} y={topPadding + contentHeight / 2 - 20} className="origin-flow-label-title" textAnchor="middle">
              Earned
            </text>
            <text x={middleAreaFillX + middleAreaFillWidth / 2} y={topPadding + contentHeight / 2 + 10} className="origin-flow-label-value" textAnchor="middle">
              {currentData.earnedPoints}pts
            </text>
            <text x={middleAreaFillX + middleAreaFillWidth / 2} y={topPadding + contentHeight / 2 + 32} className="origin-flow-label-percent" textAnchor="middle">
              ({currentData.earnedPercent.toFixed(1)}%)
            </text>
          </g>
          
          {/* Category labels (left of category bars) - FIX 4 & 5: Properly spaced */}
          {categoryRibbons.map((cat, index) => {
            const centerY = cat.catY + cat.catBarHeight / 2;
            
            return (
              <g key={`catLabel-${index}`} className="origin-cat-label-group">
                <text 
                  x={categoryLabelX} 
                  y={centerY - 6} 
                  className="origin-cat-name"
                  textAnchor="end"
                >
                  {cat.name}
                </text>
                <text 
                  x={categoryLabelX} 
                  y={centerY + 12} 
                  className="origin-cat-value"
                  textAnchor="end"
                >
                  {cat.performance}% ({cat.weight}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
