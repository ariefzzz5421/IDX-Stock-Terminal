import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The terminal has no marketing page. With auth off the dashboard renders for
 * the shared guest account, so this always lands somewhere useful; if
 * AUTH_REQUIRED is on, the dashboard itself bounces to /login.
 */
export default function Home() {
  redirect("/dashboard");
}
