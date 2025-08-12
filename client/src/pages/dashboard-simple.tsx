// Dashboard semplificato senza drag&drop per evitare errori @hello-pangea/dnd
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
  Settings
} from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import AdvancedCashFlowChart from "@/components/dashboard/advanced-cash-flow-chart";
import MovementStatusChart from "@/components/dashboard/movement-status-chart";
import RecentMovements from "@/components/dashboard/recent-movements";

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Impostazioni
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards 
        totalIncome={15231.89}
        totalExpenses={9326.50}
        netCashFlow={5905.39}
        movementCount={47}
      />

      {/* Charts Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <CardTitle>Flusso di Cassa</CardTitle>
              </div>
              <Badge variant="secondary">Ultimo Mese</Badge>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <AdvancedCashFlowChart />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <CardTitle>Distribuzione Stati</CardTitle>
              </div>
              <Badge variant="secondary">Corrente</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MovementStatusChart isLoading={false} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <CardTitle>Movimenti Recenti</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Movimento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RecentMovements isLoading={false} />
        </CardContent>
      </Card>

      {/* Bottom Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entrate Totali
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €15.231,89
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% dal mese scorso
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uscite Totali
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €9.326,50
            </div>
            <p className="text-xs text-muted-foreground">
              +7% dal mese scorso
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Netto
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              €5.905,39
            </div>
            <p className="text-xs text-muted-foreground">
              +15.3% dal mese scorso
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}