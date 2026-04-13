import { useRef, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  RefreshCw,
  Brain,
  LayoutDashboard,
  FileText,
  Link2,
  Rocket,
  Check,
  AlertCircle,
  Calculator,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';

// ─── Scroll-reveal wrapper ──────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.65s ease, transform 0.65s ease',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Feature visual cards (CSS-only, no images) ─────────────────────────────
function SyncVisual() {
  return (
    <div className="bg-white rounded-2xl shadow-glass-md border border-gray-100 p-6 w-full max-w-sm mx-auto hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#14B8A6]" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canvas Sync</span>
      </div>
      <div className="space-y-3">
        {['COP 3530 · Data Structures', 'MAC 2312 · Calculus II', 'PHY 2048 · Physics I'].map(
          (course, i) => (
            <div
              key={course}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
              style={{
                opacity: 1,
                animation: `fadeSlide 0.4s ease ${i * 0.1 + 0.2}s both`,
              }}
            >
              <span className="text-sm font-medium text-[#1E293B]">{course}</span>
              <div className="flex items-center gap-1.5 text-[#14B8A6]">
                <Check className="w-4 h-4" />
                <span className="text-xs font-semibold">Synced</span>
              </div>
            </div>
          ),
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Last synced 2 min ago</span>
        <RefreshCw className="w-3.5 h-3.5 text-[#14B8A6]" />
      </div>
    </div>
  );
}

function GradeVisual() {
  return (
    <div className="bg-white rounded-2xl shadow-glass-md border border-gray-100 p-6 w-full max-w-sm mx-auto hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-violet-500" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grade Prediction</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">What do you need on the final?</p>
      <div className="space-y-2.5">
        {[
          { grade: 'A', score: '78%', color: '#14B8A6', width: '78%' },
          { grade: 'B', score: '61%', color: '#7c3aed', width: '61%' },
          { grade: 'C', score: '44%', color: '#f59e0b', width: '44%' },
        ].map(({ grade, score, color, width }) => (
          <div key={grade}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-600">To earn an {grade}</span>
              <span className="font-bold" style={{ color }}>{score}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <span className="text-xs text-gray-400">Current grade: </span>
        <span className="text-xs font-bold text-[#14B8A6]">84.2% · B</span>
      </div>
    </div>
  );
}

function DashboardVisual() {
  return (
    <div className="bg-white rounded-2xl shadow-glass-md border border-gray-100 p-6 w-full max-w-sm mx-auto hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Overview</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-[#14B8A6]/8 border border-[#14B8A6]/20">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">GPA</p>
          <p className="text-xl font-bold text-[#1E293B]">3.72</p>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Due Soon</p>
          <p className="text-xl font-bold text-[#1E293B]">3</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { dot: '#14B8A6', label: 'COP Essay', time: 'Today, 11:59 PM' },
          { dot: '#7c3aed', label: 'MAC Quiz 4', time: 'Tomorrow, 9 AM' },
          { dot: '#f59e0b', label: 'PHY Lab Report', time: 'Friday, 5 PM' },
        ].map(({ dot, label, time }) => (
          <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E293B] truncate">{label}</p>
              <p className="text-[11px] text-gray-400">{time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Smooth scroll + navbar shadow on scroll
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  if (user && !loading) return <Navigate to="/dashboard" replace />;

  return (
    <div className="bg-[#FAFAFA] text-[#1E293B] overflow-x-hidden">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
        <nav className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Logo variant="light" height={34} linkTo="/" />

          {/* Anchor links — desktop */}
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-gray-500 hover:text-[#1E293B] transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#1E293B] transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14B8A6] text-white text-sm font-semibold rounded-xl hover:bg-[#0f9e8e] transition-colors"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-5 py-24 overflow-hidden text-center">
        {/* Background gradient orbs */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(20,184,166,0.12) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)',
          }}
        />
        {/* Geometric accent — top left */}
        <div
          className="absolute top-20 left-10 w-16 h-16 rounded-2xl opacity-20 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #14B8A6, #7c3aed)', transform: 'rotate(18deg)' }}
        />
        {/* Geometric accent — bottom right */}
        <div
          className="absolute bottom-20 right-14 w-10 h-10 rounded-xl opacity-15 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #14B8A6)', transform: 'rotate(-12deg)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="animate-fade-in inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/25 text-[#0f9e8e] text-xs font-semibold mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] inline-block" />
            Designed for Florida College Students
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.06] tracking-tight mb-6"
            style={{ animationDelay: '0.08s' }}
          >
            Your semester, under control.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #8b5cf6 100%)' }}
            >
              Your time, back to you.
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="animate-fade-in text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ animationDelay: '0.18s' }}
          >
            Upload your syllabus. SIGMA reads every deadline, every assignment,
            every grade weight — and keeps track so you don't have to. Check
            where you stand in 30 seconds, from anywhere.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
            style={{ animationDelay: '0.28s' }}
          >
            <button
              onClick={() => navigate('/signup')}
              className="group flex items-center gap-2 px-7 py-4 md:px-9 md:py-5 bg-[#14B8A6] text-white font-semibold text-base rounded-xl hover:bg-[#0f9e8e] transition-all shadow-md hover:shadow-xl active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-4 md:px-9 md:py-5 text-gray-600 font-medium text-base rounded-xl border border-gray-200 hover:border-gray-300 hover:text-[#1E293B] bg-white transition-all"
            >
              Sign In
            </button>
          </div>

          <p
            className="animate-fade-in text-sm text-gray-400"
            style={{ animationDelay: '0.38s' }}
          >
            No credit card required · Free for up to 2 courses
          </p>
        </div>
      </section>

      {/* ── PROBLEM ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-32 px-5">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#14B8A6] mb-3">You're not imagining it.</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
              You're not the problem.
              <br />
              Your tools are.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: AlertCircle,
                color: '#ef4444',
                bg: 'rgba(239,68,68,0.07)',
                text: 'Missed a deadline because you forgot to check Canvas',
                delay: 0,
              },
              {
                icon: Calculator,
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.07)',
                text: 'Calculated your grade wrong and panicked before finals',
                delay: 100,
              },
              {
                icon: Layers,
                color: '#7c3aed',
                bg: 'rgba(124,58,237,0.07)',
                text: "Used your lunch break to figure out what's due this week instead of actually eating",
                delay: 200,
              },
            ].map(({ icon: Icon, color, bg, text, delay }) => (
              <FadeIn key={text} delay={delay}>
                <div className="p-7 rounded-2xl bg-gray-50 border border-gray-100 h-full hover:scale-[1.02] transition-all duration-300 hover:shadow-glass-sm cursor-default">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-[#1E293B] font-medium leading-relaxed">{text}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={300} className="mt-10 text-center">
            <p className="text-gray-400 text-sm">
              You're not alone. 70% of working students miss at least one deadline per semester.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#FAFAFA] py-32 px-5">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#14B8A6] mb-3">What changes when you use SIGMA</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
              One app. Zero missed deadlines.
            </h2>
          </FadeIn>

          {/* Feature 1 — text left, visual right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <FadeIn>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#14B8A6]">Feature 01</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-4 leading-tight">
                Your classes, always current
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                Connect your school account once. Every new assignment, grade
                update, and due date shows up in SIGMA automatically — before
                you even think to check.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="text-[#14B8A6] font-semibold text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </button>
            </FadeIn>
            <FadeIn delay={150}>
              <SyncVisual />
            </FadeIn>
          </div>

          {/* Feature 2 — visual left, text right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <FadeIn delay={150} className="order-last md:order-first">
              <GradeVisual />
            </FadeIn>
            <FadeIn>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-violet-500">Feature 02</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-4 leading-tight">
                Know your grade before the final hits
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                See exactly what score you need on every remaining assignment
                to reach your goal. No spreadsheet math. No guessing at 1am.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="text-violet-500 font-semibold text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                See your grade predictions <ArrowRight className="w-4 h-4" />
              </button>
            </FadeIn>
          </div>

          {/* Feature 3 — text left, visual right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Feature 03</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-4 leading-tight">
                Everything in One Dashboard
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                All your courses, deadlines, grades, and insights — one screen.
                Check it in 30 seconds between classes or shifts.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="text-amber-500 font-semibold text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                See the dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </FadeIn>
            <FadeIn delay={150}>
              <DashboardVisual />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-32 px-5">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#14B8A6] mb-3">Simple by design</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
              Get started in under 2 minutes.
            </h2>
          </FadeIn>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-10 left-[calc(100%/6+20px)] right-[calc(100%/6+20px)] h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, #14B8A6, #7c3aed, transparent)',
                opacity: 0.3,
              }}
            />

            {[
              {
                step: 1,
                icon: FileText,
                title: 'Upload Your Syllabus',
                body: 'Drop your PDF. SIGMA reads every assignment, weight, and due date automatically.',
                delay: 0,
              },
              {
                step: 2,
                icon: Link2,
                title: 'Connect Canvas',
                body: 'Link your account in one click. Grades and deadlines sync continuously.',
                delay: 130,
              },
              {
                step: 3,
                icon: Rocket,
                title: 'Stay Ahead',
                body: 'Get notified before anything slips. See your real grade standing at any moment. Know what to focus on this week — and what can wait.',
                delay: 260,
              },
            ].map(({ step, icon: Icon, title, body, delay }) => (
              <FadeIn key={step} delay={delay} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-glass-sm">
                    <Icon className="w-8 h-8 text-[#1E293B]" />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #14B8A6, #7c3aed)' }}
                  >
                    {step}
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#1E293B] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────────── */}
      <section className="bg-[#FAFAFA] py-20 px-5">
        <FadeIn className="max-w-2xl mx-auto text-center">
          {/* Gradient quote mark */}
          <div
            className="text-7xl font-serif leading-none mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #14B8A6, #7c3aed)' }}
          >
            "
          </div>
          <p className="text-xl md:text-2xl font-medium text-[#1E293B] leading-relaxed mb-3">
            Built by a student who works full-time and studies full-time.
          </p>
          <p className="text-gray-500 leading-relaxed mb-6">
            SIGMA was born from the frustration of getting off a 9-hour shift,
            opening your laptop, and realizing you have no idea what's due
            tomorrow. There had to be a better way.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #7c3aed)' }}
            >
              N
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#1E293B]">Nicolas Navarro</p>
              <p className="text-xs text-gray-400">Founder · FAU Student · Works Full-Time</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-32 px-5">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#14B8A6] mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
              Less than a cup of coffee.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <FadeIn delay={0}>
              <div className="p-8 rounded-2xl border border-gray-200 bg-gray-50 h-full flex flex-col hover:scale-[1.02] transition-all duration-300 hover:shadow-glass-sm">
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Free</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-[#1E293B]">$0</span>
                    <span className="text-gray-400 mb-1.5">/month</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Perfect for getting started.</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {[
                    'Up to 2 courses',
                    'Syllabus upload & parsing',
                    'Basic grade dashboard',
                    'Deadline calendar',
                    'Manual grade entry',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 rounded-xl border border-gray-300 text-[#1E293B] font-semibold text-sm hover:border-gray-400 hover:bg-white transition-all"
                >
                  Start Free
                </button>
              </div>
            </FadeIn>

            {/* Pro */}
            <FadeIn delay={120}>
              <div
                className="p-8 rounded-2xl border-2 h-full flex flex-col relative overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-glass-sm"
                style={{ borderColor: '#14B8A6', background: 'linear-gradient(160deg, rgba(20,184,166,0.04) 0%, white 50%)' }}
              >
                {/* Popular badge */}
                <div
                  className="absolute top-5 right-5 px-3 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: 'linear-gradient(135deg, #14B8A6, #7c3aed)' }}
                >
                  Most Popular
                </div>
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#14B8A6] mb-2">Pro</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-[#1E293B]">$4.99</span>
                    <span className="text-gray-400 mb-1.5">/month</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">For students who want every edge.</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {[
                    'Unlimited courses',
                    'Canvas auto-sync',
                    'AI grade predictions',
                    'AI study advisor',
                    'Priority deadline alerts',
                    'GPA predictor',
                    'Everything in Free',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#1E293B]">
                      <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #14B8A6, #7c3aed)' }}
                >
                  Start Free →
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f9e8e 0%, #14B8A6 40%, #7c3aed 100%)' }}
      >
        {/* Subtle geometric shapes */}
        <div
          className="absolute top-8 right-16 w-24 h-24 rounded-2xl opacity-10 pointer-events-none"
          style={{ border: '2px solid white', transform: 'rotate(20deg)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-16 h-16 rounded-xl opacity-10 pointer-events-none"
          style={{ border: '2px solid white', transform: 'rotate(-15deg)' }}
        />

        <FadeIn className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Ready to own
            <br />
            your semester?
          </h2>
          <p className="text-white/75 text-lg mb-10 leading-relaxed">
            Join students who stopped drowning in tabs and started finishing the semester strong.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0f9e8e] font-bold text-base rounded-xl hover:bg-white/90 transition-all shadow-lg active:scale-[0.98]"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-white/55 text-sm mt-5">
            No credit card required · Free for up to 2 courses
          </p>
        </FadeIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] py-10 px-5 relative">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, #14B8A6, #8b5cf6)' }} />
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm font-medium">© 2026 NavTech · yoursigma.ai</p>
            <p className="text-gray-600 text-xs mt-1">Made with 💜 by a student, for students.</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Contact', href: 'mailto:hello@yoursigma.ai' },
              { label: 'Sign In', href: '/login' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
