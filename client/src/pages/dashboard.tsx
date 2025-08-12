import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import ModularDashboard from "@/components/dashboard/modular-dashboard";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { ResponsiveLayout, useScreenSize } from "@/components/responsive/responsive-layout";

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

  const { isMobile } = useScreenSize();

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Header 
          title="Dashboard" 
          subtitle="Panoramica generale dei flussi finanziari"
        />
        
        <div className="p-6 space-y-6">
          <InstallPrompt />
          
          <ModularDashboard 
            stats={stats}
            cashFlowData={cashFlowData}
            statusDistribution={statusDistribution}
            recentMovements={recentMovements}
            isLoading={statsLoading || cashFlowLoading || statusLoading || movementsLoading}
          />
        </div>
        
        <FooterSignature />
      </div>
    );
  }

  // Mobile layout with responsive components
  return (
    <ResponsiveLayout
      title="Dashboard"
      subtitle="Panoramica flussi finanziari"
      enableGestures={true}
    >
      <div className="space-y-4">
        <InstallPrompt />
        
        <ModularDashboard 
          stats={stats}
          cashFlowData={cashFlowData}
          statusDistribution={statusDistribution}
          recentMovements={recentMovements}
          isLoading={statsLoading || cashFlowLoading || statusLoading || movementsLoading}
        />
      </div>
    </ResponsiveLayout>
  );
}
