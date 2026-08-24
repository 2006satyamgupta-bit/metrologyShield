import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export const metadata = {
  title: "Dashboard — MetrologyShield Packaging Compliance",
  description: "Real-time compliance analytics and recent packaged commodity label audits.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
