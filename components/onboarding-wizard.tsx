"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ProfileStep } from "@/components/wizard/profile-step";
import { ProjectsStep } from "@/components/wizard/projects-step";
import { SetupStep } from "@/components/wizard/setup-step";
import type { Education, Experience, Language, Project, Setup, User } from "@/lib/db/schema";

const STEPS = [
  { id: "profile", title: "Profile" },
  { id: "languages", title: "Language" },
  { id: "education", title: "Education" },
  { id: "experiences", title: "Experience" },
  { id: "projects", title: "Projects" },
  { id: "setup", title: "Setup" },
] as const satisfies ReadonlyArray<{ id: WizardStepId; title: string }>;

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
  setup: Setup | null;
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(() => ({
    profile: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
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
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      present: false,
    })),
    experiences: experiences.map((e) => ({
      role: e.role,
      company: e.company,
      description: e.description ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      present: false,
      technologies: (e.technologies ?? []).join(", "),
    })),
    projects: projects.map((p) => ({
      name: p.name,
      link: p.link ?? "",
      description: p.description ?? "",
    })),
    setup: { name: setup?.name ?? "", description: setup?.description ?? "" },
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
  const updateSetup = (patch: Partial<SetupDraft>) =>
    update("setup", (d) => ({ ...d, setup: { ...d.setup, ...patch } }));

  function goToStep(nextStep: number) {
    if (nextStep === step) return;
    const currentId = STEPS[step].id;
    if (syncTimers.current.has(currentId)) {
      flushSync(currentId);
    }
    setStep(nextStep);
  }

  function goNext(id: WizardStepId, nextStep: number) {
    flushSync(id);
    setStep(nextStep);
  }

  function goBack(nextStep: number) {
    goToStep(nextStep);
  }

  function finish() {
    if (!draftRef.current.setup.name.trim()) {
      toast.error("Please give your setup a name.");
      return;
    }
    flushSync("setup");
    router.push("/");
  }

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <aside className="w-full border-b bg-sidebar text-sidebar-foreground md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <nav aria-label="Progress" className="flex gap-1 overflow-x-auto p-3 md:flex-col md:p-4">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(i)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ring-1 transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground ring-primary"
                      : i < step
                        ? "bg-primary/15 text-foreground ring-foreground/15"
                        : "bg-muted text-muted-foreground ring-foreground/10",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-sidebar-accent-foreground",
                  )}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 justify-center p-6 md:p-10">
        <div className="flex w-full max-w-xl flex-col gap-6">
          <h1 className="text-lg font-medium">{STEPS[step].title}</h1>

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
              value={draft.setup}
              onChange={updateSetup}
              onBack={() => goBack(4)}
              onFinish={finish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
