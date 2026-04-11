import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_CATEGORIES } from "@/lib/courseColors";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface CourseColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export function CourseColorPicker({ color, onColorChange, className }: CourseColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);

  const handleSave = () => {
    onColorChange(selectedColor);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedColor(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) setSelectedColor(color);
    }}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-3 h-3 rounded-full shrink-0 hover:ring-2 hover:ring-white/30 transition-all cursor-pointer",
            className
          )}
          style={{ backgroundColor: color }}
          aria-label="Change course color"
          onClick={(e) => e.stopPropagation()}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="w-[420px] p-0 bg-[rgba(15,15,15,0.98)] backdrop-blur-xl border-white/10"
        align="start"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <span className="text-sm font-medium text-white">Choose Course Color</span>
          <button 
            onClick={handleCancel}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Color Categories */}
        <div className="p-5 space-y-5 max-h-[400px] overflow-y-auto">
          {Object.entries(COLOR_CATEGORIES).map(([key, { label, colors }], categoryIndex) => (
            <div key={key}>
              {categoryIndex > 0 && (
                <div className="border-t border-white/[0.06] mb-5" />
              )}
              <p className="text-[10px] font-medium tracking-[1.5px] uppercase text-white/40 mb-3">
                {label}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                      "border border-white/[0.08] hover:bg-white/5 hover:border-white/15",
                      selectedColor === c.hex && "border-white/30 bg-white/5"
                    )}
                    onClick={() => setSelectedColor(c.hex)}
                    aria-label={`Select ${c.name}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: c.hex,
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
                      }}
                    />
                    <span className="text-xs text-white/70">{c.name}</span>
                    {selectedColor === c.hex && (
                      <Check className="w-3 h-3 text-white/70 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-medium text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
          >
            Save
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}