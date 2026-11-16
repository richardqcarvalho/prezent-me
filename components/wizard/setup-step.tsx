"use client";

import { ArrowLeftIcon, ArrowRightIcon, LaptopIcon, PlusIcon, TrashIcon } from "lucide-react";

import type { SetupDraft } from "@/components/wizard/draft";
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

const emptyRow: SetupDraft = {
  name: "",
  description: "",
};

export function SetupStep({
  rows,
  onChange,
  onNext,
  onBack,
}: {
  rows: SetupDraft[];
  onChange: (rows: SetupDraft[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function addRow() {
    onChange([...rows, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<SetupDraft>) {
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
            <LaptopIcon className="size-4" />
          </span>
          <p className="text-sm font-medium text-foreground">No setup items added yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Add your hardware, editor, terminal, or daily tools that make up your workflow.
          </p>
          <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={addRow}>
            <PlusIcon data-icon="inline-start" />
            Add setup
          </Button>
        </div>
      ) : (
        rows.map((row, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <CardTitle className="truncate">{row.name.trim() || "Setup Item"}</CardTitle>
              </div>
              <CardDescription className="truncate">
                {row.description.trim() || "Hardware, software, or environment details"}
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(index)}
                  aria-label="Remove setup entry"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`setup-name-${index}`}>Name</Label>
                <Input
                  id={`setup-name-${index}`}
                  name="name"
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  placeholder="e.g. MacBook Pro 16-inch (M3 Max)"
                  maxLength={100}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`setup-desc-${index}`}>Description</Label>
                <Textarea
                  id={`setup-desc-${index}`}
                  name="description"
                  value={row.description}
                  onChange={(e) => updateRow(index, { description: e.target.value })}
                  placeholder="Why you use it, specs, or configuration notes..."
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
              Add setup
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
