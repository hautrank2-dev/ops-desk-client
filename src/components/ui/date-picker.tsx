"use client";

import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const VALUE_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "dd/MM/yyyy";

const toDate = (value?: string) => {
  if (!value) return undefined;
  const date = parse(value, VALUE_FORMAT, new Date());
  return isValid(date) ? date : undefined;
};

// Value giữ dạng "yyyy-MM-dd" như <input type="date"> để thay thế 1-1; chỉ phần
// hiển thị là dd/MM/yyyy (input gốc hiển thị theo locale trình duyệt, không ép được).
export type DatePickerProps = Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> & {
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
};

export const DatePicker = ({
  value,
  onChange,
  min,
  max,
  placeholder = "dd/mm/yyyy",
  clearable = true,
  className,
  ...props
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start gap-2 font-normal tabular-nums",
                clearable && selected && "pr-8",
                !selected && "text-muted-foreground",
              )}
              {...props}
            />
          }
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
        </PopoverTrigger>
        {clearable && selected && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate ?? maxDate}
          weekStartsOn={1}
          disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
          onSelect={(date) => {
            onChange(date ? format(date, VALUE_FORMAT) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
