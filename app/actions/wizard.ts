"use server";

import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { education, experiences, languages, projects, setups, users } from "@/lib/db/schema";
import {
  isEducationLevel,
  isFluencyLevel,
  type EducationLevel,
  type FluencyLevel,
} from "@/lib/constants";
import { getSessionUser } from "@/lib/session";
import {
  getLatestSetup,
  getUserById,
  getUserEducation,
  getUserExperiences,
  getUserLanguages,
  getUserProjects,
} from "@/lib/users";
import type { WizardDraft } from "@/components/wizard/draft";

export type ActionState = {
  success: boolean;
  error?: string;
};

export type ExportedData = {
  version: 1;
  exportedAt: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    location: string | null;
    role: string | null;
    github: string | null;
    linkedin: string | null;
  };
  languages: {
    language: string;
    fluency: FluencyLevel;
  }[];
  education: {
    degree: string;
    level: EducationLevel;
    university: string;
    startDate: string | null;
    endDate: string | null;
  }[];
  experiences: {
    role: string;
    company: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    technologies: string[];
  }[];
  projects: {
    name: string;
    link: string | null;
    description: string | null;
  }[];
  setup: {
    name: string;
    description: string | null;
  } | null;
};

export type ExportActionResult =
  | { success: true; data: ExportedData }
  | { success: false; error: string };

export type ImportActionResult =
  | { success: true; draft: WizardDraft }
  | { success: false; error: string };

function revalidate() {
  revalidatePath("/");
}

async function requireUserId() {
  const user = await getSessionUser();
  return user?.id ?? null;
}

function parseMonth(value: FormDataEntryValue | null) {
  const raw = (value as string)?.trim() || "";
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

export async function saveLanguages(formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const names = formData.getAll("language").map((v) => String(v).trim());
  const fluencies = formData.getAll("fluency").map((v) => String(v).trim());

  const rows = names
    .map((language, i) => ({ language, fluency: fluencies[i] }))
    .filter((row) => row.language !== "");

  if (rows.length > 0) {
    const invalid = rows.find((row) => !isFluencyLevel(row.fluency));
    if (invalid) {
      return { success: false, error: "Please select a fluency level for each language." };
    }
  }

  try {
    await db.batch([
      db.delete(languages).where(eq(languages.userId, userId)),
      ...(rows.length > 0
        ? [
            db.insert(languages).values(
              rows.map((row) => ({
                userId,
                language: row.language,
                fluency: row.fluency,
                updatedAt: new Date(),
              })),
            ),
          ]
        : []),
    ]);
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to save languages:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveEducation(formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const degrees = formData.getAll("degree").map((v) => String(v).trim());
  const levels = formData.getAll("level").map((v) => String(v).trim());
  const universities = formData.getAll("university").map((v) => String(v).trim());
  const starts = formData.getAll("startDate").map((v) => String(v).trim());
  const ends = formData.getAll("endDate").map((v) => String(v).trim());

  const rows = degrees
    .map((degree, i) => ({
      degree,
      level: levels[i],
      university: universities[i],
      startDate: parseMonth(starts[i]),
      endDate: parseMonth(ends[i]),
    }))
    .filter((row) => row.degree !== "" && row.university !== "");

  if (rows.length > 0) {
    const invalid = rows.find((row) => !isEducationLevel(row.level) || row.university === "");
    if (invalid) {
      return {
        success: false,
        error: "Please select an education level and fill in the university for each entry.",
      };
    }
  }

  try {
    await db.batch([
      db.delete(education).where(eq(education.userId, userId)),
      ...(rows.length > 0
        ? [
            db
              .insert(education)
              .values(rows.map((row) => ({ userId, ...row, updatedAt: new Date() }))),
          ]
        : []),
    ]);
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to save education:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveExperiences(formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const companies = formData.getAll("company").map((v) => String(v).trim());
  const roles = formData.getAll("role").map((v) => String(v).trim());
  const descriptions = formData.getAll("description").map((v) => String(v).trim());
  const starts = formData.getAll("startDate").map((v) => String(v).trim());
  const ends = formData.getAll("endDate").map((v) => String(v).trim());
  const technologies = formData.getAll("technologies").map((v) => String(v).trim());

  const rows = companies
    .map((company, i) => ({
      company,
      role: roles[i],
      description: descriptions[i] || null,
      startDate: parseMonth(starts[i]),
      endDate: parseMonth(ends[i]),
      technologies: technologies[i]
        ? technologies[i]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    }))
    .filter((row) => row.company !== "" || row.role !== "");

  const invalid = rows.find((row) => row.company === "" || row.role === "");
  if (invalid) {
    return {
      success: false,
      error: "Please fill in the role and company for each experience entry.",
    };
  }

  try {
    await db.batch([
      db.delete(experiences).where(eq(experiences.userId, userId)),
      ...(rows.length > 0
        ? [
            db
              .insert(experiences)
              .values(rows.map((row) => ({ userId, ...row, updatedAt: new Date() }))),
          ]
        : []),
    ]);
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to save experiences:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveProjects(formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const names = formData.getAll("name").map((v) => String(v).trim());
  const links = formData.getAll("link").map((v) => String(v).trim());
  const descriptions = formData.getAll("description").map((v) => String(v).trim());

  const rows = names
    .map((name, i) => ({
      name,
      link: links[i] || null,
      description: descriptions[i] || null,
    }))
    .filter((row) => row.name !== "" || row.link !== null || row.description !== null);

  const invalid = rows.find((row) => row.name === "");
  if (invalid) {
    return {
      success: false,
      error: "Please fill in the project name for each project entry.",
    };
  }

  try {
    await db.batch([
      db.delete(projects).where(eq(projects.userId, userId)),
      ...(rows.length > 0
        ? [
            db
              .insert(projects)
              .values(rows.map((row) => ({ userId, ...row, updatedAt: new Date() }))),
          ]
        : []),
    ]);
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to save projects:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveSetup(formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const name = (formData.get("name") as string)?.trim() || "";
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { success: false, error: "Please give your setup a name." };
  }

  try {
    await db.insert(setups).values({
      userId: user.id,
      name,
      description,
      completedAt: new Date(),
    });
    revalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to save setup:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

function cleanString(value: unknown, maxLength?: number): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function cleanNullableString(value: unknown, maxLength?: number): string | null {
  const cleaned = cleanString(value, maxLength);
  return cleaned || null;
}

function parseMonthUnknown(value: unknown): string | null {
  const cleaned = cleanString(value);
  return /^\d{4}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function exportUserData(): Promise<ExportActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const [user, userLanguages, userEducation, userExperiences, userProjects, setup] =
      await Promise.all([
        getUserById(userId),
        getUserLanguages(userId),
        getUserEducation(userId),
        getUserExperiences(userId),
        getUserProjects(userId),
        getLatestSetup(userId),
      ]);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const data: ExportedData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        location: user.location,
        role: user.role,
        github: user.github,
        linkedin: user.linkedin,
      },
      languages: userLanguages
        .filter((l): l is typeof l & { fluency: FluencyLevel } => isFluencyLevel(l.fluency))
        .map((l) => ({
          language: l.language,
          fluency: l.fluency,
        })),
      education: userEducation
        .filter((e): e is typeof e & { level: EducationLevel } => isEducationLevel(e.level))
        .map((e) => ({
          degree: e.degree,
          level: e.level,
          university: e.university,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
      experiences: userExperiences.map((e) => ({
        role: e.role,
        company: e.company,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        technologies: e.technologies ?? [],
      })),
      projects: userProjects.map((p) => ({
        name: p.name,
        link: p.link,
        description: p.description,
      })),
      setup: setup
        ? {
            name: setup.name,
            description: setup.description,
          }
        : null,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Failed to export user data:", error);
    return { success: false, error: "Failed to export data. Please try again." };
  }
}

const KNOWN_SECTIONS = [
  "profile",
  "languages",
  "education",
  "experiences",
  "projects",
  "setup",
] as const;

export async function importUserData(raw: unknown): Promise<ImportActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  if (!isPlainObject(raw)) {
    return { success: false, error: "Invalid file format. Expected a JSON object." };
  }

  const hasKnownSection = KNOWN_SECTIONS.some((key) => key in raw);
  if (!hasKnownSection) {
    return {
      success: false,
      error: "Invalid file format. No recognizable Prezentme sections found.",
    };
  }

  // 1. Profile
  const rawProfile = raw.profile;
  if (rawProfile !== undefined && rawProfile !== null && !isPlainObject(rawProfile)) {
    return { success: false, error: "Invalid profile section." };
  }
  const profileObj = isPlainObject(rawProfile) ? rawProfile : {};
  const firstName = cleanNullableString(profileObj.firstName, 100);
  const lastName = cleanNullableString(profileObj.lastName, 100);
  const location = cleanNullableString(profileObj.location);
  const role = cleanNullableString(profileObj.role, 100);
  const github = cleanNullableString(profileObj.github, 255);
  const linkedin = cleanNullableString(profileObj.linkedin, 255);

  // 2. Languages
  const rawLanguages = raw.languages ?? [];
  if (!Array.isArray(rawLanguages)) {
    return { success: false, error: "Invalid languages section." };
  }
  const languageRows = rawLanguages
    .filter(isPlainObject)
    .map((item) => ({
      language: cleanString(item.language, 50),
      fluency: cleanString(item.fluency, 20),
    }))
    .filter((row) => row.language !== "");

  if (languageRows.some((row) => !isFluencyLevel(row.fluency))) {
    return {
      success: false,
      error: "Please provide a valid fluency level for each language.",
    };
  }

  // 3. Education
  const rawEducation = raw.education ?? [];
  if (!Array.isArray(rawEducation)) {
    return { success: false, error: "Invalid education section." };
  }
  const educationRows = rawEducation
    .filter(isPlainObject)
    .map((item) => ({
      degree: cleanString(item.degree, 150),
      level: cleanString(item.level, 20),
      university: cleanString(item.university, 150),
      startDate: parseMonthUnknown(item.startDate),
      endDate: parseMonthUnknown(item.endDate),
    }))
    .filter((row) => row.degree !== "" || row.university !== "");

  if (
    educationRows.some(
      (row) => row.degree === "" || row.university === "" || !isEducationLevel(row.level),
    )
  ) {
    return {
      success: false,
      error: "Each education entry requires a degree, university, and valid level.",
    };
  }

  // 4. Experiences
  const rawExperiences = raw.experiences ?? [];
  if (!Array.isArray(rawExperiences)) {
    return { success: false, error: "Invalid experiences section." };
  }
  const experienceRows = rawExperiences
    .filter(isPlainObject)
    .map((item) => {
      let technologies: string[] = [];
      if (Array.isArray(item.technologies)) {
        technologies = item.technologies.map((t) => cleanString(t)).filter(Boolean);
      } else if (typeof item.technologies === "string") {
        technologies = item.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      return {
        company: cleanString(item.company, 150),
        role: cleanString(item.role, 150),
        description: cleanNullableString(item.description),
        startDate: parseMonthUnknown(item.startDate),
        endDate: parseMonthUnknown(item.endDate),
        technologies,
      };
    })
    .filter((row) => row.company !== "" || row.role !== "");

  if (experienceRows.some((row) => row.company === "" || row.role === "")) {
    return {
      success: false,
      error: "Each experience entry requires both a role and a company.",
    };
  }

  // 5. Projects
  const rawProjects = raw.projects ?? [];
  if (!Array.isArray(rawProjects)) {
    return { success: false, error: "Invalid projects section." };
  }
  const projectRows = rawProjects
    .filter(isPlainObject)
    .map((item) => ({
      name: cleanString(item.name, 150),
      link: cleanNullableString(item.link),
      description: cleanNullableString(item.description),
    }))
    .filter((row) => row.name !== "" || row.link !== null || row.description !== null);

  if (projectRows.some((row) => row.name === "")) {
    return {
      success: false,
      error: "Each project entry requires a project name.",
    };
  }

  // 6. Setup
  const rawSetup = raw.setup;
  if (rawSetup !== undefined && rawSetup !== null && !isPlainObject(rawSetup)) {
    return { success: false, error: "Invalid setup section." };
  }
  const setupObj = isPlainObject(rawSetup) ? rawSetup : null;
  const setupName = setupObj ? cleanString(setupObj.name, 100) : "";
  const setupDescription = setupObj ? cleanNullableString(setupObj.description) : null;

  const now = new Date();

  try {
    await db.batch([
      db
        .update(users)
        .set({ firstName, lastName, location, role, github, linkedin, updatedAt: now })
        .where(eq(users.id, userId)),
      db.delete(languages).where(eq(languages.userId, userId)),
      ...(languageRows.length > 0
        ? [
            db.insert(languages).values(
              languageRows.map((row) => ({
                userId,
                language: row.language,
                fluency: row.fluency,
                updatedAt: now,
              })),
            ),
          ]
        : []),
      db.delete(education).where(eq(education.userId, userId)),
      ...(educationRows.length > 0
        ? [
            db
              .insert(education)
              .values(educationRows.map((row) => ({ userId, ...row, updatedAt: now }))),
          ]
        : []),
      db.delete(experiences).where(eq(experiences.userId, userId)),
      ...(experienceRows.length > 0
        ? [
            db
              .insert(experiences)
              .values(experienceRows.map((row) => ({ userId, ...row, updatedAt: now }))),
          ]
        : []),
      db.delete(projects).where(eq(projects.userId, userId)),
      ...(projectRows.length > 0
        ? [
            db
              .insert(projects)
              .values(projectRows.map((row) => ({ userId, ...row, updatedAt: now }))),
          ]
        : []),
      db.delete(setups).where(eq(setups.userId, userId)),
      ...(setupName
        ? [
            db.insert(setups).values({
              userId,
              name: setupName,
              description: setupDescription,
              completedAt: now,
              updatedAt: now,
            }),
          ]
        : []),
    ]);

    revalidate();

    const draft: WizardDraft = {
      profile: {
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        location: location ?? "",
        role: role ?? "",
        github: github ?? "",
        linkedin: linkedin ?? "",
      },
      languages: languageRows.map((l) => ({
        language: l.language,
        fluency: l.fluency,
      })),
      education: educationRows.map((e) => ({
        degree: e.degree,
        level: e.level,
        university: e.university,
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        present: false,
      })),
      experiences: experienceRows.map((e) => ({
        role: e.role,
        company: e.company,
        description: e.description ?? "",
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        present: false,
        technologies: e.technologies.join(", "),
      })),
      projects: projectRows.map((p) => ({
        name: p.name,
        link: p.link ?? "",
        description: p.description ?? "",
      })),
      setup: {
        name: setupName,
        description: setupDescription ?? "",
      },
    };

    return { success: true, draft };
  } catch (error) {
    console.error("Failed to import user data:", error);
    return { success: false, error: "Failed to import data. Please try again." };
  }
}
