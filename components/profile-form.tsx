"use client";

import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileDraft } from "@/components/wizard/draft";
import {
  applyPhoneMask,
  formatPhoneValue,
  getPhoneCountryByIso,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "@/lib/constants";

const GITHUB_PREFIX = "https://github.com/";
const LINKEDIN_PREFIX = "https://linkedin.com/in/";

function stripPrefix(value: string, pattern: RegExp) {
  return value.replace(pattern, "");
}

const GITHUB_PATTERN = /^(https?:\/\/)?(www\.)?github\.com\//i;
const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i;

const PHONE_TRIGGER_ITEMS = Object.fromEntries(
  PHONE_COUNTRIES.map((c) => [c.iso, `${c.iso} ${c.dialCode}`]),
);

type ProfileFormProps = {
  value: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
  submitLabel?: string;
  onNext?: () => void;
};

export function ProfileForm({ value, onChange, submitLabel = "Save", onNext }: ProfileFormProps) {
  const githubHandle = stripPrefix(value.github, GITHUB_PATTERN);
  const linkedinHandle = stripPrefix(value.linkedin, LINKEDIN_PATTERN);

  const parsedPhone = parsePhoneValue(value.phone ?? "");
  const [countryIso, setCountryIso] = useState(parsedPhone.countryIso);
  const selectedCountry = getPhoneCountryByIso(countryIso);
  const activeCountryIso =
    (value.phone ?? "").trim() && parsedPhone.dialCode !== selectedCountry.dialCode
      ? parsedPhone.countryIso
      : countryIso;
  const activeCountry = getPhoneCountryByIso(activeCountryIso);
  const maskedLocalNumber = applyPhoneMask(activeCountryIso, parsedPhone.localNumber);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext?.();
      }}
    >
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Personal information</CardTitle>
          <CardDescription>
            How your name, contact details, headline role, and social profiles appear publicly.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={value.firstName}
                onChange={(e) => onChange({ firstName: e.target.value })}
                placeholder="Ada"
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={value.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
                placeholder="Lovelace"
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={value.email ?? ""}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="ada@example.com"
                maxLength={255}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex items-center gap-2">
                <Select
                  items={PHONE_TRIGGER_ITEMS}
                  value={activeCountryIso}
                  onValueChange={(nextIso) => {
                    if (!nextIso) return;
                    setCountryIso(nextIso);
                    if (parsedPhone.localNumber.trim()) {
                      onChange({ phone: formatPhoneValue(nextIso, parsedPhone.localNumber) });
                    }
                  }}
                >
                  <SelectTrigger
                    className="w-28 shrink-0 font-mono text-xs"
                    aria-label="Country code"
                  >
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="min-w-56" align="start" alignItemWithTrigger={false}>
                    {PHONE_COUNTRIES.map((country) => (
                      <SelectItem key={country.iso} value={country.iso}>
                        <span>{country.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {country.dialCode}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={maskedLocalNumber}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw.trimStart().startsWith("+")) {
                      const pasted = parsePhoneValue(raw);
                      setCountryIso(pasted.countryIso);
                      onChange({ phone: formatPhoneValue(pasted.countryIso, pasted.localNumber) });
                      return;
                    }
                    onChange({ phone: formatPhoneValue(activeCountryIso, raw) });
                  }}
                  placeholder={activeCountry.placeholder}
                  maxLength={32}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="role">Role / headline</Label>
              <Input
                id="role"
                value={value.role}
                onChange={(e) => onChange({ role: e.target.value })}
                placeholder="e.g. Staff Frontend Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={value.location}
                onChange={(e) => onChange({ location: e.target.value })}
                placeholder="e.g. Paris, France"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="github">GitHub</Label>
              <div className="flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm dark:bg-input/30">
                <span className="shrink-0 font-mono text-xs text-muted-foreground select-none">
                  github.com/
                </span>
                <input
                  id="github"
                  value={githubHandle}
                  onChange={(e) => {
                    const handle = stripPrefix(e.target.value, GITHUB_PATTERN);
                    onChange({ github: handle ? `${GITHUB_PREFIX}${handle}` : "" });
                  }}
                  placeholder="username"
                  maxLength={200}
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <div className="flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm dark:bg-input/30">
                <span className="shrink-0 font-mono text-xs text-muted-foreground select-none">
                  linkedin.com/in/
                </span>
                <input
                  id="linkedin"
                  value={linkedinHandle}
                  onChange={(e) => {
                    const handle = stripPrefix(e.target.value, LINKEDIN_PATTERN);
                    onChange({ linkedin: handle ? `${LINKEDIN_PREFIX}${handle}` : "" });
                  }}
                  placeholder="username"
                  maxLength={200}
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit">
            {submitLabel}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
