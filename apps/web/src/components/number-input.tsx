import { cn } from "#lib/utils";
import * as React from "react";
import { useEffect, useRef } from "react";

interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function NumberInput({
  className,
  value,
  onChange,
  min,
  max,
  onBlur,
  ...props
}: NumberInputProps) {
  const [internalValue, setInternalValue] = React.useState<string>(
    String(value)
  );
  const lastValidValue = useRef<number>(value);

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(String(value));
    lastValidValue.current = value;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let numericValue = Number.parseFloat(internalValue);

    // If empty or invalid, restore last valid value
    if (Number.isNaN(numericValue) || internalValue.trim() === "") {
      numericValue = lastValidValue.current;
    }

    // Clamp to min/max
    if (min !== undefined && numericValue < min) {
      numericValue = min;
    }
    if (max !== undefined && numericValue > max) {
      numericValue = max;
    }

    setInternalValue(String(numericValue));
    lastValidValue.current = numericValue;
    onChange(numericValue);
    onBlur?.(e);
  };

  return (
    <input
      type="number"
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      {...props}
    />
  );
}

export { NumberInput };
export type { NumberInputProps };

