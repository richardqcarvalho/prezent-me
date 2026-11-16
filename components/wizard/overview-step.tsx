"use client";

import { ArrowLeftIcon, CodeIcon, FileTextIcon } from "lucide-react";

import type { WizardDraft } from "@/components/wizard/draft";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FLUENCY_LABELS: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  advanced: "Advanced",
  intermediate: "Intermediate",
  basic: "Basic",
};

const LEVEL_LABELS: Record<string, string> = {
  high_school: "High school",
  bootcamp: "Bootcamp",
  associate: "Associate",
  bachelor: "Bachelor",
  master: "Master",
  phd: "PhD",
  other: "Other",
};

function formatDateRange(start: string, end: string, present: boolean) {
  const from = start.trim();
  const to = present ? "Present" : end.trim();
  if (from && to) return `${from} — ${to}`;
  if (from) return from;
  if (to) return to;
  return null;
}

export function OverviewStep({
  draft,
  onBack,
  onGoToStep,
}: {
  draft: WizardDraft;
  onBack: () => void;
  onGoToStep: (stepIndex: number) => void;
}) {
  const fullName = [draft.profile.firstName, draft.profile.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  const languages = draft.languages.filter((l) => l.language.trim() !== "");
  const education = draft.education.filter(
    (e) => e.degree.trim() !== "" || e.university.trim() !== "",
  );
  const experiences = draft.experiences.filter(
    (e) => e.role.trim() !== "" || e.company.trim() !== "",
  );
  const projects = draft.projects.filter(
    (p) => p.name.trim() !== "" || p.link.trim() !== "" || p.description.trim() !== "",
  );
  const setups = draft.setup.filter((s) => s.name.trim() !== "" || s.description.trim() !== "");

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
              {draft.profile.role.trim() || (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Location</span>
            <span className="text-sm text-foreground">
              {draft.profile.location.trim() || (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Links</span>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {draft.profile.github.trim() ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">
                  {draft.profile.github.replace(/^https?:\/\/(www\.)?/i, "")}
                </span>
              ) : null}
              {draft.profile.linkedin.trim() ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground">
                  {draft.profile.linkedin.replace(/^https?:\/\/(www\.)?/i, "")}
                </span>
              ) : null}
              {!draft.profile.github.trim() && !draft.profile.linkedin.trim() && (
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
                  {l.fluency && (
                    <span className="text-xs text-muted-foreground">
                      {FLUENCY_LABELS[l.fluency] ?? l.fluency}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Education</CardTitle>
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
              {education.map((e, i) => {
                const dates = formatDateRange(e.startDate, e.endDate, e.present);
                return (
                  <div key={i} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {e.degree || "Untitled degree"}
                      </span>
                      {dates && (
                        <span className="font-mono text-xs text-muted-foreground">{dates}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {e.university && <span>{e.university}</span>}
                      {e.level && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-secondary-foreground">
                          {LEVEL_LABELS[e.level] ?? e.level}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Experience</CardTitle>
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
              {experiences.map((exp, i) => {
                const dates = formatDateRange(exp.startDate, exp.endDate, exp.present);
                const techs = exp.technologies
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                return (
                  <div key={i} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {exp.role || "Untitled role"}
                        </span>
                        {exp.company && (
                          <span className="text-sm text-muted-foreground"> · {exp.company}</span>
                        )}
                      </div>
                      {dates && (
                        <span className="font-mono text-xs text-muted-foreground">{dates}</span>
                      )}
                    </div>
                    {exp.description.trim() && (
                      <p className="text-sm whitespace-pre-line text-muted-foreground">
                        {exp.description}
                      </p>
                    )}
                    {techs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {techs.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
                    {proj.link.trim() && (
                      <span className="font-mono text-xs text-muted-foreground">{proj.link}</span>
                    )}
                  </div>
                  {proj.description.trim() && (
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
                  {item.description.trim() && (
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
          <Button type="button" variant="outline">
            <FileTextIcon data-icon="inline-start" />
            Generate PDF
          </Button>
          <Button type="button">
            <CodeIcon data-icon="inline-start" />
            Generate HTML
          </Button>
        </div>
      </div>
    </div>
  );
}
