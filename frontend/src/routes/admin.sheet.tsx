import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import {
  fetchAllSheetRows,
  addSheetRow,
  updateSheetRow,
  deleteSheetRow,
  emptySheetRow,
  buildSheetRowFromEntries,
  type SheetRow,
  type CaseValue,
  type FareCaseValue,
} from "@/services/sheetReport";
import { fetchAllEntries } from "@/services/entries";
import { fetchAllUsers } from "@/services/users";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/sheet")({
  head: () => ({ meta: [{ title: "Sheet · Admin" }] }),
  component: AdminSheetPage,
});

type SimpleCatKey = "C" | "D" | "E" | "smoking" ;
type FareCatKey = "A" | "B";

const SIMPLE_CATS: { key: SimpleCatKey; label: string }[] = [
  { key: "C", label: "C Cases" },
  { key: "D", label: "D Cases" },
  { key: "E", label: "E Case" },
  { key: "smoking", label: "Smoking" },
];

function fareTotal(val: FareCaseValue | undefined): number {
  if (!val) return 0;
  return (val.nc || 0) * ((val.fare || 0) + (val.eFare || 0));
}

function abcSubtotal(row: SheetRow) {
  const nc = (row.A?.nc || 0) + (row.B?.nc || 0) + (row.C?.nc || 0);
  const amt = fareTotal(row.A) + fareTotal(row.B) + (row.C?.amt || 0);
  return { nc, amt };
}

function grandTotals(row: SheetRow) {
  const abc = abcSubtotal(row);
  const nc = abc.nc + (row.D?.nc || 0) + (row.E?.nc || 0) + (row.smoking?.nc || 0);
  const amt = abc.amt + (row.D?.amt || 0) + (row.E?.amt || 0) + (row.smoking?.amt || 0);
  const avgNc = row.wd > 0 ? nc / row.wd : 0;
  const avgAmt = row.wd > 0 ? amt / row.wd : 0;
  return { nc, amt, avgNc, avgAmt };
}

function exportSheetToExcel(rows: SheetRow[]) {
  if (rows.length === 0) {
    toast.error("No rows to export");
    return;
  }

  const header1: (string | number)[] = ["Sl No", "Base", "Name of Staff", "WD"];
  const header2: (string | number)[] = ["", "", "", ""];

  header1.push("A Cases", "", "", "");
  header2.push("NC", "Fare", "E/Fare", "Total");

  header1.push("B Cases", "", "", "");
  header2.push("NC", "E/Fare", "Fare", "Total");

  header1.push("C Cases", "", "");
  header2.push("NC", "AMT", "Total");

  header1.push("A+B+C", "");
  header2.push("NC", "AMT");

  header1.push("Average", "");
  header2.push("NC", "AMT");

  header1.push("D Cases", "");
  header2.push("NC", "AMT");

  header1.push("E Case", "");
  header2.push("NC", "AMT");

  header1.push("Smoking", "");
  header2.push("NC", "AMT");

  header1.push("Total", "", "Average", "");
  header2.push("NC", "AMT", "NC", "AMT");

  const dataRows = rows.map((r, i) => {
    const abc = abcSubtotal(r);
    const abcAvgNc = r.wd > 0 ? abc.nc / r.wd : 0;
    const abcAvgAmt = r.wd > 0 ? abc.amt / r.wd : 0;
    const t = grandTotals(r);

    return [
      i + 1, r.base, r.name, r.wd,
      r.A.nc, r.A.fare, r.A.eFare, Number(fareTotal(r.A).toFixed(0)),
      r.B.nc, r.B.eFare, r.B.fare, Number(fareTotal(r.B).toFixed(0)),
      r.C.nc, r.C.amt, r.C.amt,
      abc.nc, Number(abc.amt.toFixed(0)),
      Number(abcAvgNc.toFixed(1)), Number(abcAvgAmt.toFixed(1)),
      r.D.nc, r.D.amt,
      r.E.nc, r.E.amt,
      r.smoking.nc, r.smoking.amt,
      t.nc, Number(t.amt.toFixed(0)), Number(t.avgNc.toFixed(1)), Number(t.avgAmt.toFixed(1)),
    ];
  });

  const sheetData = [header1, header2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
    { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },   // A Cases
    { s: { r: 0, c: 8 }, e: { r: 0, c: 11 } },  // B Cases
    { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } }, // C Cases
    { s: { r: 0, c: 15 }, e: { r: 0, c: 16 } }, // A+B+C
    { s: { r: 0, c: 17 }, e: { r: 0, c: 18 } }, // Average (A+B+C)
    { s: { r: 0, c: 19 }, e: { r: 0, c: 20 } }, // D Cases
    { s: { r: 0, c: 21 }, e: { r: 0, c: 22 } }, // E Case
    { s: { r: 0, c: 23 }, e: { r: 0, c: 24 } }, // Smoking
    { s: { r: 0, c: 25 }, e: { r: 0, c: 26 } }, // Total
    { s: { r: 0, c: 27 }, e: { r: 0, c: 28 } }, // Average (grand)
  ];
  ws["!merges"] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "TTE Earning Sheet");
  const filename = `TTE_Earning_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  toast.success(`Exported ${rows.length} rows to ${filename}`);
}

function AdminSheetPage() {
  const { data: fetchedRows = [], isLoading } = useQuery({
    queryKey: ["admin", "sheetRows"],
    queryFn: fetchAllSheetRows,
  });
  const { data: allEntries = [] } = useQuery({
    queryKey: ["admin", "entries"],
    queryFn: fetchAllEntries,
  });
  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAllUsers,
  });

  const [rows, setRows] = useState<SheetRow[]>([]);
  const initialized = useRef(false);
  const syncedThisSession = useRef(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

useEffect(() => {
    if (initialized.current || isLoading) return;
    setRows(fetchedRows);
    initialized.current = true;
  }, [fetchedRows, isLoading]);

  // ── Auto-create Sheet rows for collectors with entries this month who don't
  // already have a row — never touches/overwrites existing rows. ──
  useEffect(() => {
    if (!initialized.current || syncedThisSession.current) return;
    if (allEntries.length === 0 || allUsers.length === 0) return;

    syncedThisSession.current = true;

    async function sync() {
      // Always re-fetch the latest rows directly from Firestore right before
      // deciding what to create — never trust component state here, since a
      // tab switch can remount this component before state has caught up.
      const latestRows = await fetchAllSheetRows();

      const thisMonth = new Date().toISOString().slice(0, 7);
      const collectors = allUsers.filter(
        (u) => u.role?.toLowerCase() === "tc" || u.role?.toLowerCase() === "collector",
      );

      // Match on collectorId + sourceMonth so a new row is still created next
      // month, but this month's row is never duplicated.
      const existingKeys = new Set(
        latestRows
          .filter((r) => r.collectorId && r.sourceMonth)
          .map((r) => `${r.collectorId}__${r.sourceMonth}`),
      );

      let nextOrder = latestRows.length > 0 ? Math.max(...latestRows.map((r) => r.order)) + 1 : 1;
      const toCreate: Omit<SheetRow, "id">[] = [];

      for (const collector of collectors) {
        if (existingKeys.has(`${collector.id}__${thisMonth}`)) continue;

        const monthEntries = allEntries.filter(
          (e) =>
            e.collectorId === collector.id &&
            e.status === "submitted" &&
            e.date.slice(0, 7) === thisMonth,
        );
        if (monthEntries.length === 0) continue;

        toCreate.push(
          buildSheetRowFromEntries(
            { id: collector.id, name: collector.name, base: collector.base },
            monthEntries,
            nextOrder++,
          ),
        );
      }

      if (toCreate.length === 0) return;

      try {
        const created = await Promise.all(
          toCreate.map(async (row) => ({ ...row, id: await addSheetRow(row) })),
        );
        setRows((rs) => [...rs, ...created]);
        toast.success(`Added ${created.length} new row(s) from entries`);
      } catch {
        toast.error("Failed to auto-create some rows from entries");
      }
    }

    sync();
  }, [allEntries, allUsers]);

  function scheduleSave(id: string, patch: Partial<Omit<SheetRow, "id">>) {
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      try {
        await updateSheetRow(id, patch);
      } catch {
        toast.error("Failed to save changes");
      }
    }, 500);
  }

  function patchRow(id: string | undefined, patch: Partial<Omit<SheetRow, "id">>) {
    if (!id) return;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    scheduleSave(id, patch);
  }

  function patchSimpleCategory(
    id: string | undefined,
    cat: SimpleCatKey,
    field: keyof CaseValue,
    value: number,
  ) {
    if (!id) return;
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r[cat], [field]: value };
        scheduleSave(id, { [cat]: updated } as Partial<Omit<SheetRow, "id">>);
        return { ...r, [cat]: updated };
      }),
    );
  }

  function patchFareCategory(
    id: string | undefined,
    cat: FareCatKey,
    field: keyof FareCaseValue,
    value: number,
  ) {
    if (!id) return;
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r[cat], [field]: value };
        scheduleSave(id, { [cat]: updated } as Partial<Omit<SheetRow, "id">>);
        return { ...r, [cat]: updated };
      }),
    );
  }

  async function handleAddRow() {
    const order = rows.length > 0 ? Math.max(...rows.map((r) => r.order)) + 1 : 1;
    const newRow = emptySheetRow(order);
    try {
      const id = await addSheetRow(newRow);
      setRows((rs) => [...rs, { ...newRow, id }]);
    } catch {
      toast.error("Failed to add row");
    }
  }

  async function handleDeleteRow(id: string | undefined) {
    if (!id) return;
    try {
      await deleteSheetRow(id);
      setRows((rs) => rs.filter((r) => r.id !== id));
      toast.success("Row deleted");
    } catch {
      toast.error("Failed to delete row");
    }
  }

  const grandTotal = rows.reduce(
    (acc, r) => {
      const t = grandTotals(r);
      return { nc: acc.nc + t.nc, amt: acc.amt + t.amt };
    },
    { nc: 0, amt: 0 },
  );

  const thick = "border-r-4 border-r-foreground/50";

  return (
    <AdminLayout>
      {/* Wrapping the whole page in overflow-x-hidden so the table's own
          horizontal scroll never drags the sticky toolbar/page along with it */}
      <div className="w-full min-w-0 overflow-x-hidden">
        {/* Page title/stats — scrolls normally with the page */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Sheet</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} staff · {grandTotal.nc} total cases · ₹{grandTotal.amt.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Buttons — fixed to the viewport, immune to any horizontal/vertical scroll */}
        <div className="fixed right-4 top-20 z-50 hidden gap-2 md:right-8 md:flex">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-elevated hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add Row
          </button>
          <button
            onClick={() => exportSheetToExcel(rows)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>

        {/* Mobile-only buttons — normal inline flow (fixed floating buttons don't work well on small screens) */}
        <div className="mb-4 flex gap-2 md:hidden">
          <button
            onClick={handleAddRow}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add Row
          </button>
          <button
            onClick={() => exportSheetToExcel(rows)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[2200px] text-xs">
              <thead className="sticky top-0 z-10 bg-muted/90 text-center font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                <tr>
                  <th rowSpan={2} className={`w-14 border border-border bg-muted px-2 py-2 ${thick}`}>Sl No</th>
                  <th rowSpan={2} className={`w-20 border border-border bg-muted px-2 py-2 ${thick}`}>Base</th>
                  <th rowSpan={2} className={`w-44 border border-border bg-muted px-2 py-2 ${thick}`}>Name of Staff</th>
                  <th rowSpan={2} className={`w-16 border border-border bg-muted px-2 py-2 ${thick}`}>WD</th>

                  <th colSpan={4} className={`border border-border px-2 py-2 ${thick}`}>A Cases</th>
                  <th colSpan={4} className={`border border-border px-2 py-2 ${thick}`}>B Cases</th>
                  <th colSpan={3} className={`border border-border px-2 py-2 ${thick}`}>C Cases</th>
                  <th colSpan={2} className={`border border-border px-2 py-2 ${thick}`}>A+B+C</th>
                  <th colSpan={2} className={`border border-border px-2 py-2 ${thick}`}>Average</th>
                  <th colSpan={2} className={`border border-border px-2 py-2 ${thick}`}>D Cases</th>
                  <th colSpan={2} className={`border border-border px-2 py-2 ${thick}`}>E Case</th>
                  <th colSpan={2} className={`border border-border px-2 py-2 ${thick}`}>Smoking</th>
                  <th colSpan={2} className={`border border-border px-2 py-2 ${thick}`}>Total</th>
                  <th colSpan={2} className="border border-border px-2 py-2">Average</th>
                  <th rowSpan={2} className="border border-border px-2 py-2"></th>
                </tr>
                <tr>
                  {/* A Cases */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className="border border-border px-2 py-1.5">Fare</th>
                  <th className="border border-border px-2 py-1.5">E/Fare</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>Total</th>
                  {/* B Cases */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className="border border-border px-2 py-1.5">E/Fare</th>
                  <th className="border border-border px-2 py-1.5">Fare</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>Total</th>
                  {/* C Cases */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className="border border-border px-2 py-1.5">AMT</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>Total</th>
                  {/* A+B+C */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>AMT</th>
                  {/* Average of A+B+C */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>AMT</th>
                  {/* D Cases */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>AMT</th>
                  {/* E Case */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>AMT</th>
                  {/* Smoking */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>AMT</th>
                  {/* Grand Total */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className={`border border-border px-2 py-1.5 ${thick}`}>AMT</th>
                  {/* Grand Average */}
                  <th className="border border-border px-2 py-1.5">NC</th>
                  <th className="border border-border px-2 py-1.5">AMT</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const abc = abcSubtotal(row);
                  const abcAvgNc = row.wd > 0 ? abc.nc / row.wd : 0;
                  const abcAvgAmt = row.wd > 0 ? abc.amt / row.wd : 0;
                  const t = grandTotals(row);
                  const aTotal = fareTotal(row.A);
                  const bTotal = fareTotal(row.B);

                  return (
                    <tr key={row.id} className="text-center hover:bg-muted/30">
                      <td className={`w-14 border border-border px-2 py-1.5 font-semibold ${thick}`}>{i + 1}</td>
                      <td className={`w-20 border border-border p-0 ${thick}`}>
                        <input
                          value={row.base}
                          onChange={(e) => patchRow(row.id, { base: e.target.value })}
                          className="w-full bg-transparent px-2 py-1.5 text-center font-semibold outline-none"
                        />
                      </td>
                      <td className={`w-44 border border-border p-0 ${thick}`}>
                        <input
                          value={row.name}
                          onChange={(e) => patchRow(row.id, { name: e.target.value })}
                          className="w-full bg-transparent px-2 py-1.5 text-left outline-none"
                        />
                      </td>
                      <td className={`w-16 border border-border p-0 ${thick}`}>
                        <input
                          type="number"
                          value={row.wd || ""}
                          onChange={(e) => patchRow(row.id, { wd: Number(e.target.value) || 0 })}
                          className="w-full bg-transparent px-2 py-1.5 text-center outline-none"
                        />
                      </td>

                      {/* A Cases */}
                      <td className="border border-border p-0">
                        <input type="number" value={row.A.nc || ""}
                          onChange={(e) => patchFareCategory(row.id, "A", "nc", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className="border border-border p-0">
                        <input type="number" value={row.A.fare || ""}
                          onChange={(e) => patchFareCategory(row.id, "A", "fare", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className="border border-border p-0">
                        <input type="number" value={row.A.eFare || ""}
                          onChange={(e) => patchFareCategory(row.id, "A", "eFare", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className={`border border-border bg-muted/40 px-2 py-1.5 font-semibold ${thick}`}>{aTotal.toFixed(0)}</td>

                      {/* B Cases */}
                      <td className="border border-border p-0">
                        <input type="number" value={row.B.nc || ""}
                          onChange={(e) => patchFareCategory(row.id, "B", "nc", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className="border border-border p-0">
                        <input type="number" value={row.B.eFare || ""}
                          onChange={(e) => patchFareCategory(row.id, "B", "eFare", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className="border border-border p-0">
                        <input type="number" value={row.B.fare || ""}
                          onChange={(e) => patchFareCategory(row.id, "B", "fare", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className={`border border-border bg-muted/40 px-2 py-1.5 font-semibold ${thick}`}>{bTotal.toFixed(0)}</td>

                      {/* C Cases */}
                      <td className="border border-border p-0">
                        <input type="number" value={row.C.nc || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "C", "nc", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className="border border-border p-0">
                        <input type="number" value={row.C.amt || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "C", "amt", Number(e.target.value) || 0)}
                          className="w-16 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className={`border border-border bg-muted/40 px-2 py-1.5 font-semibold ${thick}`}>{row.C.amt.toFixed(0)}</td>

                      {/* A+B+C subtotal */}
                      <td className="border border-border bg-muted/30 px-2 py-1.5 font-semibold">{abc.nc}</td>
                      <td className={`border border-border bg-muted/30 px-2 py-1.5 font-semibold ${thick}`}>{abc.amt.toFixed(0)}</td>

                      {/* Average of A+B+C */}
                      <td className="border border-border px-2 py-1.5 text-muted-foreground">{abcAvgNc.toFixed(1)}</td>
                      <td className={`border border-border px-2 py-1.5 text-muted-foreground ${thick}`}>{abcAvgAmt.toFixed(1)}</td>

                      {/* D Cases */}
                      <td className="border border-border p-0">
                        <input type="number" value={row.D.nc || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "D", "nc", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className={`border border-border p-0 ${thick}`}>
                        <input type="number" value={row.D.amt || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "D", "amt", Number(e.target.value) || 0)}
                          className="w-16 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>

                      {/* E Case */}
                      <td className="border border-border p-0">
                        <input type="number" value={row.E.nc || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "E", "nc", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className={`border border-border p-0 ${thick}`}>
                        <input type="number" value={row.E.amt || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "E", "amt", Number(e.target.value) || 0)}
                          className="w-16 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>

                    {/* Smoking */}
                      <td className="border border-border p-0">
                        <input type="number" value={row.smoking.nc || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "smoking", "nc", Number(e.target.value) || 0)}
                          className="w-14 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>
                      <td className={`border border-border p-0 ${thick}`}>
                        <input type="number" value={row.smoking.amt || ""}
                          onChange={(e) => patchSimpleCategory(row.id, "smoking", "amt", Number(e.target.value) || 0)}
                          className="w-16 bg-transparent px-2 py-1.5 text-center outline-none" />
                      </td>

                      {/* Grand Total + Average */}
                      <td className="border border-border bg-primary-soft px-2 py-1.5 font-bold text-primary">{t.nc}</td>
                      <td className={`border border-border bg-primary-soft px-2 py-1.5 font-bold text-primary ${thick}`}>{t.amt.toFixed(0)}</td>
                      <td className="border border-border px-2 py-1.5 text-muted-foreground">{t.avgNc.toFixed(1)}</td>
                      <td className="border border-border px-2 py-1.5 text-muted-foreground">{t.avgAmt.toFixed(1)}</td>

                      <td className="border border-border px-1 py-1.5">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={29} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No rows yet. Click "Add Row" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}