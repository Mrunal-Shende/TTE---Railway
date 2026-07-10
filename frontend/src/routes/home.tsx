import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CollectorLayout } from "@/components/CollectorLayout";
import { useAuth } from "@/services/AuthContext";
import { fetchMyEntries } from "@/services/entries";
import { formatINR } from "@/lib/format";
import {
  Plus,
  FileText,
  ClipboardList,
  MessageSquare,
  IndianRupee,
  Briefcase,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home · TC System" }] }),
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function HomePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { data: entries = [] as import("@/services/entries").Entry[] } = useQuery<
    import("@/services/entries").Entry[]
  >({
    queryKey: ["entries", user?.uid],
    queryFn: () => fetchMyEntries(user!.uid),
    enabled: !!user,
  });
  const todayEntries = entries.filter((e) => e.date === today);
  const todayAmount = todayEntries.reduce((a, e) => a + e.totalAmount, 0);
  const todayCases = todayEntries.reduce((a, e) => a + e.totalCases, 0);

  if (authLoading || !user || !profile) return null;

  const actions = [
    {
      to: "/entry/new",
      icon: Plus,
      label: "New Daily Entry",
      desc: "Record train, cases & fines",
      tone: "primary",
    },
    {
      to: "/complaint/new",
      icon: FileText,
      label: "Submit Complaint",
      desc: "File an on-duty complaint",
      tone: "soft",
    },
    {
      to: "/entries",
      icon: ClipboardList,
      label: "My Entries",
      desc: "View past daily entries",
      tone: "soft",
    },
    {
      to: "/complaints",
      icon: MessageSquare,
      label: "Complaint History",
      desc: "Track your complaints",
      tone: "soft",
    },
  ] as const;

  if (!user) return null;

  return (
    <CollectorLayout>
      {/* Greeting */}
      <section className="mb-6">
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{profile.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="chip">{profile.base} Division</span>
          <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </section>

      {/* Today summary */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground shadow-card">
          <div className="flex items-center gap-2 text-xs font-medium opacity-80">
            <IndianRupee className="h-3.5 w-3.5" /> Today's Total
          </div>
          <div className="mt-2 text-3xl font-bold">{formatINR(todayAmount)}</div>
          <div className="mt-1 text-[11px] opacity-70">across {entries.length} entries</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" /> Today's Cases
          </div>
          <div className="mt-2 text-3xl font-bold">{todayCases}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">A/B/C/D/E + smoking</div>
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Quick actions
        </h2>
        {actions.map((a) => {
          const Icon = a.icon;
          const isPrimary = a.tone === "primary";
          return (
            <Link
              key={a.to}
              to={a.to}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated ${
                isPrimary
                  ? "border-primary/20 bg-primary text-primary-foreground shadow-card"
                  : "border-border bg-card"
              }`}
            >
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                  isPrimary ? "bg-white/15" : "bg-primary-soft text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">{a.label}</div>
                <div
                  className={`truncate text-xs ${isPrimary ? "opacity-80" : "text-muted-foreground"}`}
                >
                  {a.desc}
                </div>
              </div>
              <ChevronRight
                className={`h-5 w-5 ${isPrimary ? "opacity-80" : "text-muted-foreground"}`}
              />
            </Link>
          );
        })}
      </section>

      {/* Floating action on mobile */}
      <Link
        to="/entry/new"
        className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated md:hidden"
        aria-label="New entry"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </CollectorLayout>
  );
}
