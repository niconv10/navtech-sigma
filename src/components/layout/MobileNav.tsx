import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Target
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: BarChart3, label: "Insights", path: "/insights" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
  { icon: Target, label: "Goals", path: "/goals" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
