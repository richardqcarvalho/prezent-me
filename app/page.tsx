import {
  ArrowRightIcon,
  BriefcaseIcon,
  Code2Icon,
  FileJsonIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default async function Home() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="flex flex-1 flex-col">
          <section className="border-b border-grid">
            <div className="container-wrapper">
              <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-14 text-center sm:px-6 md:py-20 lg:py-24">
                <div className="inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <SparklesIcon className="size-3 text-muted-foreground" />
                  <span>Structured profile, experience & portfolio engine</span>
                  <ArrowRightIcon className="size-3 text-muted-foreground" />
                </div>

                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance text-primary sm:text-4xl lg:leading-[1.1] xl:text-5xl xl:tracking-tighter">
                  The Foundation for your Developer Profile
                </h1>

                <p className="max-w-2xl text-base text-balance text-muted-foreground sm:text-lg">
                  Composable, structured career data with instant auto-save and portable JSON
                  export. Build your profile once and generate tailored portfolios or resumes.
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                  <form action={signInWithGitHub}>
                    <Button type="submit" size="lg" className="h-9 rounded-4xl px-4">
                      <GitHubIcon data-icon="inline-start" />
                      Sign in with GitHub
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <section className="flex-1 border-b border-grid bg-muted/20 dark:bg-transparent">
            <div className="container-wrapper px-4 py-10 sm:px-6 md:py-14">
              <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
                <Card className="justify-between">
                  <CardHeader>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <UserIcon className="size-4" />
                      </span>
                    </div>
                    <CardTitle>Identity & Languages</CardTitle>
                    <CardDescription>
                      Centralize your role, location, social handles, and spoken languages with
                      clean validation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>github.com/</span>
                        <span className="text-foreground">username</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>linkedin.com/in/</span>
                        <span className="text-foreground">profile</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="justify-between">
                  <CardHeader>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <BriefcaseIcon className="size-4" />
                      </span>
                    </div>
                    <CardTitle>Experience & Education</CardTitle>
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
                    <CardTitle>Projects & Portable JSON</CardTitle>
                    <CardDescription>
                      Showcase your shipped projects, document your setup, and export your full
                      schema to JSON, PDF, or HTML.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <FileJsonIcon className="size-3.5" />
                      prezentme.json
                    </span>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <footer className="border-t border-grid">
          <div className="container-wrapper flex h-12 items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
            <span>Built with Next.js, Tailwind CSS, and shadcn/ui.</span>
            <span className="font-mono">Prezentme</span>
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
