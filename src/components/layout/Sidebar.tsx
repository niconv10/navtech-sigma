import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/hooks/use-theme";

const trackItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
];

const toolsItems = [
  { icon: Sparkles, label: "Advisor", path: "/advisor" },
  { icon: Lightbulb, label: "Insights", path: "/insights" },
  { icon: Target, label: "Goals", path: "/goals" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const { resolvedMode } = useTheme();

  const renderNavItems = (items: typeof trackItems) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-50 transition-all duration-300 flex flex-col",
        "border-r border-sidebar-border",
        // Light mode: Apple glassmorphism
        "bg-sidebar",
        "backdrop-blur-xl",
        collapsed ? "w-16" : "w-[220px]"
      )}
      style={{
        // Ensure glass effect works in light mode
        background: resolvedMode === "dark" ? undefined : "rgba(255, 255, 255, 0.85)",
        boxShadow: resolvedMode === "dark" ? undefined : "4px 0 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Logo */}
      <div className={cn("flex items-center", collapsed ? "px-3 py-5" : "px-4 py-6")}>
        <Logo 
          variant={resolvedMode === "dark" ? "dark" : "light"}
          height={collapsed ? 36 : 52}
          linkTo="/"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-5">
        {/* TRACK Section */}
        <div>
          {!collapsed && (
            <span className="sidebar-category px-3 mb-2 block text-[11px] tracking-[1.5px]">
              Track
            </span>
          )}
          {renderNavItems(trackItems)}
        </div>

        {/* TOOLS Section */}
        <div>
          {!collapsed && (
            <span className="sidebar-category px-3 mb-2 block text-[11px] tracking-[1.5px]">
              Tools
            </span>
          )}
          {renderNavItems(toolsItems)}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* User profile */}
      <div className={cn("p-4 border-t border-sidebar-border", collapsed ? "text-center" : "")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold shrink-0">
            {(profile?.full_name || profile?.email || "S").charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate text-foreground">
                {profile?.full_name || profile?.email || "Student"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.major || profile?.university || ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
