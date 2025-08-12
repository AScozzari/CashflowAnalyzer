import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart } from "lucide-react";

const COLORS = {
  "Saldato": "#10B981",
  "Da Saldare": "#F59E0B", 
  "In Lavorazione": "#2563EB",
  "Saldato Parziale": "#8B5CF6",
  "Annullato": "#EF4444",
  "Sospeso": "#6B7280",
};

interface StatusData {
  statusName: string;
  count: number;
  totalAmount: number;
}

interface MovementStatusChartProps {
  data: StatusData[];
  isLoading: boolean;
}

export default function DashboardMovementStatusChart({ data, isLoading }: MovementStatusChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            <CardTitle>Distribuzione per Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    fill: COLORS[item.statusName as keyof typeof COLORS] || "#6B7280"
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <PieChart className="h-5 w-5 text-purple-600" />
          <CardTitle>Distribuzione per Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ statusName, count, percent }) => 
                `${statusName}: ${count} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${value} movimenti`,
                `${formatCurrency(props.payload.totalAmount)}`
              ]}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}