import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Train, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/services/auth";
import { useAuth } from "@/services/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Sign in · Indian Railways TC System" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("collector@railway.gov.in");
  const [password, setPassword] = useState("collector123");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate({ to: profile.role === "admin" ? "/admin" : "/home" });
    }
  }, [authLoading, user, profile, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Signed in successfully");
    } catch (error) {
      toast.error("Invalid credentials. Try collector@railway.gov.in or admin@railway.gov.in");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-surface to-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
            <Train className="h-8 w-8" />
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Indian Railways
          </div>
          <h1 className="mt-1 text-2xl font-bold">TC Daily Earning System</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to record earnings & file complaints
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="you@railway.gov.in"
                required
              />
            </div>
          </label>

          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Password
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="mb-5 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-[var(--color-primary)]"
              />
              Remember me
            </label>
            <Link to="/" className="font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-card transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-5 rounded-xl bg-primary-soft p-3 text-xs text-primary">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Demo accounts
            </div>
            <div>
              Collector: <span className="font-mono">collector@railway.gov.in</span>
            </div>
            <div>
              Admin: <span className="font-mono">admin@railway.gov.in</span>
            </div>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Authorized personnel only · Government of India
        </p>
      </div>
    </div>
  );
}
