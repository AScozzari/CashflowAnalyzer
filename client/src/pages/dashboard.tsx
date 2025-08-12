import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import StatsCards from "@/components/dashboard/stats-cards";
import CashFlowChart from "@/components/dashboard/cash-flow-chart";
import MovementStatusChart from "@/components/dashboard/movement-status-chart";
import RecentMovements from "@/components/dashboard/recent-movements";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    totalMovements: number;
    pendingMovements: number;
  }>({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: cashFlowData, isLoading: cashFlowLoading } = useQuery({
    queryKey: ["/api/analytics/cash-flow"],
    queryFn: () => fetch("/api/analytics/cash-flow?days=30").then(res => res.json()),
  });

  const { data: statusDistribution, isLoading: statusLoading } = useQuery<{
    statusName: string;
    count: number;
  }[]>({
    queryKey: ["/api/analytics/status-distribution"],
  });

  const { data: recentMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements"],
    queryFn: async () => {
      const response = await fetch("/api/movements?limit=5");
      const result = await response.json();
      return result.data; // Extract the data array from paginated response
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Dashboard" 
        subtitle="Panoramica generale dei flussi finanziari"
      />
      
      <div className="p-6 space-y-6">
        <StatsCards 
          totalIncome={stats?.totalIncome || 0}
          totalExpenses={stats?.totalExpenses || 0}
          netCashFlow={stats?.netBalance || 0}
          movementCount={stats?.totalMovements || 0}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlowChart data={cashFlowData} isLoading={cashFlowLoading} />
          <MovementStatusChart data={statusDistribution} isLoading={statusLoading} />
        </div>
        
        <RecentMovements movements={recentMovements} isLoading={movementsLoading} />
      </div>
      
      <FooterSignature />
    </div>
  );
}
