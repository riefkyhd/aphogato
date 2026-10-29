import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ClientsRedirect() {
  redirect("/dashboard/calendar?tab=clients");
}
