"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  planned_cost: number;
  actual_cost: number;
  total_cost: number;
  status: string;
}

interface BudgetChartsProps {
  budgetItems: BudgetItem[];
  categories: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  lighting: "#00E8FF",
  audio: "#9B5CFF",
  video: "#FF008C",
  equipment: "#00E8FF",
  labor: "#9B5CFF",
  crew: "#9B5CFF",
  venue: "#FF008C",
  catering: "#FFD700",
  transportation: "#00FF87",
  materials: "#FF6B6B",
  permits: "#4ECDC4",
  insurance: "#95E1D3",
  misc: "#6C757D",
  power: "#FFB800",
  logistics: "#00D9FF",
};

const COLORS = ["#00E8FF", "#9B5CFF", "#FF008C", "#FFD700", "#00FF87", "#FF6B6B", "#4ECDC4", "#95E1D3"];

export function BudgetCharts({ budgetItems, categories }: BudgetChartsProps) {
  const categoryData = categories.map((category, index) => {
    const items = budgetItems.filter(item => item.category === category);
    const plannedTotal = items.reduce((sum, item) => sum + (item.planned_cost || item.total_cost), 0);
    const actualTotal = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

    return {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      planned: plannedTotal,
      actual: actualTotal,
      fill: CATEGORY_COLORS[category] || COLORS[index % COLORS.length],
    };
  }).filter(cat => cat.planned > 0 || cat.actual > 0);

  const totalPlanned = categoryData.reduce((sum, cat) => sum + cat.planned, 0);
  const totalActual = categoryData.reduce((sum, cat) => sum + cat.actual, 0);

  const pieData = categoryData.map(cat => ({
    name: cat.name,
    value: cat.planned,
    fill: cat.fill,
  }));

  const statusData = [
    { name: "Estimated", value: budgetItems.filter(i => i.status === "estimated").length, fill: "#6C757D" },
    { name: "Quoted", value: budgetItems.filter(i => i.status === "quoted").length, fill: "#FFD700" },
    { name: "PO", value: budgetItems.filter(i => i.status === "purchase_order").length, fill: "#00E8FF" },
    { name: "Invoiced", value: budgetItems.filter(i => i.status === "invoiced").length, fill: "#9B5CFF" },
    { name: "Paid", value: budgetItems.filter(i => i.status === "paid").length, fill: "#00FF87" },
    { name: "Overdue", value: budgetItems.filter(i => i.status === "overdue").length, fill: "#FF008C" },
  ].filter(s => s.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border border-white/20">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-cyan-400">${payload[0].value?.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Budget by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No budget data to display
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Planned vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="planned" fill="#00E8FF" name="Planned" />
                <Bar dataKey="actual" fill="#9B5CFF" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No comparison data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Payment Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No status data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span className="text-gray-400">Total Planned</span>
              <span className="text-2xl font-bold text-cyan-400">${totalPlanned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span className="text-gray-400">Total Actual</span>
              <span className="text-2xl font-bold text-violet-400">${totalActual.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span className="text-gray-400">Variance</span>
              <span className={`text-2xl font-bold ${totalActual > totalPlanned ? 'text-red-400' : 'text-green-400'}`}>
                ${Math.abs(totalActual - totalPlanned).toLocaleString()}
                {totalActual > totalPlanned ? ' over' : ' under'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span className="text-gray-400">Utilization</span>
              <span className="text-2xl font-bold text-white">
                {totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
