export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary shadow-card">
        <img
          src="/railway-logo.jpeg"
          alt="Indian Railways logo"
          className="h-full w-full object-cover"
        />
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