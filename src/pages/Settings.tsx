import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { 
  User, 
  Bell, 
  Palette, 
  GraduationCap, 
  Database,
  Shield,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Loader2,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuth();
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [gpaGoal, setGpaGoal] = useState([profile?.gpa_goal || 3.5]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      university: university || null,
      major: major || null,
      gpa_goal: gpaGoal[0],
    });
    setSaving(false);

    if (error) {
      toast.error("Error saving profile", { description: error.message });
    } else {
      toast.success("Profile saved", { description: "Your changes have been saved successfully." });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleExportData = async () => {
    // Fetch all user data
    const { data: courses } = await supabase.from('courses').select('*');
    const { data: assignments } = await supabase.from('assignments').select('*');
    const { data: semesters } = await supabase.from('semesters').select('*');

    const exportData = {
      profile,
      semesters,
      courses,
      assignments,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported", { description: "Your data has been downloaded as JSON." });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    
    setDeletingAccount(true);
    
    // Delete all user data (cascade will handle related records)
    const { error } = await supabase.from('profiles').delete().eq('id', profile?.id);
    
    if (error) {
      setDeletingAccount(false);
      toast.error("Error deleting account", { description: error.message });
      return;
    }

    await signOut();
    navigate('/login');
    toast.success("Account deleted", { description: "Your account and all data have been permanently deleted." });
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Profile Section */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Profile</h3>
          </div>
          
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
              {fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile?.email || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input 
                id="university" 
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input 
                id="major" 
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Appearance</h3>
          </div>
          
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-4">
              <Label>Mode</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light" as const, icon: Sun, label: "Light" },
                  { value: "dark" as const, icon: Moon, label: "Dark" },
                  { value: "system" as const, icon: Monitor, label: "System" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      mode === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <option.icon className={cn(
                      "w-5 h-5",
                      mode === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      mode === option.value ? "text-primary" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Theme Selection */}
            <div className="space-y-4">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "default" as const, label: "Default", colors: ["#7C3AED", "#10B981"] },
                  { value: "pink" as const, label: "Pink", colors: ["#EC4899", "#A855F7"] },
                  { value: "claude" as const, label: "Claude", colors: ["#D97706", "#EA580C"] },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setColorTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      colorTheme === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex gap-1">
                      {option.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      colorTheme === option.value ? "text-primary" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { id: "due", label: "Assignment due reminders", description: "Get notified before assignments are due", defaultChecked: true },
              { id: "grades", label: "New grades", description: "Get notified when grades are posted", defaultChecked: true },
              { id: "weekly", label: "Weekly summary", description: "Receive a weekly progress report", defaultChecked: false },
              { id: "tips", label: "Study tips", description: "AI-powered study recommendations", defaultChecked: true },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </div>
        </div>

        {/* Academic */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Academic</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>GPA Goal</Label>
                <span className="text-lg font-semibold text-primary">{gpaGoal[0].toFixed(2)}</span>
              </div>
              <Slider
                value={gpaGoal}
                onValueChange={setGpaGoal}
                min={2.0}
                max={4.0}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2.0</span>
                <span>3.0</span>
                <span>4.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Privacy & Data</h3>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-secondary"
            >
              <div className="text-left flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Export My Data</p>
                  <p className="text-sm text-muted-foreground">Download all your data in JSON format</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-error-light">
                  <div className="text-left flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error-light flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="space-y-3 pt-4">
                    <p>This will permanently delete:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your profile</li>
                      <li>All your courses</li>
                      <li>All your assignments</li>
                      <li>All your grades and history</li>
                    </ul>
                    <p className="font-semibold">This action CANNOT be undone.</p>
                    <div className="pt-4">
                      <Label htmlFor="delete-confirm">Type "DELETE" to confirm:</Label>
                      <Input
                        id="delete-confirm"
                        className="mt-2"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE' || deletingAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete My Account'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
