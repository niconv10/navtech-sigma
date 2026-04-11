import { Book, Monitor, Key, HardDrive, Package } from "lucide-react";
import type { CourseMaterials, Textbook } from "@/types";

interface MaterialsWidgetProps {
  materials: CourseMaterials | string[];
}

// Helper to check if materials is in the new structured format
function isStructuredMaterials(materials: any): materials is CourseMaterials {
  return materials && typeof materials === 'object' && !Array.isArray(materials);
}

// Helper to parse legacy string array into textbook-like objects
function parseLegacyMaterials(materials: string[]): { title: string; details?: string }[] {
  return materials.map(m => {
    // Try to parse structured info like "Title ISBN: xxx, Author: yyy"
    const parts = m.split(/,\s*(?=[A-Z][a-z]+:)/);
    if (parts.length > 1) {
      return { title: parts[0], details: parts.slice(1).join(', ') };
    }
    return { title: m };
  });
}

export function MaterialsWidget({ materials }: MaterialsWidgetProps) {
  // Handle legacy string array format
  if (Array.isArray(materials)) {
    if (materials.length === 0) return null;
    
    const parsedMaterials = parseLegacyMaterials(materials);
    
    return (
      <div className="glass-widget">
        <div className="course-widget-header px-5 pt-5">
          <span className="course-widget-title">Course Materials</span>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Book className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Required Materials</span>
          </div>
          <div className="space-y-2">
            {parsedMaterials.map((item, idx) => (
              <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.details && <p className="text-xs text-muted-foreground mt-1">{item.details}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle new structured format
  if (!isStructuredMaterials(materials)) return null;

  const hasTextbooks = materials.textbooks && materials.textbooks.length > 0;
  const hasSoftware = materials.software && materials.software.length > 0;
  const hasAccessCodes = materials.accessCodes && materials.accessCodes.length > 0;
  const hasHardware = materials.hardware && materials.hardware.length > 0;
  const hasOther = materials.other && materials.other.length > 0;

  if (!hasTextbooks && !hasSoftware && !hasAccessCodes && !hasHardware && !hasOther) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <span className="course-widget-title">Course Materials</span>
      </div>
      <div className="px-5 pb-5 space-y-4">
        {/* Textbooks */}
        {hasTextbooks && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Book className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Textbooks</span>
            </div>
            <div className="space-y-2">
              {materials.textbooks!.map((book, idx) => (
                <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{book.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${book.required ? 'bg-error/20 text-error' : 'bg-muted text-muted-foreground'}`}>
                      {book.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {book.author && <p className="text-xs text-muted-foreground mt-1">by {book.author}</p>}
                  {book.edition && <p className="text-xs text-muted-foreground">{book.edition} Edition</p>}
                  {book.isbn && <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>}
                  {book.note && <p className="text-xs text-primary mt-1">{book.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Software */}
        {hasSoftware && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Software</span>
            </div>
            <div className="space-y-2">
              {materials.software!.map((sw, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{sw.name}</p>
                    {sw.cost && <p className="text-xs text-muted-foreground">{sw.cost}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${sw.required ? 'bg-error/20 text-error' : 'bg-muted text-muted-foreground'}`}>
                    {sw.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Codes */}
        {hasAccessCodes && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Access Codes</span>
            </div>
            <div className="space-y-2">
              {materials.accessCodes!.map((ac, idx) => (
                <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{ac.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${ac.required ? 'bg-error/20 text-error' : 'bg-muted text-muted-foreground'}`}>
                      {ac.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {ac.code && <p className="text-xs text-primary mt-1 font-mono">Code: {ac.code}</p>}
                  {ac.cost && <p className="text-xs text-muted-foreground">{ac.cost}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hardware */}
        {hasHardware && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hardware</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {materials.hardware!.map((hw, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded text-foreground">
                  {hw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Other Materials */}
        {hasOther && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Other</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {materials.other!.map((item, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
