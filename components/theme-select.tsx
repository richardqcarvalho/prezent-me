"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ContrastIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEME_ITEMS = {
  system: "System",
  light: "Light",
  dark: "Dark",
} as const;

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Select
      items={THEME_ITEMS}
      value={mounted ? (theme ?? "system") : "system"}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
    >
      <SelectTrigger aria-label="Theme" className="gap-1.5">
        <ContrastIcon className="size-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  );
}
