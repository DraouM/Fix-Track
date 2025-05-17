
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRepairContext } from '@/context/RepairContext';
import { useInventoryContext } from '@/context/InventoryContext';
import type { Repair, UsedPart } from '@/types/repair';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { BarChart, LineChart, PieChart, Users, DollarSign, Package, TrendingUp, BarChart3 } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip, // Renamed to avoid conflict
  Legend as RechartsLegend,   // Renamed to avoid conflict
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  format,
  parseISO,
} from 'date-fns';
import { Icons } from '@/components/icons';

type DateRangeKey = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'allTime';

interface DateRange {
  start: Date;
  end: Date;
}

const DATE_RANGES: Record<DateRangeKey, () => DateRange> = {
  today: () => ({ start: startOfToday(), end: endOfToday() }),
  last7days: () => ({ start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: endOfToday() }),
  last30days: () => ({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: endOfToday() }),
  thisMonth: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
  lastMonth: () => ({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
  }),
  allTime: () => ({ start: new Date(0), end: endOfToday() }),
};

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function KpiCard({ title, value, icon, description }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function StatisticsPageClient() {
  const { repairs } = useRepairContext();
  const [selectedRangeKey, setSelectedRangeKey] = useState<DateRangeKey>('thisMonth');

  const filteredRepairs = useMemo(() => {
    const range = DATE_RANGES[selectedRangeKey]();
    return repairs.filter(
      (repair) =>
        repair.repairStatus === 'Completed' &&
        isWithinInterval(new Date(repair.dateReceived), { start: range.start, end: range.end })
    );
  }, [repairs, selectedRangeKey]);

  const kpiData = useMemo(() => {
    const totalRepairs = filteredRepairs.length;
    const totalRevenue = filteredRepairs.reduce((sum, r) => sum + parseFloat(r.estimatedCost), 0);
    const totalCostOfParts = filteredRepairs.reduce((sum, r) => {
      return sum + (r.usedParts?.reduce((partSum, p) => partSum + p.unitCost * p.quantity, 0) || 0);
    }, 0);
    const totalProfit = totalRevenue - totalCostOfParts;

    return {
      totalRepairs,
      totalRevenue,
      totalCostOfParts,
      totalProfit,
    };
  }, [filteredRepairs]);

  const monthlyChartData = useMemo(() => {
    const dataByMonth: Record<string, { name: string; repairs: number; revenue: number; cost: number }> = {};

    filteredRepairs.forEach((repair) => {
      const monthYear = format(new Date(repair.dateReceived), 'MMM yyyy');
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { name: format(new Date(repair.dateReceived), 'MMM'), repairs: 0, revenue: 0, cost: 0 };
      }
      dataByMonth[monthYear].repairs += 1;
      dataByMonth[monthYear].revenue += parseFloat(repair.estimatedCost);
      dataByMonth[monthYear].cost += repair.usedParts?.reduce((sum, p) => sum + p.unitCost * p.quantity, 0) || 0;
    });
    
    // Sort by date for line/bar charts
    return Object.values(dataByMonth).sort((a, b) => {
        const dateA = parseISO(Object.keys(dataByMonth).find(key => dataByMonth[key].name === a.name && dataByMonth[key].repairs === a.repairs)!.split(' ').reverse().join('-')); // Approximation
        const dateB = parseISO(Object.keys(dataByMonth).find(key => dataByMonth[key].name === b.name && dataByMonth[key].repairs === b.repairs)!.split(' ').reverse().join('-')); // Approximation
        // This sort is a bit hacky without original dates. Ideally, group by 'yyyy-MM' and sort by that key.
        // For simplicity now, assuming names are unique enough for 'MMM' or 'MMM yyyy' if data spans years.
        // A more robust way would be to store the actual month start date and sort by that.
        const aMonth = new Date(a.name + " 1, 2000"); // Dummy year for month sorting
        const bMonth = new Date(b.name + " 1, 2000");
        return aMonth.getMonth() - bMonth.getMonth();
    });

  }, [filteredRepairs]);

  const partTypeUsageData = useMemo(() => {
    const usage: Record<string, number> = {};
    filteredRepairs.forEach((repair) => {
      repair.usedParts?.forEach((part) => {
        usage[part.itemType] = (usage[part.itemType] || 0) + part.quantity;
      });
    });
    return Object.entries(usage).map(([name, value]) => ({ name, value }));
  }, [filteredRepairs]);

  const topUsedPartsData = useMemo(() => {
    const partsCount: Record<string, { name: string; quantity: number }> = {};
    filteredRepairs.forEach((repair) => {
      repair.usedParts?.forEach((part) => {
        if (!partsCount[part.partId]) {
          partsCount[part.partId] = { name: part.name, quantity: 0 };
        }
        partsCount[part.partId].quantity += part.quantity;
      });
    });
    return Object.values(partsCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredRepairs]);

  const commonDeviceModelsData = useMemo(() => {
    const modelsCount: Record<string, number> = {};
    filteredRepairs.forEach((repair) => {
      const modelKey = `${repair.deviceBrand} ${repair.deviceModel}`;
      modelsCount[modelKey] = (modelsCount[modelKey] || 0) + 1;
    });
    return Object.entries(modelsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredRepairs]);
  
  if (!repairs) {
    return <div className="flex justify-center items-center h-full"><Icons.spinner className="h-8 w-8 animate-spin" /> Loading statistics...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Shop Statistics</h1>
        <div className="w-full md:w-auto">
          <Select value={selectedRangeKey} onValueChange={(value) => setSelectedRangeKey(value as DateRangeKey)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Completed Repairs" value={kpiData.totalRepairs} icon={<Users className="h-5 w-5 text-muted-foreground" />} />
        <KpiCard title="Total Revenue" value={`$${kpiData.totalRevenue.toFixed(2)}`} icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} />
        <KpiCard title="Total Cost of Parts" value={`$${kpiData.totalCostOfParts.toFixed(2)}`} icon={<Package className="h-5 w-5 text-muted-foreground" />} />
        <KpiCard title="Total Profit" value={`$${kpiData.totalProfit.toFixed(2)}`} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Repairs Over Time</CardTitle>
            <CardDescription>Completed repairs per month for selected period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false}/>
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <RechartsLegend />
                <Line type="monotone" dataKey="repairs" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue vs. Cost of Parts</CardTitle>
             <CardDescription>Monthly revenue and cost of parts for selected period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <RechartsLegend />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card>
          <CardHeader>
            <CardTitle>Part Type Usage</CardTitle>
            <CardDescription>Distribution of parts used by type for selected period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {partTypeUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={partTypeUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {partTypeUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <RechartsLegend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No part usage data for the selected period.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Used Parts</CardTitle>
                <CardDescription>Most frequently used parts in completed repairs for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                {topUsedPartsData.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead className="text-right">Quantity Used</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {topUsedPartsData.map((part, index) => (
                        <TableRow key={index}>
                        <TableCell>{part.name}</TableCell>
                        <TableCell className="text-right">{part.quantity}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No data available for top used parts.</p>
                )}
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Most Common Device Models Repaired</CardTitle>
            <CardDescription>Most frequently repaired device models for the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
            {commonDeviceModelsData.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Device Model</TableHead>
                    <TableHead className="text-right">Number of Repairs</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {commonDeviceModelsData.map((model, index) => (
                    <TableRow key={index}>
                    <TableCell>{model.name}</TableCell>
                    <TableCell className="text-right">{model.count}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
             ) : (
                <p className="text-muted-foreground text-center py-4">No data available for common device models.</p>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
