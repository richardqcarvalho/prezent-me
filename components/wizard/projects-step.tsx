"use client";

import { ArrowLeftIcon, ArrowRightIcon, FolderGit2Icon, PlusIcon, TrashIcon } from "lucide-react";

import type { ProjectDraft } from "@/components/wizard/draft";
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
import { Textarea } from "@/components/ui/textarea";

const emptyRow: ProjectDraft = {
  name: "",
  link: "",
  description: "",
};

export function ProjectsStep({
  rows,
  onChange,
  onNext,
  onBack,
}: {
  rows: ProjectDraft[];
  onChange: (rows: ProjectDraft[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function addRow() {
    onChange([...rows, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<ProjectDraft>) {
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
            <FolderGit2Icon className="size-4" />
          </span>
          <p className="text-sm font-medium text-foreground">No projects added yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Showcase open-source tools, apps, or case studies you have built.
          </p>
          <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={addRow}>
            <PlusIcon data-icon="inline-start" />
            Add project
          </Button>
        </div>
      ) : (
        rows.map((row, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <CardTitle className="truncate">{row.name.trim() || "Project"}</CardTitle>
              <CardDescription className="truncate">
                {row.link.trim() || "Repository link, live URL, and summary"}
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(index)}
                  aria-label="Remove project entry"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`proj-name-${index}`}>Project name</Label>
                  <Input
                    id={`proj-name-${index}`}
                    name="name"
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    placeholder="e.g. Prezentme"
                    maxLength={150}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`proj-link-${index}`}>URL / Repository</Label>
                  <Input
                    id={`proj-link-${index}`}
                    name="link"
                    value={row.link}
                    onChange={(e) => updateRow(index, { link: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`proj-desc-${index}`}>Description</Label>
                <Textarea
                  id={`proj-desc-${index}`}
                  name="description"
                  value={row.description}
                  onChange={(e) => updateRow(index, { description: e.target.value })}
                  placeholder="What problem does this project solve and how did you build it?"
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
              Add project
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
