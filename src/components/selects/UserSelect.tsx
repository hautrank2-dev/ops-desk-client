"use client";

import { httpClient } from "@/lib/httpClient";
import { fileUrl } from "@/lib/fileUrl";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { TableResponse } from "@/types";
import { UserModel } from "@/types/user";
import { EntityOption, EntitySelect, EntitySelectProps, FetchEntityPage } from "./EntitySelect";

type UserOption = EntityOption<UserModel>;
type UserStatusFilter = UserModel["status"] | "all";

const toOption = (u: UserModel): UserOption => ({ value: u._id, name: u.name, code: u.username, data: u });

const fetchUsers =
  (status: UserStatusFilter): FetchEntityPage<UserModel> =>
  async ({ search, page, pageSize }) => {
    const { data } = await httpClient.get<TableResponse<UserModel>>("/user", {
      params: { page, pageSize, search: search || undefined, status: status === "all" ? undefined : status },
    });
    return { items: data.items.map(toOption), hasNext: page < (data.totalPage ?? 1) };
  };

const fetchUser = async (id: string) => {
  const { data } = await httpClient.get<UserModel | null>(`/user/${id}`);
  return data ? toOption(data) : null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ user, className }: { user: UserModel; className?: string }) {
  return user.avatar ? (
    <Image preview={false} src={fileUrl(user.avatar)} alt={user.name} className={cn("size-8 shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-[11px] font-semibold text-white", className)}>
      {initials(user.name)}
    </span>
  );
}

function UserOptionRow({ option }: { option: UserOption }) {
  const user = option.data;
  if (!user) return <span className="truncate text-sm">{option.name}</span>;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <UserAvatar user={user} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          @{user.username} · <span className="capitalize">{user.role}</span>
        </span>
      </div>
    </div>
  );
}

type UserSelectProps = Pick<
  EntitySelectProps<UserModel>,
  "value" | "onChange" | "placeholder" | "noneLabel" | "clearable" | "className"
> & {
  /** Populated user for the current value (skips the extra GET /user/:id). */
  initialUser?: UserModel | null;
  /** Only active users by default — pass "all" to include blocked users (e.g. list filters). */
  status?: UserStatusFilter;
};

/** Searchable, lazily paginated user picker (name / username / email). */
export function UserSelect({ initialUser, status = "active", ...props }: UserSelectProps) {
  return (
    <EntitySelect<UserModel>
      queryKey={["users", status]}
      fetchPage={fetchUsers(status)}
      fetchOne={fetchUser}
      initialOption={initialUser ? toOption(initialUser) : null}
      renderOption={(o) => <UserOptionRow option={o} />}
      searchPlaceholder="Search name, username or email…"
      emptyText="No users found"
      {...props}
    />
  );
}
