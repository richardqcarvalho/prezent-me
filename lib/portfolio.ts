import type { WizardDraft } from "@/components/wizard/draft";
import { formatPhoneDisplay, normalizeYearMonth } from "@/lib/constants";

export const FLUENCY_LABELS: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  advanced: "Advanced",
  intermediate: "Intermediate",
  basic: "Basic",
};

export const LEVEL_LABELS: Record<string, string> = {
  high_school: "High school",
  bootcamp: "Bootcamp",
  associate: "Associate",
  bachelor: "Bachelor",
  master: "Master",
  phd: "PhD",
  other: "Other",
};

export type MonthRange = { start: number; end: number };

export function toMonthIndex(value: string): number | null {
  const normalized = normalizeYearMonth(value);
  if (!normalized) return null;
  const [yearStr, monthStr] = normalized.split("/");
  return Number(yearStr) * 12 + (Number(monthStr) - 1);
}

export function getMonthRange(start: string, end: string, present: boolean): MonthRange | null {
  const from = toMonthIndex(start);
  if (from === null) return null;

  let to: number | null = null;
  if (present) {
    const now = new Date();
    to = now.getFullYear() * 12 + now.getMonth();
  } else {
    to = toMonthIndex(end);
  }
  if (to === null || to <= from) return null;

  return { start: from, end: to };
}

export function getMergedDurationMonths(ranges: (MonthRange | null)[]): number {
  const valid = ranges
    .filter((r): r is MonthRange => r !== null)
    .toSorted((a, b) => a.start - b.start || a.end - b.end);

  if (valid.length === 0) return 0;

  let total = 0;
  let currentStart = valid[0].start;
  let currentEnd = valid[0].end;

  for (let i = 1; i < valid.length; i++) {
    const next = valid[i];
    if (next.start <= currentEnd) {
      currentEnd = Math.max(currentEnd, next.end);
    } else {
      total += currentEnd - currentStart;
      currentStart = next.start;
      currentEnd = next.end;
    }
  }

  total += currentEnd - currentStart;
  return total;
}

export function formatDuration(totalMonths: number): string | null {
  if (totalMonths <= 0) return null;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "mo" : "mos"}`);
  }
  return parts.join(" ");
}

export function formatDateRange(start: string, end: string, present: boolean): string | null {
  const from = normalizeYearMonth(start) ?? start.trim();
  const to = present ? "Present" : (normalizeYearMonth(end) ?? end.trim());
  if (from && to) return `${from} — ${to}`;
  if (from) return from;
  if (to) return to;
  return null;
}

export function stripUrlProtocol(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/$/, "");
}

export function normalizeExternalUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function buildPortfolioViewModel(draft: WizardDraft) {
  const fullName = [draft.profile.firstName, draft.profile.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  const email = (draft.profile.email ?? "").trim();
  const phone = formatPhoneDisplay(draft.profile.phone ?? "");
  const role = draft.profile.role.trim();
  const location = draft.profile.location.trim();

  const githubRaw = draft.profile.github.trim();
  const github = githubRaw
    ? {
        raw: githubRaw,
        display: stripUrlProtocol(githubRaw),
        href: normalizeExternalUrl(githubRaw) ?? githubRaw,
      }
    : null;

  const linkedinRaw = draft.profile.linkedin.trim();
  const linkedin = linkedinRaw
    ? {
        raw: linkedinRaw,
        display: stripUrlProtocol(linkedinRaw),
        href: normalizeExternalUrl(linkedinRaw) ?? linkedinRaw,
      }
    : null;

  const languages = draft.languages
    .filter((l) => l.language.trim() !== "")
    .map((l) => ({
      language: l.language.trim(),
      fluency: l.fluency,
      fluencyLabel: l.fluency ? (FLUENCY_LABELS[l.fluency] ?? l.fluency) : "",
    }));

  const rawEducation = draft.education.filter(
    (e) => e.degree.trim() !== "" || e.university.trim() !== "",
  );
  const educationRanges = rawEducation.map((e) => getMonthRange(e.startDate, e.endDate, e.present));
  const totalEducationDuration =
    educationRanges.filter(Boolean).length > 1
      ? formatDuration(getMergedDurationMonths(educationRanges))
      : null;

  const education = rawEducation.map((e, i) => {
    const range = educationRanges[i];
    return {
      degree: e.degree.trim(),
      university: e.university.trim(),
      level: e.level,
      levelLabel: e.level ? (LEVEL_LABELS[e.level] ?? e.level) : "",
      startDate: e.startDate,
      endDate: e.endDate,
      present: e.present,
      dates: formatDateRange(e.startDate, e.endDate, e.present),
      duration: range ? formatDuration(range.end - range.start) : null,
    };
  });

  const rawExperiences = draft.experiences.filter(
    (e) => e.role.trim() !== "" || e.company.trim() !== "",
  );
  const experienceRanges = rawExperiences.map((e) =>
    getMonthRange(e.startDate, e.endDate, e.present),
  );
  const totalExperienceDuration =
    experienceRanges.filter(Boolean).length > 1
      ? formatDuration(getMergedDurationMonths(experienceRanges))
      : null;

  const technologyMap = new Map<string, { label: string; ranges: MonthRange[] }>();
  const experiences = rawExperiences.map((exp, i) => {
    const range = experienceRanges[i];
    const seenInEntry = new Set<string>();
    const techList: string[] = [];

    for (const raw of exp.technologies.split(",")) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (seenInEntry.has(key)) continue;
      seenInEntry.add(key);
      techList.push(label);

      let entry = technologyMap.get(key);
      if (!entry) {
        entry = { label, ranges: [] };
        technologyMap.set(key, entry);
      }
      if (range) {
        entry.ranges.push(range);
      }
    }

    return {
      role: exp.role.trim(),
      company: exp.company.trim(),
      description: exp.description.trim(),
      startDate: exp.startDate,
      endDate: exp.endDate,
      present: exp.present,
      dates: formatDateRange(exp.startDate, exp.endDate, exp.present),
      duration: range ? formatDuration(range.end - range.start) : null,
      technologies: techList,
    };
  });

  const technologyTotals = Array.from(technologyMap.entries())
    .map(([key, { label, ranges }]) => {
      const months = getMergedDurationMonths(ranges);
      return {
        key,
        label,
        months,
        duration: formatDuration(months),
      };
    })
    .toSorted((a, b) => b.months - a.months);

  const projects = draft.projects
    .filter((p) => p.name.trim() !== "" || p.link.trim() !== "" || p.description.trim() !== "")
    .map((p) => ({
      name: p.name.trim(),
      link: p.link.trim(),
      linkDisplay: p.link.trim() ? stripUrlProtocol(p.link) : "",
      linkHref: normalizeExternalUrl(p.link),
      description: p.description.trim(),
    }));

  const setups = draft.setup
    .filter((s) => s.name.trim() !== "" || s.description.trim() !== "")
    .map((s) => ({
      name: s.name.trim(),
      description: s.description.trim(),
    }));

  return {
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
  };
}

export type PortfolioViewModel = ReturnType<typeof buildPortfolioViewModel>;
