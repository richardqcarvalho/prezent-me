"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FIRST_YEAR = 1950;
const LAST_YEAR = new Date().getFullYear() + 1;
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => LAST_YEAR - i);

const MONTH_ITEMS = Object.fromEntries(
  MONTHS.map((label, i) => [String(i + 1).padStart(2, "0"), label]),
);
const YEAR_ITEMS = Object.fromEntries(YEARS.map((y) => [String(y), String(y)]));

type MonthYearSelectProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  present?: boolean;
  onPresentChange?: (present: boolean) => void;
};

export function MonthYearSelect({
  name,
  label,
  value,
  onChange,
  present = false,
  onPresentChange,
}: MonthYearSelectProps) {
  const [initialYear = "", initialMonth = ""] = value.split("-");
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  function commit(nextMonth: string, nextYear: string) {
    setMonth(nextMonth);
    setYear(nextYear);
    if (nextMonth !== "" && nextYear !== "") {
      onChange(`${nextYear}-${nextMonth}`);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm leading-none font-medium select-none">{label}</span>
        {onPresentChange && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground select-none hover:text-foreground">
            <input
              type="checkbox"
              checked={present}
              onChange={(e) => onPresentChange(e.target.checked)}
              className="size-3.5 cursor-pointer rounded-[4px] border border-input accent-primary"
            />
            Currently here
          </label>
        )}
      </div>
      <input type="hidden" name={name} value={present ? "" : value} />
      <div className="grid grid-cols-2 gap-2">
        <Select
          items={MONTH_ITEMS}
          value={month || null}
          disabled={present}
          onValueChange={(val) => commit(val ?? "", year)}
        >
          <SelectTrigger className="w-full" aria-label={`${label} month`}>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((monthLabel, i) => {
              const monthVal = String(i + 1).padStart(2, "0");
              return (
                <SelectItem key={monthLabel} value={monthVal}>
                  {monthLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select
          items={YEAR_ITEMS}
          value={year || null}
          disabled={present}
          onValueChange={(val) => commit(month, val ?? "")}
        >
          <SelectTrigger className="w-full" aria-label={`${label} year`}>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
