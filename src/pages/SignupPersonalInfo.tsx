import { useState, useMemo } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, GraduationCap, Check } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be at most 64 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
});

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function PasswordRequirements({ password }: { password: string }) {
  const requirements: PasswordRequirement[] = useMemo(() => [
    { label: '1 uppercase', met: /[A-Z]/.test(password) },
    { label: '1 lowercase', met: /[a-z]/.test(password) },
    { label: '1 number', met: /[0-9]/.test(password) },
    { label: '8 to 64 characters', met: password.length >= 8 && password.length <= 64 },
    { label: '1 special character', met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  return (
    <div className="mt-3 space-y-2">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
              req.met 
                ? 'bg-teal-500 border-teal-500' 
                : 'border-gray-300 bg-white'
            }`}
          >
            {req.met && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          <span className={`text-sm ${req.met ? 'text-gray-700' : 'text-gray-400'}`}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SignupPersonalInfo() {
  const { user, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from previous step
  const emailFromPreviousStep = location.state?.email || '';
  
  const [email, setEmail] = useState(emailFromPreviousStep);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  if (user && !authLoading) {
    return <Navigate to="/" replace />;
  }

  // Redirect to signup if no email provided
  if (!emailFromPreviousStep && !authLoading) {
    return <Navigate to="/signup" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({ fullName, email, password });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Account exists', { description: 'An account with this email already exists. Please sign in instead.' });
      } else {
        toast.error('Sign up failed', { description: error.message });
      }
    } else {
      toast.success('Account created!', { description: "Welcome to SIGMA! Let's set up your profile." });
      navigate('/onboarding');
    }
  };

  const handleBack = () => {
    navigate('/signup', { state: { email } });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">SIGMA</span>
          </div>
        </div>

        {/* Headline */}
        <h1 
          className="text-4xl lg:text-5xl text-center text-gray-900 mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Create an account
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email - Pre-filled */}
          <div className="space-y-1.5">
            <Input
              id="email"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-14 bg-gray-50 border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 rounded-xl text-base ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Input
              id="fullName"
              type="text"
              placeholder="Your full legal name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`h-14 bg-gray-50 border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 rounded-xl text-base ${errors.fullName ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-14 bg-gray-50 border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 rounded-xl text-base pr-12 ${errors.password ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
            
            {/* Password Requirements */}
            <PasswordRequirements password={password} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-14 font-medium border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-base"
              disabled={loading}
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-14 text-white font-medium bg-gray-900 hover:bg-gray-800 rounded-xl text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </form>

        {/* Terms notice */}
        <p className="mt-8 text-center text-sm text-gray-400">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-gray-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-gray-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
