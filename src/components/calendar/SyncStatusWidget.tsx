import { useState } from "react";
import { Plus, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncItem {
  id: string;
  name: string;
  type: "google" | "canvas" | "outlook" | "apple";
  connected: boolean;
  lastSync?: string;
  autoImport?: boolean;
}

export function SyncStatusWidget() {
  const [syncItems] = useState<SyncItem[]>([
    {
      id: "1",
      name: "Google Calendar",
      type: "google",
      connected: true,
      lastSync: "2m ago",
    },
    {
      id: "2",
      name: "Canvas",
      type: "canvas",
      connected: true,
      autoImport: true,
    },
  ]);

  const getIconLetter = (type: SyncItem["type"]) => {
    switch (type) {
      case "google": return "G";
      case "canvas": return "C";
      case "outlook": return "O";
      case "apple": return "A";
      default: return "+";
    }
  };

  const getIconClass = (type: SyncItem["type"]) => {
    switch (type) {
      case "google": return "sync-icon-google";
      case "canvas": return "sync-icon-canvas";
      case "outlook": return "sync-icon-outlook";
      case "apple": return "sync-icon-apple";
      default: return "";
    }
  };

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-widget-header">
        <span className="calendar-widget-title">Sync Status</span>
      </div>

      {/* Content */}
      <div className="sync-widget-content">
        {syncItems.map((item) => (
          <div key={item.id} className="sync-item">
            <div className={`sync-icon ${getIconClass(item.type)}`}>
              {getIconLetter(item.type)}
            </div>
            <div className="sync-info">
              <p className="sync-name">{item.name}</p>
              <p className={`sync-status ${item.connected ? "connected" : ""}`}>
                {item.connected ? "Connected" : "Not connected"}
                {item.lastSync && ` • Last sync: ${item.lastSync}`}
                {item.autoImport !== undefined && ` • Auto-import: ${item.autoImport ? "ON" : "OFF"}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="sync-action-btn">
              {item.lastSync ? <RefreshCw className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
            </Button>
          </div>
        ))}

        {/* Add Integration */}
        <div className="sync-item sync-item-add">
          <div className="sync-icon sync-icon-add">
            <Plus className="w-4 h-4" />
          </div>
          <div className="sync-info">
            <p className="sync-name">Add Integration</p>
            <p className="sync-status">Apple, Outlook...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
