import { AnalysisHistoryList } from "@/components/history/AnalysisHistoryList";

export const metadata = {
  title: "Audit History & Archives — MetrologyShield",
  description: "Search and inspect historical Legal Metrology compliance inspection records.",
};

export default function HistoryPage() {
  return <AnalysisHistoryList />;
}
