import Link from "next/link";
import { LogOutIcon } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { DataTransferActions } from "@/components/data-transfer-actions";
import { ThemeSelect } from "@/components/theme-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  user?: {
    id: string;
    githubId: string;
    githubLogin: string | null;
  } | null;
};

function BrandLogo() {
  return (
    <svg
      viewBox="0 0 256 256"
      className="size-5 shrink-0 text-foreground"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="208"
        y1="128"
        x2="128"
        y2="208"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="28"
      />
      <line
        x1="192"
        y1="40"
        x2="40"
        y2="192"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="28"
      />
    </svg>
  );
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-grid bg-background">
      <div className="container-wrapper flex h-(--header-height) items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex h-8 items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          <BrandLogo />
          <span>Prezentme</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {user && (
            <>
              <DataTransferActions userId={user.id} githubLogin={user.githubLogin} />
              <div className="hidden h-4 w-px bg-border sm:block" />
            </>
          )}
          <ThemeSelect />
          {user && (
            <>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="flex h-8 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 dark:border-input dark:bg-input/20">
                <Avatar size="sm" className="size-5">
                  <AvatarImage
                    src={`https://avatars.githubusercontent.com/u/${user.githubId}`}
                    alt={user.githubLogin ?? "User avatar"}
                  />
                  <AvatarFallback className="text-[10px]">
                    {(user.githubLogin ?? "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.githubLogin && (
                  <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                    @{user.githubLogin}
                  </span>
                )}
              </div>
              <form action={signOut} className="flex items-center">
                <Button type="submit" variant="ghost" className="text-muted-foreground">
                  <LogOutIcon data-icon="inline-start" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
