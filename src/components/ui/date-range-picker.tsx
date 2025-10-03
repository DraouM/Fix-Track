"use client";

import * as React from "react";
import {
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface DateRangePickerProps {
  /**
   * The selected date range
   */
  date?: DateRange;
  /**
   * Callback fired when the date range changes
   */
  onDateChange?: (date: DateRange | undefined) => void;
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string;
  /**
   * Whether to show quick preset buttons
   */
  showPresets?: boolean;
  /**
   * Custom preset configurations
   */
  presets?: Array<{
    label: string;
    value: DateRange;
  }>;
  /**
   * Additional class name for the trigger button
   */
  className?: string;
  /**
   * Whether the picker is disabled
   */
  disabled?: boolean;
  /**
   * Number of months to display in the calendar
   */
  numberOfMonths?: number;
}

// Default quick presets
const DEFAULT_PRESETS = [
  {
    label: "Today",
    value: {
      from: new Date(),
      to: new Date(),
    },
  },
  {
    label: "Yesterday",
    value: {
      from: addDays(new Date(), -1),
      to: addDays(new Date(), -1),
    },
  },
  {
    label: "Last 7 days",
    value: {
      from: addDays(new Date(), -7),
      to: new Date(),
    },
  },
  {
    label: "Last 30 days",
    value: {
      from: addDays(new Date(), -30),
      to: new Date(),
    },
  },
  {
    label: "This month",
    value: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
  },
  {
    label: "Last month",
    value: {
      from: startOfMonth(addDays(new Date(), -30)),
      to: endOfMonth(addDays(new Date(), -30)),
    },
  },
];

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = "Pick dates",
  showPresets = true,
  presets = DEFAULT_PRESETS,
  className,
  disabled = false,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handlePresetClick = (preset: DateRange) => {
    onDateChange?.(preset);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange?.(undefined);
  };

  const formatDateRange = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) return placeholder;

    if (dateRange.to) {
      return `${format(dateRange.from, "LLL dd")} - ${format(
        dateRange.to,
        "LLL dd"
      )}`;
    }

    return format(dateRange.from, "LLL dd, y");
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date?.from && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
            {date?.from && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Quick Presets */}
            {showPresets && (
              <div className="border-r p-3 min-w-[200px]">
                <div className="text-sm font-medium mb-3">Quick Select</div>
                <div className="space-y-1">
                  {presets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => handlePresetClick(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                {date?.from && (
                  <>
                    <div className="border-t my-3" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        onDateChange?.(undefined);
                        setOpen(false);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear dates
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={onDateChange}
                numberOfMonths={numberOfMonths}
                initialFocus
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Hook for managing date range state with additional utilities
 */
export function useDateRange(initialRange?: DateRange) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    initialRange
  );

  const clearDateRange = React.useCallback(() => {
    setDateRange(undefined);
  }, []);

  const hasDateRange = React.useMemo(() => {
    return !!(dateRange?.from || dateRange?.to);
  }, [dateRange]);

  const formatRange = React.useCallback((range: DateRange | undefined) => {
    if (!range?.from) return null;

    if (range.to) {
      return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")}`;
    }

    return format(range.from, "MMM dd, yyyy");
  }, []);

  return {
    dateRange,
    setDateRange,
    clearDateRange,
    hasDateRange,
    formatRange,
  };
}
