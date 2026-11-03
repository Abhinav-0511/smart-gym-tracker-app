import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Search, Users } from "lucide-react";

import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AdminEmptyState, AdminError, AdminLoading } from "@/features/admin/components/AdminStates";
import { listUsers, type AdminUser } from "@/features/admin/services/admin";

type SortKey = "full_name" | "email" | "created_at" | "last_sign_in_at";
type SortDir = "asc" | "desc";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** User directory: searchable, sortable table backed by admin_list_users(). */
const AdminUsersPage = () => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const rows = useMemo(() => {
    const users = data ?? [];
    const term = search.trim().toLowerCase();
    const filtered = term
      ? users.filter(
          (u) =>
            (u.full_name ?? "").toLowerCase().includes(term) ||
            (u.email ?? "").toLowerCase().includes(term),
        )
      : users;

    const sorted = [...filtered].sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return sorted;
  }, [data, search, sortKey, sortDir]);

  if (isPending) return <AdminLoading label="Loading users" />;
  if (error) {
    return (
      <AdminError
        message={error instanceof Error ? error.message : "Please try again."}
        onRetry={() => void refetch()}
      />
    );
  }

  const SortHeader = ({ label, column }: { label: string; column: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(column)}
      className="flex items-center gap-1 font-semibold text-foreground"
    >
      {label}
      {sortKey === column &&
        (sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No users found"
          description={search ? "Try a different search." : "No users have signed up yet."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="User" column="full_name" /></TableHead>
                <TableHead><SortHeader label="Email" column="email" /></TableHead>
                <TableHead><SortHeader label="Created" column="created_at" /></TableHead>
                <TableHead><SortHeader label="Last Login" column="last_sign_in_at" /></TableHead>
                <TableHead className="text-right">Module Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user: AdminUser) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <ProfileAvatar
                        avatarPath={user.avatar_url}
                        fullName={user.full_name ?? "Member"}
                        className="h-8 w-8"
                        fallbackClassName="text-xs"
                      />
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        {user.full_name ?? "—"}
                        {user.is_admin && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                            Admin
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.last_sign_in_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5 text-[11px] text-muted-foreground">
                      <span className={cn("rounded-md bg-secondary px-1.5 py-0.5")}>
                        {user.workout_count} W
                      </span>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5">
                        {user.habit_count} H
                      </span>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5">
                        {user.transaction_count} T
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {rows.length} user{rows.length === 1 ? "" : "s"} · Usage: W = workouts, H = habits, T = transactions
      </p>
    </div>
  );
};

export default AdminUsersPage;
