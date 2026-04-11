import { useState } from 'react';
import graduationHero from '@/assets/graduation-hero.jpg';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [query, setQuery] = useState('');

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative">
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION - Full viewport with sky background */}
      {/* ═══════════════════════════════════════════════════════ */}
      
      <section className="min-h-screen relative overflow-hidden">
        {/* Background - Building sky photo with overlay and bottom transition */}
        <div className="absolute inset-0 -z-10">
          <img
            src={graduationHero}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 70%' }}
          />
          {/* Light overlay for text readability */}
          <div className="absolute inset-0 bg-black/20" />
          {/* Bottom gradient transition to dark section */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
          <Logo variant="dark" height={48} linkTo="/" />
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-white/80 hover:text-white transition font-medium px-4 py-2 text-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-5 py-2.5 bg-white text-slate-900 rounded-full font-semibold text-sm hover:bg-white/90 transition"
            >
              Get Started
            </button>
          </div>
        </nav>
        
        {/* Hero Content */}
        <main className="relative z-10 flex flex-col items-center justify-start pt-16 md:pt-24 min-h-[calc(100vh-88px)] px-6 py-12 text-center">
          <div className="mb-8 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-amber-400" />
              AI-Powered Grade Tracking
            </span>
          </div>
          
          <h1 className="mb-8 text-5xl md:text-7xl lg:text-8xl text-white leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="font-playfair italic font-normal">Own</span>{' '}
            <span className="font-playfair font-normal">your grades.</span>
          </h1>
          
          <p className="max-w-2xl mb-10 text-lg md:text-xl text-white/70 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            SIGMA is your personal AI academic assistant.
            <br className="hidden md:block" />
            Track your GPA, predict your future, and stay on top of every assignment—effortlessly.
          </p>
          
          <button
            onClick={() => navigate('/signup')}
            className="group mb-14 px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-sm uppercase tracking-wider hover:bg-white/90 transition-all flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            Get Started
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="w-full max-w-xl mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try: "What do I need on my final to get a B?"'
                className="w-full px-6 py-4 pr-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/signup');
                  }
                }}
              />
              <button 
                onClick={() => navigate('/signup')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <p className="text-white/50 text-sm tracking-widest uppercase mb-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Track everything. Know everything.
          </p>

          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ChevronDown className="h-6 w-6 text-white/40" />
          </div>
        </main>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* IPHONE MOCKUP SECTION - Dark background */}
      {/* ═══════════════════════════════════════════════════════ */}
      
      <section className="relative min-h-screen bg-[#0a0a0a] overflow-hidden py-24 md:py-32">
        {/* Headline */}
        <div className="text-center mb-8 md:mb-12 px-6">
          <h2 className="text-5xl md:text-7xl lg:text-8xl text-white leading-tight">
            <span className="font-playfair italic font-normal">Take</span>{' '}
            <span className="font-playfair font-normal">control of your grades.</span>
          </h2>
        </div>

        {/* iPhone Mockup Container - with perspective wrapper */}
        <div 
          className="relative flex items-center justify-center px-6 pt-8"
          style={{
            perspective: '2000px',
            perspectiveOrigin: 'center 40%'
          }}
        >
          {/* Soft shadow under phone - like it's laying on a surface */}
          <div 
            className="absolute w-[700px] h-[400px] md:w-[1000px] md:h-[500px] bg-black/50 blur-[80px] rounded-[50%]"
            style={{
              transform: 'translateY(150px)',
            }}
          />
          
          {/* iPhone Frame with horizontal laying-flat perspective */}
          <div 
            className="relative z-10"
            style={{
              transform: 'rotateX(65deg) rotateY(-5deg) rotateZ(-2deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 3D Phone wrapper with depth */}
            <div 
              className="relative"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Phone outer frame - titanium look with 3D depth */}
              <div 
                className="relative w-[380px] md:w-[480px] lg:w-[540px] rounded-[50px] md:rounded-[60px] p-3"
                style={{
                  background: 'linear-gradient(180deg, #4a4a4c 0%, #2c2c2e 20%, #1c1c1e 80%, #0c0c0e 100%)',
                  boxShadow: '0 80px 150px -30px rgba(0,0,0,0.9), 0 40px 80px -20px rgba(0,0,0,0.8)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Frame edge highlight - top edge reflection */}
                <div 
                  className="absolute inset-x-0 top-0 h-[3px] rounded-t-[50px] md:rounded-t-[60px]"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0.05) 100%)',
                  }}
                />
                
                {/* Side frame depth - left edge */}
                <div 
                  className="absolute left-0 top-[50px] bottom-[50px] w-[4px]"
                  style={{
                    background: 'linear-gradient(180deg, #5a5a5c 0%, #3a3a3c 50%, #2a2a2c 100%)',
                    transform: 'translateZ(-4px) rotateY(-90deg)',
                    transformOrigin: 'right center',
                  }}
                />
                
                {/* Side frame depth - right edge */}
                <div 
                  className="absolute right-0 top-[50px] bottom-[50px] w-[4px]"
                  style={{
                    background: 'linear-gradient(180deg, #3a3a3c 0%, #2a2a2c 50%, #1a1a1c 100%)',
                    transform: 'translateZ(-4px) rotateY(90deg)',
                    transformOrigin: 'left center',
                  }}
                />
                
                {/* Side buttons - Volume (left side) */}
                <div className="absolute -left-[5px] top-[80px] w-[5px] h-[30px] bg-gradient-to-b from-[#4a4a4c] to-[#2a2a2c] rounded-l-sm" />
                <div className="absolute -left-[5px] top-[120px] w-[5px] h-[50px] bg-gradient-to-b from-[#4a4a4c] to-[#2a2a2c] rounded-l-sm" />
                <div className="absolute -left-[5px] top-[180px] w-[5px] h-[50px] bg-gradient-to-b from-[#4a4a4c] to-[#2a2a2c] rounded-l-sm" />
                {/* Side button - Power (right side) */}
                <div className="absolute -right-[5px] top-[140px] w-[5px] h-[70px] bg-gradient-to-b from-[#3a3a3c] to-[#1a1a1c] rounded-r-sm" />
                
                {/* Inner screen bezel */}
                <div className="bg-black rounded-[42px] md:rounded-[52px] overflow-hidden border border-[#2a2a2a]">
                  {/* Dynamic Island */}
                  <div className="relative h-9 flex items-center justify-center bg-black">
                    <div className="w-[110px] h-[32px] bg-black rounded-full flex items-center justify-center gap-3">
                      {/* Front camera */}
                      <div className="w-3 h-3 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0d3b66]/80" />
                      </div>
                      {/* Face ID sensors */}
                      <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                    </div>
                  </div>
                  
                  {/* Screen Content - SIGMA Dashboard */}
                  <div className="bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] px-5 pb-6 min-h-[480px] md:min-h-[600px] lg:min-h-[680px]">
                    {/* Status bar */}
                    <div className="flex items-center justify-between text-[10px] text-white/60 mb-4 pt-1">
                      <span className="font-medium">9:40</span>
                      <div className="flex items-center gap-1">
                        <div className="flex gap-[2px]">
                          <div className="w-[3px] h-[6px] bg-white/60 rounded-sm" />
                          <div className="w-[3px] h-[8px] bg-white/60 rounded-sm" />
                          <div className="w-[3px] h-[10px] bg-white/60 rounded-sm" />
                          <div className="w-[3px] h-[12px] bg-white/40 rounded-sm" />
                        </div>
                        <span className="ml-1">100%</span>
                      </div>
                    </div>
                    
                    {/* App Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-white/60 text-[11px]">Good morning</p>
                        <p className="text-white font-semibold text-base">Dashboard</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold">JD</span>
                      </div>
                    </div>
                    
                    {/* GPA Card with chart line like reference */}
                    <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs uppercase tracking-wider">Current GPA</span>
                        <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                          <TrendingUp className="h-3 w-3" />
                          <span>+5.8%</span>
                        </div>
                      </div>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">3.85</span>
                        <span className="text-white/30 text-sm mb-1">/ 4.00</span>
                      </div>
                      {/* Line chart like reference */}
                      <div className="h-16 relative">
                        <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,40 Q20,38 40,35 T80,30 T120,25 T160,15 T200,10"
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="2"
                          />
                          <path
                            d="M0,40 Q20,38 40,35 T80,30 T120,25 T160,15 T200,10 L200,50 L0,50 Z"
                            fill="url(#areaGradient)"
                          />
                        </svg>
                        {/* Time labels */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-white/30">
                          <span>1W</span>
                          <span>1M</span>
                          <span>3M</span>
                          <span>YTD</span>
                          <span>ALL</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-white/5">
                        <p className="text-white/40 text-[10px] mb-1">Assignments</p>
                        <p className="text-white font-semibold text-base">12/15</p>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-white/5">
                        <p className="text-white/40 text-[10px] mb-1">Due This Week</p>
                        <p className="text-white font-semibold text-base">3</p>
                      </div>
                    </div>
                    
                    {/* Course List */}
                    <div className="space-y-2">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Courses</p>
                      
                      <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-[10px] font-bold">CS</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">COP 3530</p>
                            <p className="text-white/30 text-[9px]">Data Structures</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold text-sm">A</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 text-[10px] font-bold">MA</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">MAC 2312</p>
                            <p className="text-white/30 text-[9px]">Calculus II</p>
                          </div>
                        </div>
                        <span className="text-purple-400 font-bold text-sm">B+</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <span className="text-amber-400 text-[10px] font-bold">PH</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">PHY 2048</p>
                            <p className="text-white/30 text-[9px]">Physics I</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold text-sm">A-</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Home indicator */}
                  <div className="h-7 bg-black flex items-center justify-center">
                    <div className="w-28 h-1 bg-white/20 rounded-full" />
                  </div>
                </div>
                
                {/* Bottom edge with USB-C and speakers - visible in this perspective */}
                <div 
                  className="absolute -bottom-[12px] left-[60px] right-[60px] h-[12px] flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 100%)',
                    borderRadius: '0 0 8px 8px',
                    transform: 'rotateX(-90deg)',
                    transformOrigin: 'top center',
                  }}
                >
                  {/* Left speaker grills */}
                  <div className="flex gap-[3px]">
                    {[...Array(6)].map((_, i) => (
                      <div key={`l-${i}`} className="w-[3px] h-[3px] rounded-full bg-[#1a1a1a]" />
                    ))}
                  </div>
                  
                  {/* USB-C port */}
                  <div className="w-[20px] h-[6px] bg-[#0a0a0a] rounded-full mx-2" />
                  
                  {/* Right speaker grills */}
                  <div className="flex gap-[3px]">
                    {[...Array(6)].map((_, i) => (
                      <div key={`r-${i}`} className="w-[3px] h-[3px] rounded-full bg-[#1a1a1a]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}

      <section className="relative z-10 px-6 py-24 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl text-white mb-6">
            <span className="font-playfair italic font-normal">Ready</span>{' '}
            <span className="font-playfair font-normal">to take control?</span>
          </h2>
          <p className="text-lg text-white/60 mb-10">
            Join students who've already transformed how they track their academic success.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="group px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg hover:bg-white/90 transition-all flex items-center gap-2 mx-auto"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-white/40 text-sm mt-4">No credit card required</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FIXED BOTTOM NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════ */}
      
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-4xl">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full">
          {/* Logo */}
          <Logo variant="dark" height={32} linkTo="/" />
          
          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6">
            <button className="flex items-center gap-1 text-white/70 hover:text-white transition text-sm font-medium">
              FEATURES
              <Plus className="h-3 w-3" />
            </button>
            <button className="text-white/70 hover:text-white transition text-sm font-medium">
              FOR STUDENTS
            </button>
            <button className="text-white/70 hover:text-white transition text-sm font-medium">
              RESOURCES
            </button>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-white/70 hover:text-white transition text-sm font-medium hidden sm:block"
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-semibold text-sm hover:bg-white/90 transition"
            >
              GET STARTED
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════ */}

      <footer className="relative z-10 px-6 py-8 pb-24 bg-[#0a0a0a] border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo variant="dark" height={24} linkTo={false} />
            <span className="text-white/60 text-sm">© 2025 SIGMA. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/terms" className="text-white/60 hover:text-white text-sm transition">Terms</a>
            <a href="/privacy" className="text-white/60 hover:text-white text-sm transition">Privacy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
