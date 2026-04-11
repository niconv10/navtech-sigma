import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if already dismissed this session
    const isDismissed = sessionStorage.getItem('sigma-disclaimer-dismissed');
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('sigma-disclaimer-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-info-light border-b border-info/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Info className="h-4 w-4 text-info shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Reminder:</span> Grades shown are estimates only. Always verify with your official university portal.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
