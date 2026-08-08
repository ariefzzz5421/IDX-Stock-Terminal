/**
 * IDX / BEI trading hours, in WIB (UTC+7).
 *
 * Friday is not the same as the rest of the week — Session I ends 90 minutes
 * earlier and Session II starts 30 minutes later, to make room for Friday
 * prayers. Getting that wrong shows the wrong state for a fifth of the week.
 *
 * Regular market (Pasar Reguler), as published by IDX:
 *
 *   Mon–Thu   Pre-opening 08:45–08:59 · I 09:00–12:00 · II 13:30–15:49
 *   Fri       Pre-opening 08:45–08:59 · I 09:00–11:30 · II 14:00–15:49
 *   Daily     Pre-closing 15:50–16:00 · Post-trading 16:05–16:15
 *
 * Exchange holidays are not modelled — IDX publishes them yearly and there is
 * no free feed for them, so a holiday still reads as "Open". Treat this as a
 * schedule, not as confirmation that trading is actually happening.
 */
export type SessionState =
  | "pre-opening"
  | "session-1"
  | "break"
  | "session-2"
  | "pre-closing"
  | "post-trading"
  | "closed"
  | "weekend";

export type MarketStatus = {
  state: SessionState;
  /** True only while orders actually match in the regular market. */
  isOpen: boolean;
  label: string;
  /** What happens next, and when, in WIB — e.g. "Opens 09:00". */
  next: string;
};

const MIN = (h: number, m: number) => h * 60 + m;

const PRE_OPEN_START = MIN(8, 45);
const OPEN = MIN(9, 0);
const SESSION_1_END_WEEKDAY = MIN(12, 0);
const SESSION_1_END_FRIDAY = MIN(11, 30);
const SESSION_2_START_WEEKDAY = MIN(13, 30);
const SESSION_2_START_FRIDAY = MIN(14, 0);
const SESSION_2_END = MIN(15, 50);
const PRE_CLOSE_END = MIN(16, 0);
const POST_TRADE_END = MIN(16, 15);

/** Wall-clock minutes and weekday in Jakarta, whatever the viewer's timezone. */
export function jakartaNow(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekday = weekdayNames.indexOf(get("weekday"));

  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  return {
    weekday,
    hour,
    minute,
    second,
    minutes: hour * 60 + minute,
    clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
  };
}

function hhmm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function marketStatus(now: Date = new Date()): MarketStatus {
  const { weekday, minutes } = jakartaNow(now);

  if (weekday === 0 || weekday === 6) {
    return {
      state: "weekend",
      isOpen: false,
      label: "Closed",
      next: "Opens Monday 09:00",
    };
  }

  const isFriday = weekday === 5;
  const session1End = isFriday ? SESSION_1_END_FRIDAY : SESSION_1_END_WEEKDAY;
  const session2Start = isFriday
    ? SESSION_2_START_FRIDAY
    : SESSION_2_START_WEEKDAY;

  if (minutes < PRE_OPEN_START) {
    return {
      state: "closed",
      isOpen: false,
      label: "Closed",
      next: `Pre-opening ${hhmm(PRE_OPEN_START)}`,
    };
  }

  if (minutes < OPEN) {
    return {
      state: "pre-opening",
      isOpen: false,
      label: "Pre-opening",
      next: `Opens ${hhmm(OPEN)}`,
    };
  }

  if (minutes < session1End) {
    return {
      state: "session-1",
      isOpen: true,
      label: "Open · Session I",
      next: `Break ${hhmm(session1End)}`,
    };
  }

  if (minutes < session2Start) {
    return {
      state: "break",
      isOpen: false,
      label: "Break",
      next: `Resumes ${hhmm(session2Start)}`,
    };
  }

  if (minutes < SESSION_2_END) {
    return {
      state: "session-2",
      isOpen: true,
      label: "Open · Session II",
      next: `Pre-closing ${hhmm(SESSION_2_END)}`,
    };
  }

  if (minutes < PRE_CLOSE_END) {
    return {
      state: "pre-closing",
      isOpen: false,
      label: "Pre-closing",
      next: `Closes ${hhmm(PRE_CLOSE_END)}`,
    };
  }

  if (minutes < POST_TRADE_END) {
    return {
      state: "post-trading",
      isOpen: false,
      label: "Post-trading",
      next: `Ends ${hhmm(POST_TRADE_END)}`,
    };
  }

  return {
    state: "closed",
    isOpen: false,
    label: "Closed",
    next: isFriday ? "Opens Monday 09:00" : `Opens tomorrow ${hhmm(OPEN)}`,
  };
}
