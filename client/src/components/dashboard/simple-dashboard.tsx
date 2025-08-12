import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import StatsCards from "./stats-cards";
import AdvancedCashFlowChart from "./advanced-cash-flow-chart";
import MovementStatusChart from "./movement-status-chart";
import RecentMovements from "./recent-movements";

interface SimpleDashboardProps {
  stats?: any;
  cashFlowData?: any;
  statusDistribution?: any;
  recentMovements?: any;
  isLoading?: boolean;
}

export default function SimpleDashboard({ 
  stats, 
  cashFlowData, 
  statusDistribution, 
  recentMovements, 
  isLoading 
}: SimpleDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="col-span-full">
        <StatsCards
          totalIncome={stats?.totalIncome || 0}
          totalExpenses={stats?.totalExpenses || 0}
          netCashFlow={stats?.netBalance || 0}
          movementCount={stats?.totalMovements || 0}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <AdvancedCashFlowChart data={cashFlowData} isLoading={isLoading} />
        </div>
        
        <div className="col-span-1">
          <MovementStatusChart data={statusDistribution} isLoading={isLoading} />
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          <RecentMovements movements={recentMovements} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}