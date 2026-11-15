"use client";

import { PlusIcon, TrashIcon } from "lucide-react";

import type { ProjectDraft } from "@/components/wizard/draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="grid gap-6"
    >
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="name"
                value={row.name}
                onChange={(e) => updateRow(index, { name: e.target.value })}
                placeholder="Project name"
                maxLength={150}
                aria-label="Project name"
              />
              <Input
                name="link"
                value={row.link}
                onChange={(e) => updateRow(index, { link: e.target.value })}
                placeholder="https://example.com"
                aria-label="Project link"
              />
            </div>
            <Textarea
              name="description"
              value={row.description}
              onChange={(e) => updateRow(index, { description: e.target.value })}
              placeholder="What is this project about?"
              aria-label="Project description"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(index)}
            aria-label="Remove project entry"
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={addRow}
      >
        <PlusIcon data-icon="inline-start" />
        Add project
      </Button>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
