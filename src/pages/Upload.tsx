import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, getCurrentSemesterId } from '@/lib/utils';
import { useSemesterStore } from '@/stores/useSemesterStore';
import { COURSE_COLORS } from '@/types';
import type { Assignment, AssignmentType, Instructor, Schedule } from '@/types';
import {
  Upload as UploadIcon,
  FileText,
  Loader2,
  Check,
  X,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { saveCourseToDatabase } from '@/hooks/useCourses';

type UploadStep = 'upload' | 'processing' | 'review';

const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: 'exam', label: 'Exam' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'homework', label: 'Homework' },
  { value: 'project', label: 'Project' },
  { value: 'paper', label: 'Paper' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'participation', label: 'Participation' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
  { value: 'lab', label: 'Lab' },
  { value: 'other', label: 'Other' },
];

const VALID_TYPES = new Set(ASSIGNMENT_TYPES.map(t => t.value));
const sanitizeType = (type: string): AssignmentType => 
  VALID_TYPES.has(type as AssignmentType) ? (type as AssignmentType) : 'other';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Helper to extract base64 from PDF for backend processing
async function extractBase64FromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove the data URL prefix to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCourse, activeSemesterId } = useSemesterStore();

  const [step, setStep] = useState<UploadStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Form state
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [section, setSection] = useState('');
  const [credits, setCredits] = useState(3);
  const [selectedColor, setSelectedColor] = useState<string>(COURSE_COLORS[0].value);

  const [instructor, setInstructor] = useState<Instructor>({
    name: '',
    email: '',
    officeHours: '',
    office: '',
  });

  const [schedule, setSchedule] = useState<Schedule>({
    days: [],
    startTime: '',
    endTime: '',
    location: '',
  });

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Drag and drop handlers
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

  const handleFileSelect = async (file: File) => {
    const isPdf = file.type === 'application/pdf';
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isPdf && !isText) {
      toast.error('Invalid file type', { description: 'Please upload a PDF or text file.' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', { description: 'Please upload a file smaller than 10MB.' });
      return;
    }

    setUploadedFile(file);
    
    try {
      if (isPdf) {
        // Extract base64 and parse with AI
        const base64Content = await extractBase64FromPDF(file);
        await parseWithAI({ pdfBase64: base64Content, fileName: file.name });
      } else {
        // Read text file directly
        const textContent = await file.text();
        await parseWithAI({ syllabusText: textContent });
      }
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('Error reading file', { description: 'Could not read the file. Try adding the course manually.' });
      setStep('review');
    }
  };

  const parseWithAI = async (body: { pdfBase64?: string; fileName?: string; syllabusText?: string }) => {
    if (!user) {
      toast.error('Not authenticated', { description: 'Please log in to save courses.' });
      return;
    }

    setStep('processing');

    try {
      const { data, error, response } = await supabase.functions.invoke('parse-syllabus', {
        body,
      });

      if (error) {
        let message = error.message || 'Failed to parse syllabus';
        if (response) {
          try {
            const errJson = await response.clone().json();
            if (typeof errJson?.error === 'string' && errJson.error.trim()) {
              message = errJson.error;
            }
          } catch {
            // ignore
          }
        }
        throw new Error(message);
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || 'Failed to parse syllabus');
      }

      const parsed = data.data;

      // Build course data from parsed result
      const parsedCode = parsed.course?.code || 'COURSE';
      const parsedName = parsed.course?.name || 'Unnamed Course';
      const parsedCredits = parsed.course?.credits || 3;

      const parsedInstructor: Instructor = {
        name: parsed.instructor?.name || '',
        email: parsed.instructor?.email || '',
        officeHours: parsed.instructor?.officeHours || '',
        office: parsed.instructor?.office || '',
      };

      let parsedSchedule: Schedule = { days: [], startTime: '', endTime: '', location: '' };
      // AI returns schedule as { meetings: [...], finalExam: {...} } per prompt schema;
      // fall back to treating the field itself as an array for older response shapes.
      const scheduleMeetings: Array<Record<string, string>> = Array.isArray(parsed.schedule?.meetings)
        ? (parsed.schedule.meetings as Array<Record<string, string>>)
        : Array.isArray(parsed.schedule)
        ? (parsed.schedule as Array<Record<string, string>>)
        : [];
      if (scheduleMeetings.length > 0) {
        const firstMeeting = scheduleMeetings[0];
        const dayMap: Record<string, string> = {
          'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
          'Thursday': 'Thu', 'Friday': 'Fri',
        };
        parsedSchedule = {
          days: scheduleMeetings.map((s) => dayMap[s.day] || s.day),
          startTime: firstMeeting.startTime?.replace(/\s?(AM|PM)/i, '') || '',
          endTime: firstMeeting.endTime?.replace(/\s?(AM|PM)/i, '') || '',
          location: firstMeeting.location || '',
        };
      }

      const parsedAssignments: Assignment[] = (parsed.assignments || []).map((a: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        name: typeof a.name === 'string' ? a.name : '',
        type: sanitizeType(typeof a.type === 'string' ? a.type : 'other'),
        weight: typeof a.weight === 'number' ? a.weight : 0,
        dueDate: typeof a.dueDate === 'string' ? a.dueDate : '',
        description: typeof a.description === 'string' ? a.description : '',
        score: null,
      }));

      const courseColor = COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)].value;

      // Save directly to database with all rich data
      const { courseId, error: saveError } = await saveCourseToDatabase(
        user.id,
        {
          code: parsedCode,
          name: parsedName,
          credits: parsedCredits,
          color: courseColor,
          semesterId: activeSemesterId,
          section: parsed.course?.section,
          crn: parsed.course?.crn,
          institution: parsed.course?.institution,
          deliveryMode: parsed.course?.deliveryMode,
          description: parsed.course?.description,
          instructor: parsedInstructor,
          teachingAssistant: parsed.teachingAssistant,
          schedule: parsedSchedule,
          finalExam: parsed.schedule?.finalExam ?? null,
          gradingScale: parsed.gradingScale,
          materials: parsed.materials,
          prerequisites: parsed.prerequisites,
          gradingCategories: parsed.gradingCategories,
          modules: parsed.modules,
          policies: parsed.policies,
          aiPolicy: parsed.aiPolicy,
          academicIntegrity: parsed.academicIntegrity,
          importantDates: parsed.importantDates,
          learningObjectives: parsed.learningObjectives,
          supportResources: parsed.supportResources,
          communication: parsed.communication,
        },
        parsedAssignments
      );

      if (saveError) {
        throw new Error(saveError.message);
      }

      // Add to local store for immediate UI update
      addCourse({
        id: courseId || Date.now().toString(),
        semesterId: activeSemesterId || getCurrentSemesterId(),
        code: parsedCode,
        name: parsedName,
        credits: parsedCredits,
        color: courseColor,
        instructor: parsedInstructor,
        schedule: parsedSchedule,
        assignments: parsedAssignments,
        createdAt: new Date().toISOString(),
      });

      toast.success('Course added!', { description: `${parsedCode} has been imported with ${parsedAssignments.length} assignments.` });

      navigate('/courses');
    } catch (err) {
      console.error('AI parsing error:', err);
      toast.error('Parsing failed', { description: err instanceof Error ? err.message : 'Failed to parse syllabus. You can add the course manually.' });
      setStep('review'); // Fallback to manual
    }
  };

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const toggleScheduleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const addNewAssignment = () => {
    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      name: '',
      type: 'homework',
      weight: 0,
      dueDate: '',
      description: '',
      score: null,
    };
    setAssignments([...assignments, newAssignment]);
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveCourse = async () => {
    if (!courseCode || !courseName) {
      toast.error('Missing information', { description: 'Please fill in the course code and name.' });
      return;
    }

    if (!user) {
      toast.error('Not authenticated', { description: 'Please log in to save courses.' });
      return;
    }

    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);
    if (totalWeight !== 100) {
      toast.error('Weight mismatch', { description: `Assignment weights total ${totalWeight}%. They should add up to 100%.` });
      return;
    }

    // Save to database
    const { courseId, error } = await saveCourseToDatabase(
      user.id,
      {
        code: courseCode,
        name: courseName,
        credits,
        color: selectedColor,
        semesterId: activeSemesterId,
        instructor,
        schedule,
      },
      assignments
    );

    if (error) {
      toast.error('Error saving course', { description: error.message });
      return;
    }

    // Also add to local store for immediate UI update
    addCourse({
      id: courseId || Date.now().toString(),
      semesterId: activeSemesterId || 'fall-2025',
      code: courseCode,
      name: courseName,
      credits,
      color: selectedColor,
      instructor,
      schedule,
      assignments,
      createdAt: new Date().toISOString(),
    });

    toast.success('Course added!', { description: `${courseCode} has been added to your courses.` });

    navigate('/courses');
  };

  const resetForm = () => {
    setStep('upload');
    setUploadedFile(null);
    setCourseCode('');
    setCourseName('');
    setSection('');
    setCredits(3);
    setSelectedColor(COURSE_COLORS[0].value);
    setInstructor({ name: '', email: '', officeHours: '', office: '' });
    setSchedule({ days: [], startTime: '', endTime: '', location: '' });
    setAssignments([]);
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/courses')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add Course</h1>
          <p className="text-muted-foreground mt-1">
            Upload your syllabus and let AI do the heavy lifting.
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload syllabus file — click or drag and drop"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
            )}
            onClick={() => document.getElementById('file-input')?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('file-input')?.click();
              }
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={handleInputFileChange}
            />

            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UploadIcon className="w-8 h-8 text-primary" />
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-2">
              Drag & drop your syllabus here
            </h3>
            <p className="text-muted-foreground mb-4">or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Supports PDF files up to 10MB
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Don't have a syllabus? No problem!
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setStep('review');
              }}
            >
              Add Course Manually
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 'processing' && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {uploadedFile && (
            <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-secondary rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground truncate">
                {uploadedFile.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-lg font-medium text-foreground">
              Analyzing syllabus with AI...
            </span>
          </div>

          <p className="text-muted-foreground">
            Extracting course information, schedule, and assignments.
          </p>
        </div>
      )}

      {/* Step 3: Review & Edit */}
      {step === 'review' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Course Information */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Course Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g., PSY 1012"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g., Introduction to Psychology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., 001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min={1}
                  max={6}
                  value={credits}
                  onChange={(e) => setCredits(parseInt(e.target.value) || 3)}
                />
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Instructor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={instructor.name}
                  onChange={(e) =>
                    setInstructor({ ...instructor, name: e.target.value })
                  }
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={instructor.email}
                  onChange={(e) =>
                    setInstructor({ ...instructor, email: e.target.value })
                  }
                  placeholder="jsmith@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Office Hours</Label>
                <Input
                  value={instructor.officeHours}
                  onChange={(e) =>
                    setInstructor({ ...instructor, officeHours: e.target.value })
                  }
                  placeholder="Mon/Wed 2:00-4:00 PM"
                />
              </div>
              <div className="space-y-2">
                <Label>Office Location</Label>
                <Input
                  value={instructor.office}
                  onChange={(e) =>
                    setInstructor({ ...instructor, office: e.target.value })
                  }
                  placeholder="Building A, Room 101"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Schedule
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleScheduleDay(day)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        schedule.days.includes(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) =>
                      setSchedule({ ...schedule, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) =>
                      setSchedule({ ...schedule, endTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={schedule.location}
                    onChange={(e) =>
                      setSchedule({ ...schedule, location: e.target.value })
                    }
                    placeholder="Room 101"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Assignments
              </h3>
              <span className="text-sm text-muted-foreground">
                Total Weight:{' '}
                <span
                  className={cn(
                    'font-semibold',
                    assignments.reduce((sum, a) => sum + a.weight, 0) === 100
                      ? 'text-success'
                      : 'text-warning'
                  )}
                >
                  {assignments.reduce((sum, a) => sum + a.weight, 0)}%
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">
                      Name
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">
                      Type
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">
                      Weight %
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">
                      Due Date
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground py-3 px-2">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <Input
                          value={assignment.name}
                          onChange={(e) =>
                            updateAssignment(assignment.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="Assignment name"
                          className="min-w-[180px]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={assignment.type}
                          onChange={(e) =>
                            updateAssignment(assignment.id, {
                              type: e.target.value as AssignmentType,
                            })
                          }
                          className="w-full p-2 rounded-lg border border-input bg-background text-sm"
                        >
                          {ASSIGNMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={assignment.weight}
                          onChange={(e) =>
                            updateAssignment(assignment.id, {
                              weight: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="date"
                          value={assignment.dueDate}
                          onChange={(e) =>
                            updateAssignment(assignment.id, {
                              dueDate: e.target.value,
                            })
                          }
                          className="min-w-[140px]"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAssignment(assignment.id)}
                          className="text-muted-foreground hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              variant="outline"
              onClick={addNewAssignment}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          </div>

          {/* Color Picker */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Course Color
            </h3>
            <div className="flex gap-3">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all',
                    selectedColor === color.value
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              onClick={handleSaveCourse}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Course
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
