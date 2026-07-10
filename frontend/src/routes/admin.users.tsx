import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchAllUsers, updateUserStatus, createTCUser, type CreateUserPayload } from "@/services/users";
import { Eye, Pencil, Ban, CheckCircle2, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Users · Admin" }] }),
  component: AdminUsersPage,
});

const BASES = ["NGP", "NITR", "G", "RJN", "NIR", "GRG", "DGG"];

function emptyForm(): CreateUserPayload {
  return {
    name: "",
    email: "",
    password: "",
    pfNo: "",
    mobile: "",
    base: "NGP",
    joining: new Date().toISOString().slice(0, 10),
    role: "tc",
  };
}

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAllUsers });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>(emptyForm());
  const [creating, setCreating] = useState(false);

  const collectors = users.filter(
    (u) => u.role?.toLowerCase() === "tc" || u.role?.toLowerCase() === "collector"
  );

  async function toggleStatus(u: (typeof users)[number]) {
    const next = u.status === "active" ? "disabled" : "active";
    await updateUserStatus(u.id, next);
    toast.success(`${u.name} ${next === "active" ? "enabled" : "disabled"}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  function setField<K extends keyof CreateUserPayload>(k: K, v: CreateUserPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.pfNo.trim()) {
      toast.error("Name, Email, Password and PF No. are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      await createTCUser(form);
      toast.success(`TC account created for ${form.name}`);
      setShowAdd(false);
      setForm(emptyForm());
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create user";
      toast.error(msg.includes("email-already-in-use") ? "Email already registered" : msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-sm text-muted-foreground">{collectors.length} collectors registered.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card"
        >
          <Plus className="h-4 w-4" /> Add TC
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">PF No.</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{u.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{u.pfNo || u.empId || "—"}</td>
                <td className="px-4 py-3">
                  <span className="chip">{u.base}</span>
                </td>
                <td className="px-4 py-3">{u.mobile || "—"}</td>
                <td className="px-4 py-3">
                  {u.status === "active" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn onClick={() => toast.message(`Viewing ${u.name}`)} label="View">
                      <Eye className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn onClick={() => toast.message(`Editing ${u.name}`)} label="Edit">
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn onClick={() => toggleStatus(u)} label={u.status === "active" ? "Disable" : "Enable"}>
                      <Ban className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add TC Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-elevated">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New TC</h2>
              <button onClick={() => setShowAdd(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Full Name *">
                  <input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. S G SATHWANE"
                    className="field-input"
                  />
                </FormField>
                <FormField label="PF No. *">
                  <input
                    value={form.pfNo}
                    onChange={(e) => setField("pfNo", e.target.value)}
                    placeholder="e.g. 39500722678"
                    className="field-input font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Mobile No.">
                  <input
                    value={form.mobile}
                    onChange={(e) => setField("mobile", e.target.value)}
                    inputMode="numeric"
                    placeholder="10-digit number"
                    className="field-input"
                  />
                </FormField>
                <FormField label="Base">
                  <select
                    value={form.base}
                    onChange={(e) => setField("base", e.target.value)}
                    className="field-input"
                  >
                    {BASES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Email *">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="tc@railway.gov.in"
                  className="field-input"
                />
              </FormField>

              <FormField label="Password * (min 6 chars)">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Set a secure password"
                  className="field-input"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Joining Date">
                  <input
                    type="date"
                    value={form.joining ?? ""}
                    onChange={(e) => setField("joining", e.target.value)}
                    className="field-input"
                  />
                </FormField>
                <FormField label="Role">
                  <select
                    value={form.role}
                    onChange={(e) => setField("role", e.target.value as "tc" | "admin")}
                    className="field-input"
                  >
                    <option value="tc">TC (Collector)</option>
                    <option value="admin">Admin</option>
                  </select>
                </FormField>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? "Creating…" : "Create TC"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}