import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationOption {
  id: string;
  label: string;
  enabled: boolean;
}

type NotificationMethod = "push" | "email" | "sms";

export function NotificationsWidget() {
  const [options, setOptions] = useState<NotificationOption[]>([
    { id: "1day", label: "1 day before", enabled: true },
    { id: "3hours", label: "3 hours before", enabled: true },
    { id: "1hour", label: "1 hour before", enabled: false },
    { id: "30min", label: "30 minutes before", enabled: false },
  ]);

  const [activeMethods, setActiveMethods] = useState<NotificationMethod[]>(["push", "email"]);

  const toggleOption = (id: string) => {
    setOptions(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
      )
    );
  };

  const toggleMethod = (method: NotificationMethod) => {
    setActiveMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-widget-header">
        <span className="calendar-widget-title">Notifications</span>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="notifications-content">
        <p className="notifications-label">Remind me before due dates:</p>
        
        <div className="notifications-options">
          {options.map((option) => (
            <div 
              key={option.id} 
              className="notification-option"
              onClick={() => toggleOption(option.id)}
            >
              <div className={cn(
                "notification-checkbox",
                option.enabled && "checked"
              )}>
                {option.enabled && <Check className="w-3 h-3" />}
              </div>
              <span className="notification-text">{option.label}</span>
            </div>
          ))}
        </div>

        <p className="notifications-label mt-4">Notification method:</p>
        
        <div className="notification-methods">
          {(["push", "email", "sms"] as NotificationMethod[]).map((method) => (
            <button
              key={method}
              className={cn(
                "method-btn",
                activeMethods.includes(method) && "active"
              )}
              onClick={() => toggleMethod(method)}
            >
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="notifications-footer">
        <span className="weekly-summary">Weekly summary: Every Monday</span>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
          Edit
        </Button>
      </div>
    </div>
  );
}
