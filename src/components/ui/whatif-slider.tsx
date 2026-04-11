import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface WhatIfSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  accentColor?: string;
}

const WhatIfSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  WhatIfSliderProps
>(({ className, accentColor, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderPrimitive.Range 
        className="absolute h-full" 
        style={{ backgroundColor: accentColor || 'hsl(var(--primary))' }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-4 w-4 rounded-full bg-white shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    />
  </SliderPrimitive.Root>
));
WhatIfSlider.displayName = "WhatIfSlider";

export { WhatIfSlider };
