import { HomeClient } from "@/app/dashboard/HomeClient";
import { loadHomeData } from "@/lib/home/loadHomeData";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await loadHomeData();
  return <HomeClient data={data} />;
}
