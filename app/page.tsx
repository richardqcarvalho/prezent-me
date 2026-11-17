import Image from "next/image";
import { BriefcaseIcon, Code2Icon, UserIcon } from "lucide-react";

import { getSessionUser } from "@/lib/session";
import {
  getUserById,
  getUserEducation,
  getUserExperiences,
  getUserLanguages,
  getUserProjects,
  getUserSetups,
} from "@/lib/users";
import { signInWithGitHub } from "@/app/actions/auth";
import { Header } from "@/components/header";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import githubIcon from "@/public/github.svg";

export default async function Home() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col border-b border-grid">
            <div className="container-wrapper flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
                <h1 className="text-3xl font-semibold tracking-tight text-balance text-primary sm:text-4xl xl:text-5xl xl:tracking-tighter">
                  Developer profile & portfolio system
                </h1>

                <p className="text-base text-balance text-muted-foreground sm:text-lg">
                  Structure your professional profile, experience, education, and projects in one
                  place.
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                  <form action={signInWithGitHub}>
                    <Button type="submit" size="lg" className="h-9 rounded-4xl px-4">
                      <Image
                        src={githubIcon}
                        alt=""
                        aria-hidden
                        className="size-4 invert dark:invert-0"
                      />
                      Sign in with GitHub
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-1 flex-col border-b border-grid bg-muted/20 dark:bg-transparent">
            <div className="container-wrapper flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 md:px-10">
              <div className="grid w-full gap-5 md:grid-cols-3">
                <Card className="justify-between">
                  <CardHeader>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <UserIcon className="size-4" />
                      </span>
                    </div>
                    <CardTitle>Identity & languages</CardTitle>
                    <CardDescription>
                      Centralize your role, location, social handles, and spoken languages with
                      clean validation.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="justify-between">
                  <CardHeader>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <BriefcaseIcon className="size-4" />
                      </span>
                    </div>
                    <CardTitle>Experience & education</CardTitle>
                    <CardDescription>
                      Capture your work history, tech stacks, degrees, and timelines with real-time
                      draft syncing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {["TypeScript", "React", "Next.js", "PostgreSQL", "Tailwind CSS"].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="justify-between">
                  <CardHeader>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Code2Icon className="size-4" />
                      </span>
                    </div>
                    <CardTitle>Projects & portable JSON</CardTitle>
                    <CardDescription>
                      Showcase your shipped projects, document your setup, and export your full
                      schema to JSON, PDF, or HTML.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <footer className="border-t border-grid">
          <div className="container-wrapper flex h-12 items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
            <span>Built with Next.js, Tailwind CSS, and shadcn/ui.</span>
            <span className="font-mono">/prezent-me</span>
          </div>
        </footer>
      </div>
    );
  }

  const [user, languages, education, experiences, projects, setup] = await Promise.all([
    getUserById(sessionUser.id),
    getUserLanguages(sessionUser.id),
    getUserEducation(sessionUser.id),
    getUserExperiences(sessionUser.id),
    getUserProjects(sessionUser.id),
    getUserSetups(sessionUser.id),
  ]);

  if (!user) {
    return null;
  }

  const latest = (rows: { updatedAt: Date }[]) =>
    rows.reduce((max, row) => Math.max(max, row.updatedAt.getTime()), 0);

  const serverTimestamps = {
    profile: user.updatedAt.getTime(),
    languages: latest(languages),
    education: latest(education),
    experiences: latest(experiences),
    projects: latest(projects),
    setup: latest(setup),
  };

  return (
    <div className="flex min-h-svh flex-col">
      <Header user={user} />
      <main className="container-wrapper flex flex-1 flex-col">
        <OnboardingWizard
          user={user}
          languages={languages}
          education={education}
          experiences={experiences}
          projects={projects}
          setup={setup}
          serverTimestamps={serverTimestamps}
        />
      </main>
    </div>
  );
}
