import { useState } from "react";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSemesterStore } from "@/stores/useSemesterStore";
import { addAssignmentToDatabase } from "@/hooks/useCourses";
import type { AssignmentType } from "@/types";

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses?: { id: string; name: string; code: string }[];
}

const EVENT_TYPES = [
  { id: "quiz", label: "Quiz" },
  { id: "homework", label: "Homework" },
  { id: "exam", label: "Exam" },
  { id: "project", label: "Project" },
  { id: "other", label: "Other" },
];

const REMINDER_OPTIONS = [
  { value: "1day", label: "1 day before" },
  { value: "3hours", label: "3 hours before" },
  { value: "1hour", label: "1 hour before" },
  { value: "30min", label: "30 minutes before" },
  { value: "none", label: "No reminder" },
];

export function AddEventModal({ open, onOpenChange, courses = [] }: AddEventModalProps) {
  const { user } = useAuth();
  const { addAssignment } = useSemesterStore();

  const [selectedType, setSelectedType] = useState("quiz");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [points, setPoints] = useState("");
  const [weight, setWeight] = useState("");
  const [reminder, setReminder] = useState("1day");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCourseId("");
    setDueDate("");
    setDueTime("23:59");
    setPoints("");
    setWeight("");
    setSelectedType("quiz");
    setReminder("1day");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for this event");
      return;
    }
    if (!courseId) {
      toast.error("Please select a course");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to add events");
      return;
    }

    setSaving(true);
    try {
      const parsedWeight = parseFloat(weight) || 0;

      const { assignmentId, error } = await addAssignmentToDatabase(
        user.id,
        courseId,
        {
          name: title.trim(),
          type: selectedType,
          weight: parsedWeight,
          due_date: dueDate || null,
          description: null,
          score: null,
        }
      );

      if (error || !assignmentId) {
        toast.error("Failed to save event", {
          description: error?.message ?? "Unknown error — please try again.",
        });
        return;
      }

      // Optimistically update the local store so the calendar reflects it immediately
      addAssignment(courseId, {
        id: assignmentId,
        name: title.trim(),
        type: selectedType as AssignmentType,
        weight: parsedWeight,
        dueDate: dueDate || undefined,
        score: null,
      });

      const course = courses.find((c) => c.id === courseId);
      toast.success("Event added to calendar", {
        description: `${title}${course ? ` — ${course.code}` : ""}${dueDate ? ` · Due ${dueDate}` : ""}`,
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { resetForm(); onOpenChange(v); } }}>
      <DialogContent className="add-event-modal sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Add Event
          </DialogTitle>
        </DialogHeader>

        <div className="add-event-content">
          {/* Event Type */}
          <div className="form-group">
            <Label className="form-label">Event Type</Label>
            <div className="event-type-buttons">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  className={cn(
                    "event-type-btn",
                    selectedType === type.id && "active"
                  )}
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <Label className="form-label">Title <span className="text-destructive">*</span></Label>
            <Input
              className="form-input"
              placeholder="e.g. Midterm Exam, Chapter 5 HW…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>

          {/* Course */}
          <div className="form-group">
            <Label className="form-label">Course <span className="text-destructive">*</span></Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="form-input">
                <SelectValue placeholder="Select course…" />
              </SelectTrigger>
              <SelectContent>
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    No courses found — upload a syllabus first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="form-row">
            <div className="form-group flex-1">
              <Label className="form-label">Due Date</Label>
              <Input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <Label className="form-label">Time</Label>
              <Input
                type="time"
                className="form-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Points and Weight */}
          <div className="form-row">
            <div className="form-group flex-1">
              <Label className="form-label">Points</Label>
              <Input
                type="number"
                className="form-input"
                placeholder="e.g. 100"
                value={points}
                min={0}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <Label className="form-label">Grade Weight %</Label>
              <Input
                type="number"
                className="form-input"
                placeholder="e.g. 10"
                value={weight}
                min={0}
                max={100}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="form-group">
            <Label className="form-label">Reminder</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger className="form-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="add-event-footer">
          <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="add-event-submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Add Event"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
