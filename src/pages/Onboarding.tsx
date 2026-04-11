import { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  GraduationCap, 
  AlertTriangle, 
  User, 
  Target, 
  Upload, 
  ChevronRight, 
  ChevronLeft,
  MessageSquare,
  FileText
} from 'lucide-react';

const currentYear = new Date().getFullYear();
const graduationYears = Array.from({ length: 8 }, (_, i) => currentYear + i);

const SIGNUP_SOURCES = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'friend', label: 'Friend or Classmate' },
  { value: 'google', label: 'Google Search' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'other', label: 'Other' },
];

const PRIMARY_CHALLENGES = [
  { value: 'tracking', label: 'Keeping track of all my assignments' },
  { value: 'current_grade', label: 'Knowing my current grade in each class' },
  { value: 'finals_planning', label: 'Planning what I need on finals' },
  { value: 'motivation', label: 'Staying motivated to study' },
  { value: 'time_management', label: 'Managing my time' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Disclaimer
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(
    profile?.has_accepted_disclaimer ?? false
  );
  
  // Step 2: Profile
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [graduationYear, setGraduationYear] = useState<string>(
    profile?.graduation_year?.toString() || ''
  );
  
  // Step 3: Survey
  const [signupSource, setSignupSource] = useState(profile?.signup_source || '');
  const [primaryChallenge, setPrimaryChallenge] = useState(profile?.primary_challenge || '');
  
  // Step 4: GPA Goal
  const [gpaGoal, setGpaGoal] = useState(profile?.gpa_goal || 3.5);
  
  // Step 5: Syllabus Upload
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Redirect if not logged in or already onboarded
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!authLoading && profile?.has_completed_onboarding) {
    return <Navigate to="/" replace />;
  }

  const totalSteps = 5;

  const handleNextStep = async () => {
    if (step === 1) {
      if (!acceptedDisclaimer) {
        toast.error('Please accept the disclaimer', { description: 'You must accept the disclaimer to continue.' });
        return;
      }

      setLoading(true);
      const { error } = await updateProfile({
        has_accepted_disclaimer: true,
      });
      setLoading(false);

      if (error) {
        toast.error('Error saving disclaimer', { description: error.message });
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!fullName.trim()) {
        toast.error('Name required', { description: 'Please enter your name.' });
        return;
      }

      setLoading(true);
      const { error } = await updateProfile({
        full_name: fullName,
        university: university || null,
        major: major || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
      });
      setLoading(false);

      if (error) {
        toast.error('Error saving profile', { description: error.message });
        return;
      }

      setStep(3);
    } else if (step === 3) {
      // Save survey responses
      setLoading(true);
      const { error } = await updateProfile({
        signup_source: signupSource || null,
        primary_challenge: primaryChallenge || null,
      });
      setLoading(false);

      if (error) {
        toast.error('Error saving survey', { description: error.message });
        return;
      }

      setStep(4);
    } else if (step === 4) {
      // Save GPA goal
      setLoading(true);
      const { error } = await updateProfile({
        gpa_goal: gpaGoal,
      });
      setLoading(false);

      if (error) {
        toast.error('Error saving GPA goal', { description: error.message });
        return;
      }

      setStep(5);
    } else if (step === 5) {
      // Complete onboarding
      setLoading(true);
      const { error } = await updateProfile({
        has_completed_onboarding: true,
      });
      setLoading(false);

      if (error) {
        toast.error('Error completing onboarding', { description: error.message });
      } else {
        toast.success('Welcome to SIGMA! 🎓', { description: 'Your profile has been set up. Start by adding your first course!' });
        
        // If they uploaded a file, go to upload page, otherwise courses
        if (uploadedFile) {
          navigate('/courses/upload');
        } else {
          navigate('/courses');
        }
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Invalid file type', { description: 'Please upload a PDF file.' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', { description: 'Please upload a file smaller than 10MB.' });
      return;
    }

    setUploadedFile(file);
  };

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-primary'
                    : s < step
                    ? 'w-4 bg-primary'
                    : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Welcome + Disclaimer */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Welcome to SIGMA! 🎓</h1>
                <p className="text-muted-foreground mt-2">
                  Your AI-powered academic intelligence assistant
                </p>
              </div>

              <div className="bg-warning-light border border-warning/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">IMPORTANT DISCLAIMER</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      SIGMA is a grade <strong>TRACKING</strong> and <strong>ESTIMATION</strong> tool only. Please note:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Grades shown are estimates based on the information you provide</li>
                      <li>• Professors may change syllabi, weights, or grading policies at any time</li>
                      <li>• Always verify with your official university portal and professors for accurate grades</li>
                      <li>• SIGMA is not responsible for any academic outcomes or decisions made based on our estimates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="disclaimer"
                  checked={acceptedDisclaimer}
                  onCheckedChange={(checked) => setAcceptedDisclaimer(checked === true)}
                />
                <Label htmlFor="disclaimer" className="text-sm leading-tight cursor-pointer">
                  I understand that SIGMA provides estimates only and is not responsible for my academic outcomes
                </Label>
              </div>

              <Button 
                onClick={handleNextStep}
                className="w-full gradient-primary text-white font-medium h-11"
                disabled={!acceptedDisclaimer || loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                I Understand, Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Profile Setup */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Let's set up your profile</h1>
                <p className="text-muted-foreground mt-1">Step 1 of {totalSteps}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">What's your name?</Label>
                  <Input
                    id="fullName"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">What university do you attend?</Label>
                  <Input
                    id="university"
                    placeholder="🔍 Search universities..."
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">What's your major?</Label>
                  <Input
                    id="major"
                    placeholder="e.g., Computer Science"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected graduation year?</Label>
                  <Select value={graduationYear} onValueChange={setGraduationYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {graduationYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  className="flex-1 gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Survey */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Help us help you better</h1>
                <p className="text-muted-foreground mt-1">Step 2 of {totalSteps}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">How did you hear about SIGMA?</Label>
                  <RadioGroup value={signupSource} onValueChange={setSignupSource}>
                    {SIGNUP_SOURCES.map((source) => (
                      <div key={source.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value={source.value} id={source.value} />
                        <Label htmlFor={source.value} className="cursor-pointer flex-1">{source.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">What's your biggest challenge with grades?</Label>
                  <RadioGroup value={primaryChallenge} onValueChange={setPrimaryChallenge}>
                    {PRIMARY_CHALLENGES.map((challenge) => (
                      <div key={challenge.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value={challenge.value} id={challenge.value} />
                        <Label htmlFor={challenge.value} className="cursor-pointer flex-1">{challenge.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  className="flex-1 gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: GPA Goal */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">What's your GPA goal? 🎯</h1>
                <p className="text-muted-foreground mt-1">Step 3 of {totalSteps}</p>
              </div>

              <div className="py-8">
                <div className="text-center mb-8">
                  <span className="text-5xl font-bold gradient-text">{gpaGoal.toFixed(2)}</span>
                </div>
                
                <div className="px-4">
                  <Slider
                    value={[gpaGoal]}
                    onValueChange={([value]) => setGpaGoal(value)}
                    min={2.0}
                    max={4.0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>2.0</span>
                    <span>4.0</span>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    gpaGoal >= 3.7 ? 'bg-success-light text-success' :
                    gpaGoal >= 3.5 ? 'bg-info-light text-info' :
                    gpaGoal >= 3.0 ? 'bg-warning-light text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {gpaGoal >= 3.7 ? "🏆 Summa Cum Laude: 3.7+" :
                     gpaGoal >= 3.5 ? "🏆 Dean's List: 3.5+" :
                     gpaGoal >= 3.0 ? "Honor Roll: 3.0+" :
                     "Keep pushing!"}
                  </span>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  We'll track your progress toward this goal and alert you if you're falling behind.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  className="flex-1 gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Syllabus Upload */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Upload your first syllabus! 📄</h1>
                <p className="text-muted-foreground mt-1">Step 4 of {totalSteps}</p>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('onboarding-file-input')?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : uploadedFile
                    ? 'border-success bg-success/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                )}
              >
                <input
                  id="onboarding-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleInputFileChange}
                />

                {uploadedFile ? (
                  <>
                    <FileText className="w-10 h-10 text-success mx-auto mb-3" />
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">
                      Drag & drop your syllabus PDF here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Our AI will automatically extract:</p>
                      <p>✓ Course info & schedule</p>
                      <p>✓ All assignments & due dates</p>
                      <p>✓ Grading weights</p>
                      <p>✓ Instructor details</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Supports PDF up to 10MB</p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setUploadedFile(null);
                    handleNextStep();
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={handleNextStep}
                  className="flex-1 gradient-primary text-white"
                  disabled={loading || !uploadedFile}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upload & Finish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
