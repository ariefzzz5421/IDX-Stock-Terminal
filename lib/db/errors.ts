import { NextResponse } from "next/server";

/** Prisma's unique-constraint violation. */
export const UNIQUE_VIOLATION = "P2002";

export function prismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

/**
 * Prisma's connection-and-schema failures. Matching on codes rather than
 * message text is what actually holds up — the wording varies by driver and
 * version, the codes don't.
 *
 * P1000 auth failed · P1001 unreachable · P1002/P1008 timeout
 * P1003 database missing · P1010 access denied · P1017 connection closed
 * P2021/P2022 table or column missing, i.e. migrations never ran
 */
const CONNECTION_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1010",
  "P1017",
  "P2021",
  "P2022",
]);

/** Fallback for errors that carry no Prisma code, such as our own guard. */
const CONNECTION_PATTERNS =
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|DATABASE_URL|Authentication failed|password authentication|Can't reach database|does not exist|Connection terminated/i;

export function isDatabaseUnavailable(error: unknown): boolean {
  const code = prismaErrorCode(error);
  if (code && CONNECTION_CODES.has(code)) return true;

  const message = error instanceof Error ? error.message : String(error);
  return CONNECTION_PATTERNS.test(message);
}

/**
 * Turns an unhandled route error into a JSON response.
 *
 * Without this, a route that dies on a missing database returns a bare 500 with
 * an empty body — the client then fails to parse it and reports a network
 * problem, which sends you looking in entirely the wrong place. A misconfigured
 * database should say so.
 */
export function routeErrorResponse(error: unknown, context: string) {
  console.error(`[${context}]`, error);

  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      {
        error:
          "The database is unreachable. If this is a fresh deployment, set DATABASE_URL and run the migration.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: "Something went wrong on the server. Check the server logs." },
    { status: 500 },
  );
}
