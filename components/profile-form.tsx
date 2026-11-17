"use client";

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
import type { ProfileDraft } from "@/components/wizard/draft";

const GITHUB_PREFIX = "https://github.com/";
const LINKEDIN_PREFIX = "https://linkedin.com/in/";

function stripPrefix(value: string, pattern: RegExp) {
  return value.replace(pattern, "");
}

const GITHUB_PATTERN = /^(https?:\/\/)?(www\.)?github\.com\//i;
const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i;

type ProfileFormProps = {
  value: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
  submitLabel?: string;
  onNext?: () => void;
};

export function ProfileForm({ value, onChange, submitLabel = "Save", onNext }: ProfileFormProps) {
  const githubHandle = stripPrefix(value.github, GITHUB_PATTERN);
  const linkedinHandle = stripPrefix(value.linkedin, LINKEDIN_PATTERN);

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
            How your name, headline role, and social profiles appear publicly.
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
