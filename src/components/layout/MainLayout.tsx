import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ background: "var(--bg-page-gradient)" }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
      
      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-[220px]", // Account for narrower sidebar on desktop
        "pb-20 lg:pb-0" // Account for mobile nav
      )}>
        <DisclaimerBanner />
        <div className="p-5 lg:px-10 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
