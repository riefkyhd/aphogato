import { redirect } from "next/navigation";

/** Auth redirect is handled in middleware; this is a fallback only. */
export default function Home() {
  redirect("/login");
}
