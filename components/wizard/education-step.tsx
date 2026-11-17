"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GraduationCapIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";

import type { EducationDraft } from "@/components/wizard/draft";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthYearSelect } from "@/components/ui/month-year-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EDUCATION_LEVELS } from "@/lib/constants";

const LEVEL_LABELS: Record<string, string> = {
  high_school: "High school",
  bootcamp: "Bootcamp",
  associate: "Associate",
  bachelor: "Bachelor",
  master: "Master",
  phd: "PhD",
  other: "Other",
};

const emptyRow: EducationDraft = {
  degree: "",
  level: "",
  university: "",
  startDate: "",
  endDate: "",
  present: false,
};

export function EducationStep({
  rows,
  onChange,
  onNext,
  onBack,
}: {
  rows: EducationDraft[];
  onChange: (rows: EducationDraft[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function addRow() {
    onChange([...rows, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<EducationDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="grid gap-4"
    >
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <GraduationCapIcon className="size-4" />
          </span>
          <p className="text-sm font-medium text-foreground">No education entries yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Add your university degrees, bootcamps, or certifications.
          </p>
          <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={addRow}>
            <PlusIcon data-icon="inline-start" />
            Add education
          </Button>
        </div>
      ) : (
        rows.map((row, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <CardTitle className="truncate">{row.degree.trim() || "Education entry"}</CardTitle>
              <CardDescription className="truncate">
                {row.university.trim() || "Institution details and study dates"}
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(index)}
                  aria-label="Remove education entry"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`edu-degree-${index}`}>Degree / field of study</Label>
                  <Input
                    id={`edu-degree-${index}`}
                    name="degree"
                    value={row.degree}
                    onChange={(e) => updateRow(index, { degree: e.target.value })}
                    placeholder="e.g. MSc Computer Science"
                    maxLength={150}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Level</Label>
                  <Select
                    name="level"
                    items={LEVEL_LABELS}
                    value={row.level || null}
                    onValueChange={(value) => updateRow(index, { level: value ?? "" })}
                  >
                    <SelectTrigger className="w-full" aria-label="Education level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {LEVEL_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`edu-university-${index}`}>University / institution</Label>
                <Input
                  id={`edu-university-${index}`}
                  name="university"
                  value={row.university}
                  onChange={(e) => updateRow(index, { university: e.target.value })}
                  placeholder="e.g. ETH Zurich"
                  maxLength={150}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MonthYearSelect
                  name="startDate"
                  label="Start date"
                  value={row.startDate}
                  onChange={(value) => updateRow(index, { startDate: value })}
                />
                <MonthYearSelect
                  name="endDate"
                  label="End date"
                  value={row.endDate}
                  onChange={(value) => updateRow(index, { endDate: value })}
                  present={row.present}
                  onPresentChange={(present) => updateRow(index, { present })}
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button type="button" variant="secondary" onClick={addRow}>
              <PlusIcon data-icon="inline-start" />
              Add education
            </Button>
          )}
          <Button type="submit">
            Next
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </form>
  );
}
