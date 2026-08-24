"use client";

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";

const BREAKPOINT = "(min-width: 1280px)"; // matches the xl: prefix used elsewhere
const MIN_WIDTH = 220;
const MAX_WIDTH = 560;
const RAIL_WIDTH = 40;

/**
 * Subscribes to a media query without the effect+setState pattern the lint
 * rules here reject: useSyncExternalStore is the primitive meant for exactly
 * this (an external, changing value read on the client), and its
 * getServerSnapshot keeps server and first client render in agreement so
 * there is no hydration mismatch to paper over.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * A value backed by localStorage under `key`, read via useSyncExternalStore
 * so writes from this hook notify every reader without an effect. Same-tab
 * localStorage writes fire no native "storage" event, so this hook is its
 * own emitter for that case.
 */
function usePersistentValue<T>(
  key: string,
  decode: (raw: string | null) => T,
  encode: (value: T) => string,
): [T, (value: T) => void] {
  const listenersRef = useRef(new Set<() => void>());

  const value = useSyncExternalStore(
    (onChange) => {
      const listeners = listenersRef.current;
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => decode(window.localStorage.getItem(key)),
    () => decode(null),
  );

  const setValue = useCallback(
    (next: T) => {
      window.localStorage.setItem(key, encode(next));
      listenersRef.current.forEach((listener) => listener());
    },
    [key, encode],
  );

  return [value, setValue];
}

const decodeWidth = (defaultWidth: number) => (raw: string | null) => {
  const parsed = Number(raw);
  return parsed >= MIN_WIDTH && parsed <= MAX_WIDTH ? parsed : defaultWidth;
};
const encodeWidth = (value: number) => String(value);
const decodeBoolean = (raw: string | null) => raw === "1";
const encodeBoolean = (value: boolean) => (value ? "1" : "0");

/**
 * A two-panel split where one side can be dragged to resize and collapsed to
 * a slim rail to get it out of the way. Width and collapsed state persist per
 * storageKey, so different pages remember their own layout independently.
 *
 * Below the xl breakpoint this degrades to a plain stacked layout: dragging a
 * divider does not make sense once the panels are not side by side, so
 * neither the divider nor the collapse rail render there.
 */
export function ResizableSplit({
  left,
  right,
  storageKey,
  defaultWidth = 320,
  leftLabel = "panel",
  resizableSide = "left",
}: {
  left: ReactNode;
  right: ReactNode;
  storageKey: string;
  defaultWidth?: number;
  leftLabel?: string;
  /** Which side drags and collapses. The other side fills the remaining space. */
  resizableSide?: "left" | "right";
}) {
  const isLeftResizable = resizableSide === "left";
  const resizableContent = isLeftResizable ? left : right;
  const fillingContent = isLeftResizable ? right : left;

  const isDesktop = useMediaQuery(BREAKPOINT);
  const [persistedWidth, setPersistedWidth] = usePersistentValue(
    "idx-split-width:" + storageKey,
    decodeWidth(defaultWidth),
    encodeWidth,
  );
  const [collapsed, setCollapsed] = usePersistentValue(
    "idx-split-collapsed:" + storageKey,
    decodeBoolean,
    encodeBoolean,
  );

  // Live width while dragging. Only committed to storage on release, so a
  // drag in progress does not thrash every other reader of the same key.
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const width = liveWidth ?? persistedWidth;

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const startDrag = useCallback(
    (event: React.PointerEvent) => {
      if (collapsed) return;
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      setDragging(true);
      const rect = container.getBoundingClientRect();

      // Left-resizable panel: width is the distance from the left edge of
      // the container. Right-resizable panel: width is the distance from
      // the right edge, since dragging further right should shrink it.
      const computeWidth = (clientX: number) => {
        const raw = isLeftResizable ? clientX - rect.left : rect.right - clientX;
        return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw));
      };

      const onMove = (moveEvent: PointerEvent) => {
        setLiveWidth(computeWidth(moveEvent.clientX));
      };

      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setDragging(false);
        setLiveWidth(null);
        setPersistedWidth(computeWidth(upEvent.clientX));
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [collapsed, isLeftResizable, setPersistedWidth],
  );

  const nudge = useCallback(
    (delta: number) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width + delta));
      setPersistedWidth(next);
    },
    [width, setPersistedWidth],
  );

  // Below the breakpoint: plain stack, no drag or collapse chrome at all.
  if (!isDesktop) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-px">
        {left}
        {right}
      </div>
    );
  }

  const ExpandIcon = isLeftResizable ? ChevronRight : ChevronLeft;
  const CollapseIcon = isLeftResizable ? ChevronLeft : ChevronRight;

  const resizablePanel = (
    <div
      className="min-h-0 shrink-0 overflow-hidden"
      style={{
        width: collapsed ? RAIL_WIDTH : width,
        transition: dragging ? "none" : "width 160ms ease",
      }}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={"Expand " + leftLabel}
          title={"Expand " + leftLabel}
          className={
            "flex h-full w-full flex-col items-center gap-2 bg-panel-hi pt-3 text-dim transition-colors hover:text-amber border-rule " +
            (isLeftResizable ? "border-r" : "border-l")
          }
        >
          <ExpandIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex h-full min-h-0 flex-col" style={{ width }}>
          {resizableContent}
        </div>
      )}
    </div>
  );

  const divider = (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={"Resize " + leftLabel}
      aria-valuenow={collapsed ? 0 : width}
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
      tabIndex={collapsed ? -1 : 0}
      onPointerDown={startDrag}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") nudge(isLeftResizable ? -16 : 16);
        if (event.key === "ArrowRight") nudge(isLeftResizable ? 16 : -16);
      }}
      className={
        "group relative w-[3px] shrink-0 bg-rule " +
        (collapsed ? "" : "cursor-col-resize hover:bg-amber-dim ") +
        (dragging ? "bg-amber" : "")
      }
    >
      {!collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          // The button sits inside the divider's drag-catch area, so a
          // pointerdown here must never reach the divider's own handler —
          // otherwise clicking it also starts a drag, and a click with a
          // pixel of mouse movement in between silently resizes the panel.
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={"Minimize " + leftLabel}
          title={"Minimize " + leftLabel}
          className="absolute left-1/2 top-3 z-20 flex h-6 w-4 -translate-x-1/2 items-center justify-center border border-rule bg-panel-hi text-dimmer opacity-0 transition-opacity hover:text-amber group-hover:opacity-100"
        >
          <CollapseIcon aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-rule-hi opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical aria-hidden="true" className="h-4 w-4" />
      </span>
    </div>
  );

  const fillingPanel = <div className="min-h-0 min-w-0 flex-1">{fillingContent}</div>;

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1">
      {isLeftResizable ? (
        <>
          {resizablePanel}
          {divider}
          {fillingPanel}
        </>
      ) : (
        <>
          {fillingPanel}
          {divider}
          {resizablePanel}
        </>
      )}
    </div>
  );
}
