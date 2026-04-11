import { LifeBuoy, PenTool, Heart, Accessibility, Headphones } from "lucide-react";
import type { SupportResources } from "@/types";

interface SupportResourcesWidgetProps {
  resources: SupportResources;
}

// Safely render a resource value that could be a string or an object
function renderResource(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const parts: string[] = [];
    if (obj.name) parts.push(String(obj.name));
    if (obj.location) parts.push(String(obj.location));
    if (obj.hours) parts.push(String(obj.hours));
    if (obj.phone) parts.push(String(obj.phone));
    if (obj.email) parts.push(String(obj.email));
    if (obj.cost) parts.push(String(obj.cost));
    if (obj.appointment) parts.push(String(obj.appointment));
    if (parts.length > 0) return parts.join(' • ');
    // Fallback: join all string values
    const allParts = Object.values(obj).filter(v => typeof v === 'string' && v.trim());
    return allParts.length > 0 ? allParts.join(' • ') : null;
  }
  return String(value);
}

function ResourceItem({ value }: { value: unknown }) {
  const text = renderResource(value);
  if (!text) return null;
  return <p className="text-sm text-foreground">{text}</p>;
}

export function SupportResourcesWidget({ resources }: SupportResourcesWidgetProps) {
  const hasResources = resources.tutoring || resources.writing || 
    resources.counseling || resources.disability || 
    resources.techSupport || (resources.other && resources.other.length > 0);

  if (!hasResources) {
    return null;
  }

  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-primary" />
          <span className="course-widget-title">Support Resources</span>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {resources.tutoring && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            <PenTool className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tutoring</p>
              <ResourceItem value={resources.tutoring} />
            </div>
          </div>
        )}

        {resources.writing && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            <PenTool className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Writing Center</p>
              <ResourceItem value={resources.writing} />
            </div>
          </div>
        )}

        {resources.counseling && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            <Heart className="w-4 h-4 text-error mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Counseling</p>
              <ResourceItem value={resources.counseling} />
            </div>
          </div>
        )}

        {resources.disability && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            <Accessibility className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Accessibility Services</p>
              <ResourceItem value={resources.disability} />
            </div>
          </div>
        )}

        {resources.techSupport && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            <Headphones className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tech Support</p>
              <ResourceItem value={resources.techSupport} />
            </div>
          </div>
        )}

        {resources.other && resources.other.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground font-medium mb-2">Other Resources</p>
            <div className="flex flex-wrap gap-2">
              {resources.other.map((resource, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded text-foreground">
                  {typeof resource === 'object' ? renderResource(resource) : String(resource)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
