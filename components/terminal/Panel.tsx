import type { ReactNode } from "react";

/** The shared panel frame every terminal pane sits in. */
export function Panel({
  title,
  meta,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "overflow-auto",
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col bg-panel ${className}`}>
      <header className={`flex flex-none items-center gap-3 border-b border-rule bg-panel-hi px-4 py-2.5 ${headerClassName}`}>
        <h2 className="shrink-0 whitespace-nowrap font-display text-micro font-bold uppercase tracking-[0.16em] text-amber">
          {title}
        </h2>
        {meta && (
          <span className="ml-auto min-w-0 truncate text-micro uppercase tracking-[0.1em] text-dim">
            {meta}
          </span>
        )}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
