"use client";

import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon, PlusIcon, TrashIcon } from "lucide-react";

import type { ExperienceDraft } from "@/components/wizard/draft";
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
import { Textarea } from "@/components/ui/textarea";

const emptyRow: ExperienceDraft = {
  role: "",
  company: "",
  description: "",
  startDate: "",
  endDate: "",
  present: false,
  technologies: "",
};

export function ExperienceStep({
  rows,
  onChange,
  onNext,
  onBack,
}: {
  rows: ExperienceDraft[];
  onChange: (rows: ExperienceDraft[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function addRow() {
    onChange([...rows, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<ExperienceDraft>) {
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
            <BriefcaseIcon className="size-4" />
          </span>
          <p className="text-sm font-medium text-foreground">No work experience added yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Add your previous roles, responsibilities, and the technologies you worked with.
          </p>
          <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={addRow}>
            <PlusIcon data-icon="inline-start" />
            Add experience
          </Button>
        </div>
      ) : (
        rows.map((row, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <CardTitle className="truncate">{row.role.trim() || "Work Experience"}</CardTitle>
              <CardDescription className="truncate">
                {row.company.trim() || "Company, responsibilities, and tech stack"}
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(index)}
                  aria-label="Remove experience entry"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`exp-role-${index}`}>Role</Label>
                  <Input
                    id={`exp-role-${index}`}
                    name="role"
                    value={row.role}
                    onChange={(e) => updateRow(index, { role: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    maxLength={150}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`exp-company-${index}`}>Company</Label>
                  <Input
                    id={`exp-company-${index}`}
                    name="company"
                    value={row.company}
                    onChange={(e) => updateRow(index, { company: e.target.value })}
                    placeholder="e.g. Vercel"
                    maxLength={150}
                  />
                </div>
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

              <div className="grid gap-2">
                <Label htmlFor={`exp-desc-${index}`}>Description</Label>
                <Textarea
                  id={`exp-desc-${index}`}
                  name="description"
                  value={row.description}
                  onChange={(e) => updateRow(index, { description: e.target.value })}
                  placeholder="Describe your key achievements, architecture decisions, and impact..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`exp-tech-${index}`}>Technologies</Label>
                <Input
                  id={`exp-tech-${index}`}
                  name="technologies"
                  value={row.technologies}
                  onChange={(e) => updateRow(index, { technologies: e.target.value })}
                  placeholder="React, TypeScript, Next.js, PostgreSQL"
                />
                <p className="text-xs text-muted-foreground">Separate technologies with commas.</p>
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
              Add experience
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
