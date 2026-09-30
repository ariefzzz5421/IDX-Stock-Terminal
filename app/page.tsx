import { redirect } from "next/navigation";

/** The site opens the working terminal; its layout handles sign-in and setup. */
export default function HomePage() {
  redirect("/dashboard");
}
