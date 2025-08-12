import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";

interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  net: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  isLoading: boolean;
}

export default function DashboardCashFlowChart({ data, isLoading }: CashFlowChartProps) {
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle>Andamento Cash Flow</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <CardTitle>Andamento Cash Flow</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('it-IT');
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Entrate"
              dot={{ fill: '#10B981', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke="#EF4444" 
              strokeWidth={2}
              name="Uscite"
              dot={{ fill: '#EF4444', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#2563EB" 
              strokeWidth={3}
              name="Netto"
              dot={{ fill: '#2563EB', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}