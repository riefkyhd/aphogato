import { redirect } from "next/navigation";

export default function LegacyNewProjectRedirect() {
  redirect("/dashboard/galleries/new");
}
