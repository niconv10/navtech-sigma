import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import starTrailsHero from '@/assets/star-trails-hero.png';
import { Logo } from '@/components/Logo';

const emailSchema = z.string().email('Please enter a valid email address').max(255);

// GPA Chart Component - Origin Style
function GPAChart() {
  // More dramatic growth curve data
  const data = [
    { label: 'Sum 25', gpa: 2.8 },
    { label: 'Fall 25', gpa: 3.0 },
    { label: 'Spr 26', gpa: 3.4 },
    { label: 'Sum 26', gpa: 3.85 },
  ];
  
  const maxGPA = 4.0;
  const minGPA = 2.0; // Tighter range to show more dramatic curve
  const range = maxGPA - minGPA;
  
  const width = 320;
  const height = 100;
  const paddingX = 20;
  const paddingTop = 10;
  const paddingBottom = 25;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const points = data.map((d, i) => ({
    x: paddingX + (i / (data.length - 1)) * (width - paddingX * 2),
    y: paddingTop + chartHeight - ((d.gpa - minGPA) / range) * chartHeight
  }));
  
  // Create smooth S-curve using cubic bezier with better control points
  const createSmoothPath = (pts: typeof points) => {
    if (pts.length < 2) return '';
    
    let path = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      
      // Calculate control points for smooth S-curve
      const dx = next.x - current.x;
      const cp1x = current.x + dx * 0.5;
      const cp1y = current.y;
      const cp2x = current.x + dx * 0.5;
      const cp2y = next.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };
  
  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="rounded-3xl p-6 border border-white/15"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-medium">GPA Journey</span>
          <button 
            className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
        
        <div className="mb-4">
          <span className="text-5xl font-light text-white tracking-tight">3.85</span>
        </div>
        
        <div className="relative">
          <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
              {/* Horizontal gradient - more opaque on the right (higher values) */}
              <linearGradient id="gpaGradientFillH" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="40%" stopColor="rgba(255, 255, 255, 0.1)" />
                <stop offset="70%" stopColor="rgba(255, 255, 255, 0.2)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
              </linearGradient>
              {/* Vertical fade to transparent at bottom */}
              <linearGradient id="gpaGradientFillV" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>
              <mask id="gpaMask">
                <rect x="0" y="0" width={width} height={height} fill="url(#gpaGradientFillV)" />
              </mask>
            </defs>
            
            {/* Gradient fill area with combined effect */}
            <path d={areaPath} fill="url(#gpaGradientFillH)" mask="url(#gpaMask)" />
            
            {/* Line - pure white, smooth, thick */}
            <path 
              d={linePath} 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* X-axis labels only */}
            {data.map((d, i) => (
              <text
                key={i}
                x={points[i].x}
                y={height - 5}
                textAnchor="middle"
                className="fill-white/30 text-[10px]"
              >
                {d.label}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// Laurel Wreath Component
function LaurelWreath({ side }: { side: 'left' | 'right' }) {
  return (
    <svg 
      className={`w-10 h-10 text-white/50 ${side === 'right' ? 'scale-x-[-1]' : ''}`} 
      viewBox="0 0 40 40" 
      fill="none"
    >
      {/* Curved branch with leaves */}
      <path 
        d="M20 38 C 16 32, 12 24, 12 16" 
        stroke="currentColor" 
        strokeWidth="1" 
        fill="none"
        opacity="0.6"
      />
      {/* Leaf 1 - bottom */}
      <ellipse cx="10" cy="32" rx="3" ry="6" fill="currentColor" transform="rotate(-30 10 32)" />
      {/* Leaf 2 */}
      <ellipse cx="8" cy="26" rx="3" ry="6" fill="currentColor" transform="rotate(-40 8 26)" />
      {/* Leaf 3 */}
      <ellipse cx="7" cy="20" rx="2.5" ry="5" fill="currentColor" transform="rotate(-50 7 20)" />
      {/* Leaf 4 */}
      <ellipse cx="7" cy="14" rx="2.5" ry="5" fill="currentColor" transform="rotate(-55 7 14)" />
      {/* Leaf 5 */}
      <ellipse cx="9" cy="9" rx="2" ry="4" fill="currentColor" transform="rotate(-60 9 9)" />
      {/* Leaf 6 - top */}
      <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" transform="rotate(-70 12 5)" />
    </svg>
  );
}

export default function Signup() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  if (user && !authLoading) {
    return <Navigate to="/" replace />;
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Navigate to personal information step with email
    navigate('/signup/personal-information', { state: { email } });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5] p-3 lg:p-4">
      <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3">
        {/* LEFT SIDE - White Form Card */}
        <div className="w-full lg:w-1/2 min-h-[calc(100vh-24px)] lg:min-h-[calc(100vh-32px)] bg-white rounded-3xl shadow-lg flex flex-col items-center justify-center px-8 lg:px-12 py-12">
          <div className="w-full max-w-[380px]">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Logo variant="light" height={48} linkTo="/" />
            </div>

            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200">
                🎓 FREE FOR STUDENTS
              </span>
            </div>

            {/* Headline */}
            <div className="text-center mb-10">
              <h1 
                className="text-7xl font-normal text-gray-900 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Free
              </h1>
              <p 
                className="text-2xl text-gray-400 mb-3"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 300 }}
              >
                for your first semester
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Then $4.99/month. Cancel anytime.
              </p>
              <p className="text-sm text-gray-600">
                Take control of your academic future — start today.
              </p>
            </div>

            {/* Google Sign-in Button - BIGGER */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 mb-6 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-base font-medium rounded-xl shadow-sm"
              onClick={async () => {
                setGoogleLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  toast.error('Google sign up failed', { description: error.message });
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-400">Or sign up with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleContinue} className="space-y-5">
              <div className="space-y-1.5">
                <Input
                  id="email"
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-16 bg-white border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 rounded-xl text-base px-5 ${error ? 'border-red-500' : ''}`}
                />
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-white font-medium bg-gray-900 hover:bg-gray-800 rounded-xl text-base"
              >
                Continue
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-gray-900 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Earth Visual Card */}
        <div 
          className="hidden lg:flex lg:w-1/2 min-h-[calc(100vh-32px)] flex-col items-center justify-center p-12 relative overflow-hidden rounded-3xl"
          style={{
            backgroundImage: `url(${starTrailsHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Content */}
          <div className="relative z-10 text-center max-w-lg">
            <h2 
              className="text-3xl lg:text-4xl text-white mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Track grades, ask anything.
            </h2>
            <h2 
              className="text-3xl lg:text-4xl text-white mb-10"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="italic">Own</span> your grades.
            </h2>

            {/* Social Proof Badge */}
            <div className="flex items-center justify-center gap-2 mb-10">
              <LaurelWreath side="left" />
              
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-xs tracking-[0.2em] text-white/60 uppercase font-medium">10K+ Students</span>
              </div>
              
              <LaurelWreath side="right" />
            </div>

            <GPAChart />
          </div>
        </div>
      </div>
    </div>
  );
}
