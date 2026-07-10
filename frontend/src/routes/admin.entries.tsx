import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchAllEntries, type Entry } from "@/services/entries";
import { fetchAllUsers } from "@/services/users";
import { formatINR, formatDate } from "@/lib/format";
import { useMemo, useState, useEffect } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/entries")({
  head: () => ({ meta: [{ title: "Daily Entries · Admin" }] }),
  component: AdminEntriesPage,
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
});

// Format date from YYYY-MM-DD → DD.MM.YY
function toSheetDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

function exportToExcel(entries: Entry[], usersMap: Record<string, { name: string; pfNo: string; mobile: string; base: string }>) {
  if (entries.length === 0) {
    toast.error("No entries to export");
    return;
  }

  // Group entries by date for separate sheets
  const byDate: Record<string, Entry[]> = {};
  for (const e of entries) {
    (byDate[e.date] = byDate[e.date] ?? []).push(e);
  }

  const wb = XLSX.utils.book_new();

  // Sort dates ascending
  const dates = Object.keys(byDate).sort();

  for (const date of dates) {
    const dayEntries = byDate[date];
    const sheetLabel = toSheetDate(date); // DD.MM.YY

    // Build rows matching the exact Google Sheet column order:
    // Sl No | DATE | Base | NAME | PF No. | Mobile No. | WORKING IN | (squad) | (gap) | TRAIN NO.
    // | A CASE | A AMT | B CASE | B AMT | C CASE | C AMT | D CASE | D AMT | E CASE | E AMT
    // | SMOK CASE | SMOK AMT | TTL CASE | TTL AMT

    // Header row 1: title
    const title = [`Daily Earning of individual squad TTE'S on dt ${sheetLabel}`];

    // Header row 2: column names
    const headers = [
      "Sl No.", "DATE", "Base", "NAME", "PF No.", "Mobile No.", "WORKING IN", "", "",
      "TRAIN NO.",
      "A CASE", "A AMT", "B CASE", "B AMT", "C CASE", "C AMT",
      "D CASE", "D AMT", "E CASE", "E AMT",
      "SMOK CASE", "SMOK AMT", "TTL CASE", "TTL AMT",
    ];

    const dataRows: (string | number)[][] = [];
    let sl = 1;

    for (const e of dayEntries) {
      const u = usersMap[e.collectorId];
      dataRows.push([
        sl++,
        sheetLabel,
        u?.base ?? e.collectorBase ?? "",
        u?.name ?? e.collectorName ?? "",
        u?.pfNo ?? e.pfNo ?? "",
        u?.mobile ?? "",
        e.workingIn ?? "SQD",
        e.squadName ?? "",
        "",                           // gap column (col I in spreadsheet)
        e.trainNumber ?? "",
        e.A?.cases ?? 0,  e.A?.amount ?? 0,
        e.B?.cases ?? 0,  e.B?.amount ?? 0,
        e.C?.cases ?? 0,  e.C?.amount ?? 0,
        e.D?.cases ?? 0,  e.D?.amount ?? 0,
        e.E?.cases ?? 0,  e.E?.amount ?? 0,
        e.smoking?.cases ?? 0, e.smoking?.amount ?? 0,
        e.totalCases ?? 0,
        e.totalAmount ?? 0,
      ]);
    }

    const sheetData = [title, headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths (approximate to match spreadsheet)
    ws["!cols"] = [
      { wch: 7 },   // Sl No.
      { wch: 10 },  // DATE
      { wch: 6 },   // Base
      { wch: 22 },  // NAME
      { wch: 14 },  // PF No.
      { wch: 13 },  // Mobile No.
      { wch: 10 },  // WORKING IN
      { wch: 9 },   // squad name
      { wch: 2 },   // gap
      { wch: 14 },  // TRAIN NO.
      { wch: 8 }, { wch: 8 },   // A
      { wch: 8 }, { wch: 8 },   // B
      { wch: 8 }, { wch: 8 },   // C
      { wch: 8 }, { wch: 8 },   // D
      { wch: 8 }, { wch: 8 },   // E
      { wch: 10 }, { wch: 10 }, // SMOK
      { wch: 10 }, { wch: 10 }, // TTL
    ];

    // Sanitize sheet name (Excel limit: 31 chars, no special chars)
    const safeName = sheetLabel.replace(/[/\\?*[\]:]/g, ".").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  // If single day, also export a combined "ALL" sheet
  if (dates.length > 1) {
    const allHeaders = [
      "Sl No.", "DATE", "Base", "NAME", "PF No.", "Mobile No.", "WORKING IN", "SQUAD",
      "TRAIN NO.",
      "A CASE", "A AMT", "B CASE", "B AMT", "C CASE", "C AMT",
      "D CASE", "D AMT", "E CASE", "E AMT",
      "SMOK CASE", "SMOK AMT", "TTL CASE", "TTL AMT",
    ];
    const allRows: (string | number)[][] = [allHeaders];
    let sl = 1;
    for (const e of entries) {
      const u = usersMap[e.collectorId];
      allRows.push([
        sl++,
        toSheetDate(e.date),
        u?.base ?? e.collectorBase ?? "",
        u?.name ?? e.collectorName ?? "",
        u?.pfNo ?? e.pfNo ?? "",
        u?.mobile ?? "",
        e.workingIn ?? "SQD",
        e.squadName ?? "",
        e.trainNumber ?? "",
        e.A?.cases ?? 0, e.A?.amount ?? 0,
        e.B?.cases ?? 0, e.B?.amount ?? 0,
        e.C?.cases ?? 0, e.C?.amount ?? 0,
        e.D?.cases ?? 0, e.D?.amount ?? 0,
        e.E?.cases ?? 0, e.E?.amount ?? 0,
        e.smoking?.cases ?? 0, e.smoking?.amount ?? 0,
        e.totalCases ?? 0,
        e.totalAmount ?? 0,
      ]);
    }
    const wsAll = XLSX.utils.aoa_to_sheet(allRows);
    wsAll["!cols"] = Array(24).fill({ wch: 10 });
    wsAll["!cols"][3] = { wch: 22 };
    wsAll["!cols"][4] = { wch: 14 };
    XLSX.utils.book_append_sheet(wb, wsAll, "ALL DATA");
  }

  const filename = `NGP_DIV_SQD_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  toast.success(`Exported ${entries.length} entries to ${filename}`);
}

function AdminEntriesPage() {
  const { q } = Route.useSearch();

  const { data: entries = [] } = useQuery({
    queryKey: ["admin", "entries"],
    queryFn: fetchAllEntries,
  });
  const { data: users = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAllUsers });

 const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [base, setBase] = useState("");
  const [collector, setCollector] = useState("");
  const [train, setTrain] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "submitted">("");

  // Pre-fill train search box from dashboard universal search (?q=...)
  useEffect(() => {
    if (q) {
      setTrain(q);
    }
  }, [q]);

  const usersMap = useMemo(
    () =>
      Object.fromEntries(
        users.map((u) => [u.id, { name: u.name, pfNo: u.pfNo ?? "", mobile: u.mobile, base: u.base }])
      ),
    [users]
  );


  const collectors = users.filter(
    (u) => u.role?.toLowerCase() === "tc" || u.role?.toLowerCase() === "collector"
  );
  const bases = Array.from(new Set(collectors.map((c) => c.base)));

const rows = useMemo(() => {
    return entries
      .map((e) => ({ e, u: users.find((u) => u.id === e.collectorId) }))
      .filter(({ e, u }) => {
        if (e.status === "draft") return false; // never show unsubmitted drafts to admin
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (base && (!u || u.base !== base)) return false;
        if (collector && (!u || u.id !== collector)) return false;
        if (train && !e.trainNumber?.includes(train)) return false;
        if (statusFilter && e.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => b.e.date.localeCompare(a.e.date));
  }, [entries, users, dateFrom, dateTo, base, collector, train, statusFilter]);

  const totalAmount = rows.reduce((a, r) => a + (r.e.totalAmount ?? 0), 0);
  const totalCases = rows.reduce((a, r) => a + (r.e.totalCases ?? 0), 0);

  function handleExport() {
    const toExport = rows
      .filter((r) => r.e.status === "submitted")
      .map((r) => r.e);
    if (toExport.length === 0) {
      toast.error("No submitted entries match current filters");
      return;
    }
    exportToExcel(toExport, usersMap);
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Entries</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} records · {totalCases} cases · {formatINR(totalAmount)}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>

    {/* Filters */}
      <div className="mb-4 grid gap-2 rounded-2xl border border-border bg-card p-4 shadow-card md:grid-cols-6">
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All bases</option>
          {bases.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select
          value={collector}
          onChange={(e) => setCollector(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All collectors</option>
          {collectors.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* From date */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* To date */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={train}
            onChange={(e) => setTrain(e.target.value)}
            placeholder="Train no."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "draft" | "submitted")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {[
                "Date", "Collector", "PF No.", "Base", "Train", "Working In", "Squad",
                "A", "B", "C", "D", "E", "Smoke",
                "TTL Cases", "TTL Amt", "Status",
              ].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ e, u }) => (
              <tr key={e.id} className="hover:bg-muted/40">
                <td className="whitespace-nowrap px-3 py-3 font-medium">{formatDate(e.date)}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  {u?.name ?? e.collectorName ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">
                  {u?.pfNo ?? e.pfNo ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="chip">{u?.base ?? e.collectorBase ?? "N/A"}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono font-semibold">
                  {e.trainNumber}
                </td>
                <td className="px-3 py-3">
                  <span className="chip">{e.workingIn ?? "SQD"}</span>
                </td>
                <td className="px-3 py-3 text-xs font-semibold">{e.squadName || "—"}</td>
                <td className="px-3 py-3">{e.A?.cases ?? 0}</td>
                <td className="px-3 py-3">{e.B?.cases ?? 0}</td>
                <td className="px-3 py-3">{e.C?.cases ?? 0}</td>
                <td className="px-3 py-3">{e.D?.cases ?? 0}</td>
                <td className="px-3 py-3">{e.E?.cases ?? 0}</td>
                <td className="px-3 py-3">{e.smoking?.cases ?? 0}</td>
                <td className="px-3 py-3 font-semibold">{e.totalCases}</td>
                <td className="px-3 py-3 font-bold text-primary">{formatINR(e.totalAmount)}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    e.status === "submitted"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning-foreground"
                  }`}>
                    {e.status === "submitted" ? "Submitted" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No entries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}