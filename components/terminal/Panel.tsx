import type { ReactNode } from "react";

/** The shared panel frame every terminal pane sits in. */
export function Panel({
  title,
  meta,
  children,
  className = "",
  bodyClassName = "overflow-auto",
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col bg-panel ${className}`}>
      <header className="flex flex-none items-center gap-2 border-b border-rule bg-panel-hi px-2.5 py-1.5">
        <h2 className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-amber">
          {title}
        </h2>
        {meta && (
          <span className="ml-auto text-[9.5px] uppercase tracking-[0.08em] text-dim">
            {meta}
          </span>
        )}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
