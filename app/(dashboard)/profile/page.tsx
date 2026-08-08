import { redirect } from "next/navigation";

/** Profile lives at /account now; keep the old path working. */
export default function ProfilePage() {
  redirect("/account");
}
