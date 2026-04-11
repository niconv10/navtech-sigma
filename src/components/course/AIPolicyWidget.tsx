import { Bot, Check, X, ExternalLink } from "lucide-react";
import type { AIPolicy } from "@/types";

interface AIPolicyWidgetProps {
  aiPolicy: AIPolicy;
}

export function AIPolicyWidget({ aiPolicy }: AIPolicyWidgetProps) {
  return (
    <div className="glass-widget">
      <div className="course-widget-header px-5 pt-5">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="course-widget-title">AI Usage Policy</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        {/* Policy Type Badge */}
        {aiPolicy.type && (
          <div className="mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              aiPolicy.permitted 
                ? 'bg-success/20 text-success' 
                : 'bg-error/20 text-error'
            }`}>
              {aiPolicy.type}
            </span>
          </div>
        )}

        {/* Permitted Status */}
        <div className="flex items-center gap-2 mb-3">
          {aiPolicy.permitted ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">AI tools permitted</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4 text-error" />
              <span className="text-sm text-foreground">AI tools not permitted</span>
            </>
          )}
        </div>

        {/* Restrictions */}
        {aiPolicy.restrictions && (
          <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-xs text-warning font-medium mb-1">Restrictions</p>
            <p className="text-sm text-foreground">{aiPolicy.restrictions}</p>
          </div>
        )}

        {/* Citation Required */}
        {aiPolicy.citationRequired && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
              Citation Required
            </span>
          </div>
        )}

        {/* Citation Format Link */}
        {aiPolicy.citationFormat && (
          <a 
            href={aiPolicy.citationFormat}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:underline mb-3"
          >
            <ExternalLink className="w-3 h-3" />
            View Citation Format
          </a>
        )}

        {/* Details */}
        {aiPolicy.details && (
          <p className="text-xs text-muted-foreground">{aiPolicy.details}</p>
        )}
      </div>
    </div>
  );
}
