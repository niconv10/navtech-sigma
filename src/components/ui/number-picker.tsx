import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberPicker({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: NumberPickerProps) {
  const [open, setOpen] = React.useState(false);
  const numbers = React.useMemo(() => {
    const arr: number[] = [];
    for (let i = max; i >= min; i -= step) {
      arr.push(i);
    }
    return arr;
  }, [min, max, step]);

  const handleSelect = (num: number) => {
    onChange(num);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-16 h-10 text-center font-semibold text-lg rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
            className
          )}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-20 p-0 z-50" align="center">
        <ScrollArea className="h-64">
          <div className="flex flex-col">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => handleSelect(num)}
                className={cn(
                  "w-full py-2 text-center hover:bg-accent hover:text-accent-foreground transition-colors",
                  num === value && "bg-primary text-primary-foreground font-bold"
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
