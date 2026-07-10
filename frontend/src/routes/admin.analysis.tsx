import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchAllUsers } from "@/services/users";
import { fetchAllEntries } from "@/services/entries";
import { formatINR } from "@/lib/format";
import { useMemo, useState } from "react";
import { Search, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/analysis")({
  head: () => ({ meta: [{ title: "TC Analysis · Admin" }] }),
  component: AdminAnalysisPage,
});

function formatLastLogin(iso?: string): string {
  if (!iso) return "Never logged in";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDay(iso: string | undefined, today: string): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) === today;
}

function AdminAnalysisPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");

  const { data: users = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAllUsers });
  const { data: entries = [] } = useQuery({
    queryKey: ["admin", "entries"],
    queryFn: fetchAllEntries,
  });

  const collectors = useMemo(
    () =>
      users.filter(
        (u) => u.role?.toLowerCase() === "tc" || u.role?.toLowerCase() === "collector",
      ),
    [users],
  );

  const analysis = useMemo(() => {
    return collectors
      .map((u) => {
        const myEntries = entries.filter((e) => e.collectorId === u.id);
        const todayEntries = myEntries.filter((e) => e.date === today);

        const todayCases = todayEntries.reduce((a, e) => a + (e.totalCases ?? 0), 0);
        const todayAmount = todayEntries.reduce((a, e) => a + (e.totalAmount ?? 0), 0);

        const totalCases = myEntries.reduce((a, e) => a + (e.totalCases ?? 0), 0);
        const totalAmount = myEntries.reduce((a, e) => a + (e.totalAmount ?? 0), 0);

        const workedToday = todayEntries.length > 0;
        const loggedInToday = isSameDay(u.lastLogin, today);
        const activeToday = workedToday || loggedInToday;

        return {
          user: u,
          todayCases,
          todayAmount,
          totalCases,
          totalAmount,
          workedToday,
          loggedInToday,
          activeToday,
          lastLogin: u.lastLogin,
        };
      })
      .filter((row) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          row.user.name.toLowerCase().includes(s) ||
          row.user.base?.toLowerCase().includes(s) ||
          row.user.pfNo?.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => Number(b.activeToday) - Number(a.activeToday));
  }, [collectors, entries, today, search]);

  const activeCount = analysis.filter((r) => r.activeToday).length;

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">TC Analysis</h1>
        <p className="text-sm text-muted-foreground">
          {analysis.length} collectors · {activeCount} active today
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, base, PF no."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="grid gap-3">
        {analysis.map((row) => (
          <div
            key={row.user.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {row.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{row.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {row.user.base} · PF: {row.user.pfNo || "—"}
                  </div>
                </div>
              </div>

              {/* Active/Not Active highlight - top right */}
              {row.activeToday ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/40 px-3 py-1.5 text-xs font-bold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active Today
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Not Active Today
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Today's Cases" value={String(row.todayCases)} />
              <Stat label="Today's Fine" value={formatINR(row.todayAmount)} />
              <Stat label="Total Cases" value={String(row.totalCases)} />
              <Stat label="Total Fine" value={formatINR(row.totalAmount)} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Last login: {formatLastLogin(row.lastLogin)}</span>
              <span>·</span>
              <span>
                {row.workedToday ? "Submitted entry today" : "No entry submitted today"}
              </span>
            </div>
          </div>
        ))}

        {analysis.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No collectors match.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}