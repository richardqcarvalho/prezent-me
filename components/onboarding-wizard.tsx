"use client";

import { useEffect, useRef, useState } from "react";
import {
  BriefcaseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  LanguagesIcon,
  LaptopIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { updateProfile } from "@/app/actions/profile";
import {
  saveEducation,
  saveExperiences,
  saveLanguages,
  saveProjects,
  saveSetup,
  type ActionState,
} from "@/app/actions/wizard";
import { EducationStep } from "@/components/wizard/education-step";
import {
  buildStepFormData,
  clearDraftSliceIfUnchanged,
  dropDraftSlice,
  loadCachedSlices,
  registerWizardBridge,
  saveDraftSlice,
  WIZARD_STEP_IDS,
  type EducationDraft,
  type ExperienceDraft,
  type LanguageDraft,
  type ProfileDraft,
  type ProjectDraft,
  type SetupDraft,
  type WizardDraft,
  type WizardStepId,
} from "@/components/wizard/draft";
import { ExperienceStep } from "@/components/wizard/experience-step";
import { LanguagesStep } from "@/components/wizard/languages-step";
import { OverviewStep } from "@/components/wizard/overview-step";
import { ProfileStep } from "@/components/wizard/profile-step";
import { ProjectsStep } from "@/components/wizard/projects-step";
import { SetupStep } from "@/components/wizard/setup-step";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeYearMonth } from "@/lib/constants";
import type { Education, Experience, Language, Project, Setup, User } from "@/lib/db/schema";

type NavStepId = WizardStepId | "overview";

const STEPS: ReadonlyArray<{
  id: NavStepId;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "profile",
    title: "Profile",
    description:
      "Your core identity, role, location, and public developer links used across your portfolio.",
    icon: UserIcon,
  },
  {
    id: "languages",
    title: "Languages",
    description: "Spoken languages and your fluency level for international teams and roles.",
    icon: LanguagesIcon,
  },
  {
    id: "education",
    title: "Education",
    description: "Academic degrees, bootcamps, certifications, and institutions you attended.",
    icon: GraduationCapIcon,
  },
  {
    id: "experiences",
    title: "Experience",
    description: "Work history, responsibilities, and the technologies you shipped in production.",
    icon: BriefcaseIcon,
  },
  {
    id: "projects",
    title: "Projects",
    description: "Open-source repositories, side projects, and case studies worth highlighting.",
    icon: FolderGit2Icon,
  },
  {
    id: "setup",
    title: "Setup",
    description: "Hardware, software, and daily tools that power your development workflow.",
    icon: LaptopIcon,
  },
  {
    id: "overview",
    title: "Overview",
    description: "Review all your information in one place and export your portfolio.",
    icon: EyeIcon,
  },
];

const SYNC_DELAY_MS = 800;

const ACTIONS: Record<WizardStepId, (formData: FormData) => Promise<ActionState>> = {
  profile: updateProfile,
  languages: saveLanguages,
  education: saveEducation,
  experiences: saveExperiences,
  projects: saveProjects,
  setup: saveSetup,
};

type OnboardingWizardProps = {
  user: User;
  languages: Language[];
  education: Education[];
  experiences: Experience[];
  projects: Project[];
  setup: Setup[];
  /** Server-side last-modified (ms epoch) per step, for last-writer-wins restore. */
  serverTimestamps: Record<WizardStepId, number>;
};

export function OnboardingWizard({
  user,
  languages,
  education,
  experiences,
  projects,
  setup,
  serverTimestamps,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(() => ({
    profile: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      location: user.location ?? "",
      role: user.role ?? "",
      github: user.github ?? "",
      linkedin: user.linkedin ?? "",
    },
    languages: languages.map((l) => ({ language: l.language, fluency: l.fluency })),
    education: education.map((e) => ({
      degree: e.degree,
      level: e.level,
      university: e.university,
      startDate: normalizeYearMonth(e.startDate) ?? "",
      endDate: normalizeYearMonth(e.endDate) ?? "",
      present: false,
    })),
    experiences: experiences.map((e) => ({
      role: e.role,
      company: e.company,
      description: e.description ?? "",
      startDate: normalizeYearMonth(e.startDate) ?? "",
      endDate: normalizeYearMonth(e.endDate) ?? "",
      present: false,
      technologies: (e.technologies ?? []).join(", "),
    })),
    projects: projects.map((p) => ({
      name: p.name,
      link: p.link ?? "",
      description: p.description ?? "",
    })),
    setup: setup.map((s) => ({
      name: s.name,
      description: s.description ?? "",
    })),
  }));

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const syncTimers = useRef(new Map<WizardStepId, ReturnType<typeof setTimeout>>());

  // Restore locally cached edits after mount (avoids hydration mismatch).
  // Last writer wins: a cached slice newer than the server version is restored
  // and re-synced; a stale one (server changed elsewhere) is discarded.
  useEffect(() => {
    const cached = loadCachedSlices(user.id);
    const restored: Partial<Record<WizardStepId, unknown>> = {};
    const restoreIds: WizardStepId[] = [];

    for (const id of WIZARD_STEP_IDS) {
      const slice = cached[id];
      if (!slice) continue;
      if (slice.savedAt > (serverTimestamps[id] ?? 0)) {
        restored[id] = slice.data;
        restoreIds.push(id);
      } else {
        dropDraftSlice(user.id, id);
      }
    }

    if (restoreIds.length > 0) {
      setDraft((prev) => ({ ...prev, ...restored }) as WizardDraft);
      for (const id of restoreIds) {
        scheduleSync(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    return registerWizardBridge({
      flushAll: async () => {
        const timers = syncTimers.current;
        const pendingIds = Array.from(timers.keys());
        for (const id of pendingIds) {
          clearTimeout(timers.get(id));
          timers.delete(id);
        }
        await Promise.all(pendingIds.map((id) => sync(id)));
      },
      cancelAll: () => {
        const timers = syncTimers.current;
        for (const timer of timers.values()) {
          clearTimeout(timer);
        }
        timers.clear();
      },
      applyDraft: (nextDraft) => {
        const timers = syncTimers.current;
        for (const timer of timers.values()) {
          clearTimeout(timer);
        }
        timers.clear();
        draftRef.current = nextDraft;
        setDraft(nextDraft);
      },
    });
  });

  async function sync(id: WizardStepId) {
    const snapshot = JSON.stringify(draftRef.current[id]);
    try {
      const result = await ACTIONS[id](buildStepFormData(id, draftRef.current));
      if (result.success) {
        clearDraftSliceIfUnchanged(user.id, id, snapshot);
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(`Failed to sync ${id}:`, error);
      toast.error("Something went wrong. Please try again.");
    }
  }

  function scheduleSync(id: WizardStepId) {
    const timers = syncTimers.current;
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        void sync(id);
      }, SYNC_DELAY_MS),
    );
  }

  function flushSync(id: WizardStepId) {
    const timers = syncTimers.current;
    const existing = timers.get(id);
    if (existing) {
      clearTimeout(existing);
      timers.delete(id);
    }
    void sync(id);
  }

  function update(id: WizardStepId, transform: (draft: WizardDraft) => WizardDraft) {
    const next = transform(draftRef.current);
    const savedAt = Date.now();
    draftRef.current = next;
    setDraft(next);
    saveDraftSlice(user.id, id, next[id], savedAt);
    scheduleSync(id);
  }

  const patchProfile = (patch: Partial<ProfileDraft>) =>
    update("profile", (d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const updateLanguages = (rows: LanguageDraft[]) =>
    update("languages", (d) => ({ ...d, languages: rows }));
  const updateEducation = (rows: EducationDraft[]) =>
    update("education", (d) => ({ ...d, education: rows }));
  const updateExperiences = (rows: ExperienceDraft[]) =>
    update("experiences", (d) => ({ ...d, experiences: rows }));
  const updateProjects = (rows: ProjectDraft[]) =>
    update("projects", (d) => ({ ...d, projects: rows }));
  const updateSetup = (rows: SetupDraft[]) => update("setup", (d) => ({ ...d, setup: rows }));

  function goToStep(nextStep: number) {
    if (nextStep === step) return;
    const currentId = STEPS[step].id;
    if (currentId !== "overview" && syncTimers.current.has(currentId)) {
      flushSync(currentId);
    }
    setStep(nextStep);
  }

  function goNext(id: WizardStepId, nextStep: number) {
    if (syncTimers.current.has(id)) {
      flushSync(id);
    }
    setStep(nextStep);
  }

  function goBack(nextStep: number) {
    goToStep(nextStep);
  }

  const currentStep = STEPS[step];
  const CurrentStepIcon = currentStep.icon;
  const stepItems = Object.fromEntries(STEPS.map((s, i) => [String(i), s.title]));

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      {/* Mobile sticky step switcher */}
      <div className="sticky top-(--header-height) z-30 border-b border-grid bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={step === 0}
            onClick={() => goToStep(step - 1)}
            aria-label="Previous section"
          >
            <ChevronLeftIcon />
          </Button>

          <Select
            items={stepItems}
            value={String(step)}
            onValueChange={(val) => {
              if (val !== null) goToStep(Number(val));
            }}
          >
            <SelectTrigger className="min-w-0 flex-1" aria-label="Select section">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <CurrentStepIcon className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue />
                <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                  {step + 1}/{STEPS.length}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent align="center" alignItemWithTrigger={false}>
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <SelectItem key={s.id} value={String(i)}>
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span>{s.title}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {i + 1}/{STEPS.length}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={step === STEPS.length - 1}
            onClick={() => goToStep(step + 1)}
            aria-label="Next section"
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop sidebar navigation */}
      <aside className="hidden border-r border-grid md:block md:w-64 md:shrink-0">
        <div className="sticky top-(--header-height) flex flex-col gap-2 p-4">
          <div className="flex items-center px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <span>Sections</span>
          </div>
          <nav aria-label="Progress" className="flex flex-col gap-1">
            {STEPS.map((s, i) => {
              const isActive = i === step;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 justify-center px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-1.5 border-b border-grid pb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {currentStep.title}
            </h1>
            <p className="text-sm text-balance text-muted-foreground sm:text-base">
              {currentStep.description}
            </p>
          </div>

          {step === 0 && (
            <ProfileStep
              value={draft.profile}
              onChange={patchProfile}
              onNext={() => goNext("profile", 1)}
            />
          )}
          {step === 1 && (
            <LanguagesStep
              rows={draft.languages}
              onChange={updateLanguages}
              onBack={() => goBack(0)}
              onNext={() => goNext("languages", 2)}
            />
          )}
          {step === 2 && (
            <EducationStep
              rows={draft.education}
              onChange={updateEducation}
              onBack={() => goBack(1)}
              onNext={() => goNext("education", 3)}
            />
          )}
          {step === 3 && (
            <ExperienceStep
              rows={draft.experiences}
              onChange={updateExperiences}
              onBack={() => goBack(2)}
              onNext={() => goNext("experiences", 4)}
            />
          )}
          {step === 4 && (
            <ProjectsStep
              rows={draft.projects}
              onChange={updateProjects}
              onBack={() => goBack(3)}
              onNext={() => goNext("projects", 5)}
            />
          )}
          {step === 5 && (
            <SetupStep
              rows={draft.setup}
              onChange={updateSetup}
              onBack={() => goBack(4)}
              onNext={() => goNext("setup", 6)}
            />
          )}
          {step === 6 && (
            <OverviewStep draft={draft} onBack={() => goBack(5)} onGoToStep={goToStep} />
          )}
        </div>
      </div>
    </div>
  );
}
