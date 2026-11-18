"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { exportUserData, importUserData } from "@/app/actions/wizard";
import { Button } from "@/components/ui/button";
import {
  applyImportedWizardDraft,
  cancelWizardSyncs,
  clearAllDraftSlices,
  flushWizardSyncs,
} from "@/components/wizard/draft";

type DataTransferActionsProps = {
  userId: string;
  githubLogin?: string | null;
};

export function DataTransferActions({ userId, githubLogin }: DataTransferActionsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      await flushWizardSyncs();
      const result = await exportUserData();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const date = new Date().toISOString().slice(0, 10);
      const prefix = githubLogin ? `prezentme-${githubLogin}` : "prezentme";
      const filename = `${prefix}-${date}.json`;

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Information exported.");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      let parsed: unknown;
      try {
        const text = await file.text();
        parsed = JSON.parse(text);
      } catch {
        toast.error("Invalid JSON file.");
        return;
      }

      cancelWizardSyncs();
      const result = await importUserData(parsed);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      clearAllDraftSlices(userId);
      applyImportedWizardDraft(result.draft);
      router.refresh();
      toast.success("Information imported.");
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error("Failed to import data. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import JSON file"
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Import JSON"
        className="w-8 px-0 sm:w-auto sm:px-2.5"
      >
        <UploadIcon />
        <span className="hidden sm:inline">Import</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={handleExport}
        aria-label="Export JSON"
        className="w-8 px-0 sm:w-auto sm:px-2.5"
      >
        <DownloadIcon />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  );
}
