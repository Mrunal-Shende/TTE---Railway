import { Train } from "lucide-react";

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <Train className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold tracking-wide text-primary">INDIAN RAILWAYS</div>
        <div className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {subtitle ?? "TC Daily Earning & Complaint System"}
        </div>
      </div>
    </div>
  );
}
