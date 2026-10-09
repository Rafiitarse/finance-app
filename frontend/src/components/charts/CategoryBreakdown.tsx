'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/types';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
];

interface CategoryBreakdownProps {
  data: CategorySummary[];
  className?: string;
}

export function CategoryBreakdown({ data, className }: CategoryBreakdownProps) {
  if (!data.length) {
    return (
      <div className={cn('h-64 flex items-center justify-center bg-gray-50 rounded-lg', className)}>
        <p className="text-gray-500">Belum ada data pengeluaran</p>
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.category_name,
    value: parseFloat(item.total_amount),
    color: item.category_color || COLORS[index % COLORS.length],
  }));

  return (
    <div className={cn('h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(value), '']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingRight: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
