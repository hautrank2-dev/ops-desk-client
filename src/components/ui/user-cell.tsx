import { UserModel } from "@/types/user";

type Props = {
  user: string | UserModel | null | undefined;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserCell({ user }: Props) {
  if (!user) return <span className="text-muted-foreground text-xs">—</span>;

  if (typeof user === "string") {
    return <span className="text-muted-foreground text-xs font-mono">{user.slice(-6)}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8e8ed] to-[#d2d2d7] text-[#48484a] text-[10px] font-semibold dark:from-[#3a3a3c] dark:to-[#2c2c2e] dark:text-[#d1d1d6]">
        {initials(user.name)}
      </span>
      <span className="text-sm truncate max-w-[120px]">{user.name}</span>
    </div>
  );
}
