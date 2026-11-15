import { LogOutIcon } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { ThemeSelect } from "@/components/theme-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  user?: {
    githubId: string;
    githubLogin: string | null;
  } | null;
};

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b bg-background px-6">
      <span className="text-base font-semibold tracking-tight">Prezentme</span>
      <div className="flex items-center gap-3">
        <ThemeSelect />
        {user && (
          <>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage
                  src={`https://avatars.githubusercontent.com/u/${user.githubId}`}
                  alt={user.githubLogin ?? "User avatar"}
                />
                <AvatarFallback>
                  {(user.githubLogin ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.githubLogin && (
                <span className="text-sm text-muted-foreground">@{user.githubLogin}</span>
              )}
            </div>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOutIcon data-icon="inline-start" />
                Sign out
              </Button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
