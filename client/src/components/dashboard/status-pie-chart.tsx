import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from "lucide-react";

const STATUS_COLORS = {
  "Saldato": "#10B981",
  "Da Saldare": "#F59E0B", 
  "In Lavorazione": "#3B82F6",
  "Saldato Parziale": "#8B5CF6",
  "Annullato": "#EF4444",
  "Sospeso": "#6B7280",
};

interface StatusPieChartProps {
  className?: string;
}

export default function StatusPieChart({ className }: StatusPieChartProps) {
  const { data: statusData, isLoading } = useQuery({
    queryKey: ["/api/analytics/status-distribution"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            <span>Stati Movimenti</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const pieData = statusData?.map((item: any) => ({
    name: item.statusName,
    value: item.count,
    color: STATUS_COLORS[item.statusName as keyof typeof STATUS_COLORS] || "#6B7280"
  })) || [];

  const totalMovements = pieData.reduce((sum: number, item: any) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalMovements) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} movimenti ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: entry.color,
              color: entry.color 
            }}
          >
            <div 
              className="w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            <span>Stati Movimenti</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalMovements} totali
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={30}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessun dato disponibile</p>
          </div>
        )}
        
        {/* Summary Statistics */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-green-600">Completati</p>
              <p className="text-xs text-muted-foreground">
                {pieData.find((item: any) => item.name === "Saldato")?.value || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium text-yellow-600">In Sospeso</p>
              <p className="text-xs text-muted-foreground">
                {pieData.find((item: any) => item.name === "Da Saldare")?.value || 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}