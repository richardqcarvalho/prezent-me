export type ProfileDraft = {
  firstName: string;
  lastName: string;
  location: string;
  role: string;
  github: string;
  linkedin: string;
};

export type LanguageDraft = {
  language: string;
  fluency: string;
};

export type EducationDraft = {
  degree: string;
  level: string;
  university: string;
  startDate: string;
  endDate: string;
  present: boolean;
};

export type ExperienceDraft = {
  role: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string;
  present: boolean;
  technologies: string;
};

export type ProjectDraft = {
  name: string;
  link: string;
  description: string;
};

export type SetupDraft = {
  name: string;
  description: string;
};

export type WizardDraft = {
  profile: ProfileDraft;
  languages: LanguageDraft[];
  education: EducationDraft[];
  experiences: ExperienceDraft[];
  projects: ProjectDraft[];
  setup: SetupDraft[];
};

export type WizardStepId =
  | "profile"
  | "languages"
  | "education"
  | "experiences"
  | "projects"
  | "setup";

export const WIZARD_STEP_IDS: WizardStepId[] = [
  "profile",
  "languages",
  "education",
  "experiences",
  "projects",
  "setup",
];

function cacheKey(userId: string) {
  return `prezentme:draft:v3:${userId}`;
}

export type CachedSlice = { data: unknown; savedAt: number };
export type CachedDraft = Partial<Record<WizardStepId, CachedSlice>>;

export function loadCachedSlices(userId: string): CachedDraft {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? (JSON.parse(raw) as CachedDraft) : {};
  } catch {
    return {};
  }
}

export function saveDraftSlice(userId: string, id: WizardStepId, data: unknown, savedAt: number) {
  try {
    const cached = loadCachedSlices(userId);
    cached[id] = { data, savedAt };
    localStorage.setItem(cacheKey(userId), JSON.stringify(cached));
  } catch {
    // storage full or unavailable; cache is best-effort
  }
}

export function dropDraftSlice(userId: string, id: WizardStepId) {
  try {
    const cached = loadCachedSlices(userId);
    if (cached[id] === undefined) return;
    delete cached[id];
    if (Object.keys(cached).length === 0) {
      localStorage.removeItem(cacheKey(userId));
    } else {
      localStorage.setItem(cacheKey(userId), JSON.stringify(cached));
    }
  } catch {
    // best-effort
  }
}

export function clearDraftSliceIfUnchanged(userId: string, id: WizardStepId, snapshot: string) {
  try {
    const cached = loadCachedSlices(userId);
    const slice = cached[id];
    if (!slice) return;
    // only clear if the user has not edited this slice since the sync started
    if (JSON.stringify(slice.data) !== snapshot) return;
    dropDraftSlice(userId, id);
  } catch {
    // best-effort
  }
}

export function clearAllDraftSlices(userId: string) {
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch {
    // best-effort
  }
}

type WizardBridge = {
  flushAll: () => Promise<void>;
  cancelAll: () => void;
  applyDraft: (draft: WizardDraft) => void;
};

let activeWizardBridge: WizardBridge | null = null;

export function registerWizardBridge(bridge: WizardBridge) {
  activeWizardBridge = bridge;
  return () => {
    if (activeWizardBridge === bridge) {
      activeWizardBridge = null;
    }
  };
}

export async function flushWizardSyncs() {
  await activeWizardBridge?.flushAll();
}

export function cancelWizardSyncs() {
  activeWizardBridge?.cancelAll();
}

export function applyImportedWizardDraft(draft: WizardDraft) {
  activeWizardBridge?.applyDraft(draft);
}

export function buildStepFormData(id: WizardStepId, draft: WizardDraft): FormData {
  const fd = new FormData();

  switch (id) {
    case "profile": {
      const { firstName, lastName, location, role, github, linkedin } = draft.profile;
      fd.set("firstName", firstName);
      fd.set("lastName", lastName);
      fd.set("location", location);
      fd.set("role", role);
      fd.set("github", github);
      fd.set("linkedin", linkedin);
      break;
    }
    case "languages": {
      for (const row of draft.languages) {
        fd.append("language", row.language);
        fd.append("fluency", row.fluency);
      }
      break;
    }
    case "education": {
      for (const row of draft.education) {
        fd.append("degree", row.degree);
        fd.append("level", row.level);
        fd.append("university", row.university);
        fd.append("startDate", row.startDate);
        fd.append("endDate", row.present ? "" : row.endDate);
      }
      break;
    }
    case "experiences": {
      for (const row of draft.experiences) {
        fd.append("role", row.role);
        fd.append("company", row.company);
        fd.append("description", row.description);
        fd.append("startDate", row.startDate);
        fd.append("endDate", row.present ? "" : row.endDate);
        fd.append("technologies", row.technologies);
      }
      break;
    }
    case "projects": {
      for (const row of draft.projects) {
        fd.append("name", row.name);
        fd.append("link", row.link);
        fd.append("description", row.description);
      }
      break;
    }
    case "setup": {
      for (const row of draft.setup) {
        fd.append("name", row.name);
        fd.append("description", row.description);
      }
      break;
    }
  }

  return fd;
}
