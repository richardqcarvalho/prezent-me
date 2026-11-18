"use client";

import { useState } from "react";
import { ArrowLeftIcon, CodeIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { flushWizardSyncs, type WizardDraft } from "@/components/wizard/draft";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildPortfolioViewModel } from "@/lib/portfolio";

export function OverviewStep({
  draft,
  onBack,
  onGoToStep,
}: {
  draft: WizardDraft;
  onBack: () => void;
  onGoToStep: (stepIndex: number) => void;
}) {
  const [generatingFormat, setGeneratingFormat] = useState<"pdf" | "html" | null>(null);

  const {
    fullName,
    email,
    phone,
    role,
    location,
    github,
    linkedin,
    languages,
    education,
    totalEducationDuration,
    experiences,
    totalExperienceDuration,
    technologyTotals,
    projects,
    setups,
  } = buildPortfolioViewModel(draft);

  async function handleGenerateExport(format: "pdf" | "html") {
    if (generatingFormat !== null) return;
    const label = format.toUpperCase();
    setGeneratingFormat(format);
    try {
      await flushWizardSyncs();
      const response = await fetch(`/api/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? `Failed to generate ${label}. Please try again.`);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = /filename="([^"]+)"/.exec(disposition);
      const date = new Date().toISOString().slice(0, 10);
      const filename = filenameMatch?.[1] ?? `prezentme-${date}.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`${label} generated.`);
    } catch (error) {
      console.error(`Failed to generate ${label}:`, error);
      toast.error(`Failed to generate ${label}. Please try again.`);
    } finally {
      setGeneratingFormat(null);
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Profile</CardTitle>
          <CardDescription>Personal details and social links</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onGoToStep(0)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Name</span>
            <span className="text-sm font-medium text-foreground">
              {fullName || <span className="text-muted-foreground">Not provided</span>}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Role</span>
            <span className="text-sm font-medium text-foreground">
              {role || <span className="text-muted-foreground">Not provided</span>}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Email</span>
            <span className="text-sm text-foreground">
              {email || <span className="text-muted-foreground">Not provided</span>}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Phone</span>
            <span className="text-sm text-foreground tabular-nums">
              {phone || <span className="text-muted-foreground">Not provided</span>}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Location</span>
            <span className="text-sm text-foreground">
              {location || <span className="text-muted-foreground">Not provided</span>}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Links</span>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {github ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">
                  {github.display}
                </span>
              ) : null}
              {linkedin ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">
                  {linkedin.display}
                </span>
              ) : null}
              {!github && !linkedin && (
                <span className="font-sans text-sm text-muted-foreground">Not provided</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Languages</CardTitle>
          <CardDescription>Spoken languages and fluency</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onGoToStep(1)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {languages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No languages added.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {languages.map((l, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-sm"
                >
                  <span className="font-medium text-foreground">{l.language}</span>
                  {l.fluencyLabel && (
                    <span className="text-xs text-muted-foreground">{l.fluencyLabel}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <span>Education</span>
            {totalEducationDuration && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground">
                {totalEducationDuration}
              </span>
            )}
          </CardTitle>
          <CardDescription>Academic background and degrees</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onGoToStep(2)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {education.length === 0 ? (
            <p className="text-sm text-muted-foreground">No education entries added.</p>
          ) : (
            <div className="grid divide-y divide-border/60">
              {education.map((e, i) => (
                <div key={i} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {e.degree || "Untitled degree"}
                    </span>
                    {e.dates && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {e.dates}
                        {e.duration ? ` · ${e.duration}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {e.university && <span>{e.university}</span>}
                    {e.levelLabel && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-secondary-foreground">
                        {e.levelLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <span>Experience</span>
            {totalExperienceDuration && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground">
                {totalExperienceDuration}
              </span>
            )}
          </CardTitle>
          <CardDescription>Work history and technologies</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onGoToStep(3)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No work experience added.</p>
          ) : (
            <div className="grid divide-y divide-border/60">
              {experiences.map((exp, i) => (
                <div key={i} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {exp.role || "Untitled role"}
                      </span>
                      {exp.company && (
                        <span className="text-sm text-muted-foreground"> · {exp.company}</span>
                      )}
                    </div>
                    {exp.dates && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {exp.dates}
                        {exp.duration ? ` · ${exp.duration}` : ""}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
              {technologyTotals.length > 0 && (
                <div className="grid gap-2 pt-3 first:pt-0">
                  <span className="text-xs font-medium text-muted-foreground">Technologies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {technologyTotals.map((tech) => (
                      <div
                        key={tech.key}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-0.5 text-xs"
                      >
                        <span className="font-medium text-foreground">{tech.label}</span>
                        {tech.duration && (
                          <span className="font-mono text-muted-foreground">{tech.duration}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Projects</CardTitle>
          <CardDescription>Selected repositories and works</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onGoToStep(4)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects added.</p>
          ) : (
            <div className="grid divide-y divide-border/60">
              {projects.map((proj, i) => (
                <div key={i} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {proj.name || "Untitled project"}
                    </span>
                    {proj.link && (
                      <span className="font-mono text-xs text-muted-foreground">{proj.link}</span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Setup</CardTitle>
          <CardDescription>Hardware, software, and tools</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onGoToStep(5)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {setups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No setup items added.</p>
          ) : (
            <div className="grid divide-y divide-border/60">
              {setups.map((item, i) => (
                <div key={i} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-foreground">
                    {item.name || "Untitled item"}
                  </span>
                  {item.description && (
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={generatingFormat !== null}
            onClick={() => handleGenerateExport("pdf")}
          >
            {generatingFormat === "pdf" ? (
              <>
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileTextIcon data-icon="inline-start" />
                Generate PDF
              </>
            )}
          </Button>
          <Button
            type="button"
            disabled={generatingFormat !== null}
            onClick={() => handleGenerateExport("html")}
          >
            {generatingFormat === "html" ? (
              <>
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CodeIcon data-icon="inline-start" />
                Generate HTML
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
