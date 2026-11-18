import type { WizardDraft } from "@/components/wizard/draft";
import { normalizeYearMonth } from "@/lib/constants";
import {
  getUserById,
  getUserEducation,
  getUserExperiences,
  getUserLanguages,
  getUserProjects,
  getUserSetups,
} from "@/lib/users";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Normalizes an untrusted JSON payload into a `WizardDraft`, or returns `null` if not an object. */
export function normalizeDraft(raw: unknown): WizardDraft | null {
  if (!isRecord(raw)) return null;
  const profile = isRecord(raw.profile) ? raw.profile : {};

  const languages = Array.isArray(raw.languages)
    ? raw.languages.filter(isRecord).map((l) => ({
        language: asString(l.language),
        fluency: asString(l.fluency),
      }))
    : [];

  const education = Array.isArray(raw.education)
    ? raw.education.filter(isRecord).map((e) => ({
        degree: asString(e.degree),
        level: asString(e.level),
        university: asString(e.university),
        startDate: asString(e.startDate),
        endDate: asString(e.endDate),
        present: Boolean(e.present),
      }))
    : [];

  const experiences = Array.isArray(raw.experiences)
    ? raw.experiences.filter(isRecord).map((e) => ({
        role: asString(e.role),
        company: asString(e.company),
        description: asString(e.description),
        startDate: asString(e.startDate),
        endDate: asString(e.endDate),
        present: Boolean(e.present),
        technologies: asString(e.technologies),
      }))
    : [];

  const projects = Array.isArray(raw.projects)
    ? raw.projects.filter(isRecord).map((p) => ({
        name: asString(p.name),
        link: asString(p.link),
        description: asString(p.description),
      }))
    : [];

  const setup = Array.isArray(raw.setup)
    ? raw.setup.filter(isRecord).map((s) => ({
        name: asString(s.name),
        description: asString(s.description),
      }))
    : [];

  return {
    profile: {
      firstName: asString(profile.firstName),
      lastName: asString(profile.lastName),
      email: asString(profile.email),
      phone: asString(profile.phone),
      location: asString(profile.location),
      role: asString(profile.role),
      github: asString(profile.github),
      linkedin: asString(profile.linkedin),
    },
    languages,
    education,
    experiences,
    projects,
    setup,
  };
}

/** Loads the authenticated user's persisted profile data as a `WizardDraft`. */
export async function loadDraftFromDatabase(userId: string): Promise<WizardDraft | null> {
  const [user, languages, education, experiences, projects, setup] = await Promise.all([
    getUserById(userId),
    getUserLanguages(userId),
    getUserEducation(userId),
    getUserExperiences(userId),
    getUserProjects(userId),
    getUserSetups(userId),
  ]);

  if (!user) return null;

  return {
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
  };
}

/** Resolves a `WizardDraft` from the request body, falling back to the user's database records. */
export async function resolveExportDraft(
  request: Request,
  userId: string,
): Promise<WizardDraft | null> {
  let draft: WizardDraft | null = null;
  try {
    const body = (await request.json()) as { draft?: unknown };
    if (body && "draft" in body) {
      draft = normalizeDraft(body.draft);
    }
  } catch {
    // Fall back to database if no JSON body was sent
  }

  return draft ?? (await loadDraftFromDatabase(userId));
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Builds a dated download filename for exported portfolio files. */
export function buildExportFilename(draft: WizardDraft, extension: "pdf" | "html"): string {
  const fullName = [draft.profile.firstName, draft.profile.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  const nameSlug = slugify(fullName);
  const date = new Date().toISOString().slice(0, 10);
  return nameSlug ? `prezentme-${nameSlug}-${date}.${extension}` : `prezentme-${date}.${extension}`;
}
