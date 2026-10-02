export default function DashboardLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-panel" role="status" aria-live="polite">
      <div className="border-b border-rule bg-panel-hi px-4 py-3">
        <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-amber">
          Memuat halaman…
        </span>
      </div>
      <div className="grid min-h-0 flex-1 gap-px bg-rule lg:grid-cols-2" aria-hidden="true">
        {[0, 1].map((section) => (
          <div key={section} className="min-w-0 bg-panel">
            <div className="h-12 border-b border-rule bg-panel-hi" />
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex h-16 items-center gap-3 border-b border-rule/50 px-4">
                <div className="h-8 w-8 shrink-0 bg-panel-hi motion-safe:animate-pulse" />
                <div className="h-3 w-32 max-w-[45%] bg-panel-hi motion-safe:animate-pulse" />
                <div className="ml-auto h-3 w-14 shrink-0 bg-panel-hi motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
