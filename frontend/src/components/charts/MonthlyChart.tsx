'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface MonthlyChartProps {
  data: Array<{ month: string; income: number; expense: number }>;
  className?: string;
}

export function MonthlyChart({ data, className }: MonthlyChartProps) {
  if (!data.length) {
    return (
      <div className={cn('h-64 flex items-center justify-center bg-gray-50 rounded-lg', className)}>
        <p className="text-gray-500">Belum ada data untuk ditampilkan</p>
      </div>
    );
  }

  const chartData = data.map((item) => {
    // Parse "YYYY-MM-01" locally — new Date(string) would depend on the timezone
    const [year, month] = item.month.split('-').map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'short' });
    return {
      month: label,
      income: item.income,
      expense: item.expense,
    };
  });

  return (
    <div className={cn('h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
          <YAxis dataKey="month" type="category" tick={{ fill: '#6b7280', fontSize: 12 }} width={60} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '']}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Bar dataKey="income" fill="#16a34a" name="Pemasukan" radius={[0, 4, 4, 0]} maxBarSize={32} />
          <Bar dataKey="expense" fill="#dc2626" name="Pengeluaran" radius={[0, 4, 4, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
