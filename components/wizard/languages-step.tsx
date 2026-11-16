"use client";

import { ArrowLeftIcon, ArrowRightIcon, LanguagesIcon, PlusIcon, TrashIcon } from "lucide-react";

import type { LanguageDraft } from "@/components/wizard/draft";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FLUENCY_LEVELS } from "@/lib/constants";

const FLUENCY_LABELS: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  advanced: "Advanced",
  intermediate: "Intermediate",
  basic: "Basic",
};

export function LanguagesStep({
  rows,
  onChange,
  onNext,
  onBack,
}: {
  rows: LanguageDraft[];
  onChange: (rows: LanguageDraft[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function addRow() {
    onChange([...rows, { language: "", fluency: "" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<LanguageDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Spoken Languages</CardTitle>
              <CardDescription>Add the languages you speak and your proficiency.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <PlusIcon data-icon="inline-start" />
              Add language
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <LanguagesIcon className="size-4" />
              </span>
              <p className="text-sm font-medium text-foreground">No languages added yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Add at least one language so collaborators and recruiters know how to communicate
                with you.
              </p>
              <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={addRow}>
                <PlusIcon data-icon="inline-start" />
                Add your first language
              </Button>
            </div>
          ) : (
            rows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 dark:border-border"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    name="language"
                    value={row.language}
                    onChange={(e) => updateRow(index, { language: e.target.value })}
                    placeholder="Language (e.g. English, French)"
                    maxLength={50}
                    aria-label="Language"
                  />
                  <Select
                    name="fluency"
                    items={FLUENCY_LABELS}
                    value={row.fluency || null}
                    onValueChange={(value) => updateRow(index, { fluency: value ?? "" })}
                  >
                    <SelectTrigger className="w-full" aria-label="Fluency">
                      <SelectValue placeholder="Select fluency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLUENCY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {FLUENCY_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(index)}
                  aria-label="Remove language"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </div>
            ))
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
          <Button type="submit">
            Next
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
