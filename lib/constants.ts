export const FLUENCY_LEVELS = ["native", "fluent", "advanced", "intermediate", "basic"] as const;

export type FluencyLevel = (typeof FLUENCY_LEVELS)[number];

export const EDUCATION_LEVELS = [
  "high_school",
  "bootcamp",
  "associate",
  "bachelor",
  "master",
  "phd",
  "other",
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export function isFluencyLevel(value: unknown): value is FluencyLevel {
  return FLUENCY_LEVELS.includes(value as FluencyLevel);
}

export function isEducationLevel(value: unknown): value is EducationLevel {
  return EDUCATION_LEVELS.includes(value as EducationLevel);
}

export function normalizeYearMonth(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})[/-](\d{2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}/${match[2]}`;
}

export type PhoneCountry = {
  iso: string;
  name: string;
  dialCode: string;
  placeholder: string;
  mask: string | readonly string[];
};

export const PHONE_COUNTRIES: ReadonlyArray<PhoneCountry> = [
  {
    iso: "AR",
    name: "Argentina",
    dialCode: "+54",
    placeholder: "11 1234-5678",
    mask: ["## ####-####", "### ###-####"],
  },
  {
    iso: "AU",
    name: "Australia",
    dialCode: "+61",
    placeholder: "412 345 678",
    mask: "### ### ###",
  },
  {
    iso: "AT",
    name: "Austria",
    dialCode: "+43",
    placeholder: "664 1234567",
    mask: "### #######",
  },
  {
    iso: "BE",
    name: "Belgium",
    dialCode: "+32",
    placeholder: "470 12 34 56",
    mask: "### ## ## ##",
  },
  {
    iso: "BO",
    name: "Bolivia",
    dialCode: "+591",
    placeholder: "7123 4567",
    mask: "#### ####",
  },
  {
    iso: "BR",
    name: "Brazil",
    dialCode: "+55",
    placeholder: "(11) 99999-9999",
    mask: ["(##) ####-####", "(##) #####-####"],
  },
  {
    iso: "CA",
    name: "Canada",
    dialCode: "+1",
    placeholder: "(555) 000-0000",
    mask: "(###) ###-####",
  },
  {
    iso: "CL",
    name: "Chile",
    dialCode: "+56",
    placeholder: "9 1234 5678",
    mask: "# #### ####",
  },
  {
    iso: "CN",
    name: "China",
    dialCode: "+86",
    placeholder: "138 0013 8000",
    mask: "### #### ####",
  },
  {
    iso: "CO",
    name: "Colombia",
    dialCode: "+57",
    placeholder: "300 123 4567",
    mask: "### ### ####",
  },
  {
    iso: "CR",
    name: "Costa Rica",
    dialCode: "+506",
    placeholder: "8312 3456",
    mask: "#### ####",
  },
  {
    iso: "CZ",
    name: "Czechia",
    dialCode: "+420",
    placeholder: "601 123 456",
    mask: "### ### ###",
  },
  {
    iso: "DK",
    name: "Denmark",
    dialCode: "+45",
    placeholder: "20 12 34 56",
    mask: "## ## ## ##",
  },
  {
    iso: "EC",
    name: "Ecuador",
    dialCode: "+593",
    placeholder: "99 123 4567",
    mask: "## ### ####",
  },
  {
    iso: "EG",
    name: "Egypt",
    dialCode: "+20",
    placeholder: "100 123 4567",
    mask: "### ### ####",
  },
  {
    iso: "EE",
    name: "Estonia",
    dialCode: "+372",
    placeholder: "5123 4567",
    mask: ["### ####", "#### ####"],
  },
  {
    iso: "FI",
    name: "Finland",
    dialCode: "+358",
    placeholder: "40 123 4567",
    mask: "## ### ####",
  },
  {
    iso: "FR",
    name: "France",
    dialCode: "+33",
    placeholder: "6 12 34 56 78",
    mask: "# ## ## ## ##",
  },
  {
    iso: "DE",
    name: "Germany",
    dialCode: "+49",
    placeholder: "1512 3456789",
    mask: ["### #######", "#### #######"],
  },
  {
    iso: "GR",
    name: "Greece",
    dialCode: "+30",
    placeholder: "691 234 5678",
    mask: "### ### ####",
  },
  {
    iso: "HK",
    name: "Hong Kong",
    dialCode: "+852",
    placeholder: "5123 4567",
    mask: "#### ####",
  },
  {
    iso: "HU",
    name: "Hungary",
    dialCode: "+36",
    placeholder: "20 123 4567",
    mask: "## ### ####",
  },
  {
    iso: "IN",
    name: "India",
    dialCode: "+91",
    placeholder: "98765 43210",
    mask: "##### #####",
  },
  {
    iso: "ID",
    name: "Indonesia",
    dialCode: "+62",
    placeholder: "812-3456-7890",
    mask: ["###-###-####", "###-####-####"],
  },
  {
    iso: "IE",
    name: "Ireland",
    dialCode: "+353",
    placeholder: "85 123 4567",
    mask: "## ### ####",
  },
  {
    iso: "IL",
    name: "Israel",
    dialCode: "+972",
    placeholder: "50-123-4567",
    mask: "##-###-####",
  },
  {
    iso: "IT",
    name: "Italy",
    dialCode: "+39",
    placeholder: "312 345 6789",
    mask: "### ### ####",
  },
  {
    iso: "JP",
    name: "Japan",
    dialCode: "+81",
    placeholder: "90-1234-5678",
    mask: "##-####-####",
  },
  {
    iso: "MX",
    name: "Mexico",
    dialCode: "+52",
    placeholder: "55 1234 5678",
    mask: "## #### ####",
  },
  {
    iso: "NL",
    name: "Netherlands",
    dialCode: "+31",
    placeholder: "6 12345678",
    mask: "# ########",
  },
  {
    iso: "NZ",
    name: "New Zealand",
    dialCode: "+64",
    placeholder: "21 123 4567",
    mask: ["## ### ###", "## ### ####"],
  },
  {
    iso: "NG",
    name: "Nigeria",
    dialCode: "+234",
    placeholder: "802 123 4567",
    mask: "### ### ####",
  },
  {
    iso: "NO",
    name: "Norway",
    dialCode: "+47",
    placeholder: "412 34 567",
    mask: "### ## ###",
  },
  {
    iso: "PA",
    name: "Panama",
    dialCode: "+507",
    placeholder: "6123-4567",
    mask: "####-####",
  },
  {
    iso: "PY",
    name: "Paraguay",
    dialCode: "+595",
    placeholder: "981 123456",
    mask: "### ######",
  },
  {
    iso: "PE",
    name: "Peru",
    dialCode: "+51",
    placeholder: "912 345 678",
    mask: "### ### ###",
  },
  {
    iso: "PH",
    name: "Philippines",
    dialCode: "+63",
    placeholder: "917 123 4567",
    mask: "### ### ####",
  },
  {
    iso: "PL",
    name: "Poland",
    dialCode: "+48",
    placeholder: "512 345 678",
    mask: "### ### ###",
  },
  {
    iso: "PT",
    name: "Portugal",
    dialCode: "+351",
    placeholder: "912 345 678",
    mask: "### ### ###",
  },
  {
    iso: "RO",
    name: "Romania",
    dialCode: "+40",
    placeholder: "712 345 678",
    mask: "### ### ###",
  },
  {
    iso: "SG",
    name: "Singapore",
    dialCode: "+65",
    placeholder: "8123 4567",
    mask: "#### ####",
  },
  {
    iso: "ZA",
    name: "South Africa",
    dialCode: "+27",
    placeholder: "82 123 4567",
    mask: "## ### ####",
  },
  {
    iso: "KR",
    name: "South Korea",
    dialCode: "+82",
    placeholder: "10-1234-5678",
    mask: "##-####-####",
  },
  {
    iso: "ES",
    name: "Spain",
    dialCode: "+34",
    placeholder: "612 34 56 78",
    mask: "### ## ## ##",
  },
  {
    iso: "SE",
    name: "Sweden",
    dialCode: "+46",
    placeholder: "70-123 45 67",
    mask: "##-### ## ##",
  },
  {
    iso: "CH",
    name: "Switzerland",
    dialCode: "+41",
    placeholder: "78 123 45 67",
    mask: "## ### ## ##",
  },
  {
    iso: "TW",
    name: "Taiwan",
    dialCode: "+886",
    placeholder: "912 345 678",
    mask: "### ### ###",
  },
  {
    iso: "TH",
    name: "Thailand",
    dialCode: "+66",
    placeholder: "81 234 5678",
    mask: "## ### ####",
  },
  {
    iso: "TR",
    name: "Turkey",
    dialCode: "+90",
    placeholder: "(532) 123 45 67",
    mask: "(###) ### ## ##",
  },
  {
    iso: "UA",
    name: "Ukraine",
    dialCode: "+380",
    placeholder: "(50) 123 4567",
    mask: "(##) ### ####",
  },
  {
    iso: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    placeholder: "50 123 4567",
    mask: "## ### ####",
  },
  {
    iso: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    placeholder: "7911 123456",
    mask: "#### ######",
  },
  {
    iso: "US",
    name: "United States",
    dialCode: "+1",
    placeholder: "(555) 000-0000",
    mask: "(###) ###-####",
  },
  {
    iso: "UY",
    name: "Uruguay",
    dialCode: "+598",
    placeholder: "94 123 456",
    mask: "## ### ###",
  },
  {
    iso: "VE",
    name: "Venezuela",
    dialCode: "+58",
    placeholder: "412-1234567",
    mask: "###-#######",
  },
  {
    iso: "VN",
    name: "Vietnam",
    dialCode: "+84",
    placeholder: "91 234 56 78",
    mask: "## ### ## ##",
  },
];

export const DEFAULT_PHONE_COUNTRY_ISO = "US";

const COUNTRIES_BY_DIAL_LENGTH = [...PHONE_COUNTRIES].toSorted(
  (a, b) =>
    b.dialCode.length - a.dialCode.length ||
    (a.iso === "US" ? -1 : b.iso === "US" ? 1 : a.iso.localeCompare(b.iso)),
);

export function getPhoneCountryByIso(iso: string): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((c) => c.iso === iso) ??
    PHONE_COUNTRIES.find((c) => c.iso === DEFAULT_PHONE_COUNTRY_ISO)!
  );
}

function countMaskDigits(mask: string): number {
  let count = 0;
  for (const ch of mask) {
    if (ch === "#") count++;
  }
  return count;
}

export function applyPhoneMask(countryIso: string, rawInput: string): string {
  const digits = rawInput.replace(/\D/g, "");
  if (!digits) return "";

  const country = getPhoneCountryByIso(countryIso);
  const masks = typeof country.mask === "string" ? [country.mask] : country.mask;

  const activeMask =
    masks.find((m) => countMaskDigits(m) >= digits.length) ?? masks[masks.length - 1];

  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < activeMask.length; i++) {
    if (digitIndex >= digits.length) break;
    const maskChar = activeMask[i];
    if (maskChar === "#") {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += maskChar;
    }
  }

  return result;
}

export function parsePhoneValue(rawPhone: string): {
  countryIso: string;
  dialCode: string;
  localNumber: string;
} {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    const fallback = getPhoneCountryByIso(DEFAULT_PHONE_COUNTRY_ISO);
    return { countryIso: fallback.iso, dialCode: fallback.dialCode, localNumber: "" };
  }

  for (const country of COUNTRIES_BY_DIAL_LENGTH) {
    if (trimmed === country.dialCode) {
      return { countryIso: country.iso, dialCode: country.dialCode, localNumber: "" };
    }
    if (trimmed.startsWith(`${country.dialCode} `)) {
      const rest = trimmed.slice(country.dialCode.length + 1);
      return {
        countryIso: country.iso,
        dialCode: country.dialCode,
        localNumber: applyPhoneMask(country.iso, rest),
      };
    }
    if (trimmed.startsWith(country.dialCode)) {
      const rest = trimmed.slice(country.dialCode.length).trimStart();
      return {
        countryIso: country.iso,
        dialCode: country.dialCode,
        localNumber: applyPhoneMask(country.iso, rest),
      };
    }
  }

  const fallback = getPhoneCountryByIso(DEFAULT_PHONE_COUNTRY_ISO);
  return {
    countryIso: fallback.iso,
    dialCode: fallback.dialCode,
    localNumber: applyPhoneMask(fallback.iso, trimmed),
  };
}

export function formatPhoneValue(countryIso: string, localInput: string): string {
  const masked = applyPhoneMask(countryIso, localInput);
  if (!masked) return "";
  const country = getPhoneCountryByIso(countryIso);
  return `${country.dialCode} ${masked}`;
}

export function formatPhoneDisplay(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (!trimmed) return "";

  const matchedCountry = COUNTRIES_BY_DIAL_LENGTH.find(
    (country) =>
      trimmed === country.dialCode ||
      trimmed.startsWith(`${country.dialCode} `) ||
      trimmed.startsWith(country.dialCode),
  );

  if (!matchedCountry && trimmed.startsWith("+")) {
    return trimmed;
  }

  const parsed = parsePhoneValue(trimmed);
  if (!parsed.localNumber) return "";
  return `${parsed.dialCode} ${parsed.localNumber}`;
}
