'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { CategoryBreakdown } from '@/components/charts/CategoryBreakdown';
import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useTransactions, useTransactionSummary, useCategorySummary, useTransactionTrend } from '@/hooks/useApi';
import { formatCurrency, getMonthYear, getMonthOptions, getYearOptions, TRANSACTION_TYPE_COLORS } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    month: currentMonth.month,
    year: currentMonth.year,
    ordering: '-date',
  });
  
  const { data: summaryResponse } = useTransactionSummary({
    month: currentMonth.month,
    year: currentMonth.year,
  });
  
  const { data: categorySummaryResponse } = useCategorySummary({
    month: currentMonth.month,
    year: currentMonth.year,
  });
  
  const summary = summaryResponse?.data;
  const categorySummary = categorySummaryResponse?.data || [];

  // Real 6-month trend ending at the selected month (zero-filled by the backend)
  const { data: trendResponse } = useTransactionTrend({
    year: currentMonth.year,
    month: currentMonth.month,
  });

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  };

  const goToNextMonth = () => {
    const now = new Date();
    const currentDate = new Date(currentMonth.year, currentMonth.month - 1);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Don't go beyond current month
    if (nextMonth > new Date(now.getFullYear(), now.getMonth())) {
      return;
    }
    
    setCurrentMonth((prev) => {
      if (prev.month === 12) {
        return { month: 1, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  };

  const isCurrentMonth = 
    currentMonth.month === new Date().getMonth() + 1 && 
    currentMonth.year === new Date().getFullYear();

  // Real 6-month trend ending at the selected month — the backend zero-fills
  // months without transactions, so no manual padding is needed here.
  const chartData = (trendResponse?.data ?? []).map((item) => ({
    month: item.month,
    income: parseFloat(item.total_income),
    expense: parseFloat(item.total_expense),
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Ringkasan keuangan bulan {getMonthYear(currentMonth.year, currentMonth.month)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <select
              value={`${currentMonth.year}-${currentMonth.month}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                setCurrentMonth({ month, year });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {getYearOptions().map((y) => {
                // Never offer months after the current month (D-05)
                const now = new Date();
                const months = getMonthOptions().filter(
                  (m) => y.value < now.getFullYear() || m.value <= now.getMonth() + 1
                );
                return (
                  <optgroup key={y.value} label={y.label}>
                    {months.map((m) => (
                      <option key={`${y.value}-${m.value}`} value={`${y.value}-${m.value}`}>
                        {m.label} {y.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button className="ml-2" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Transaksi Baru
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-income-600 mt-1">
                    {summary ? formatCurrency(summary.total_income) : 'Rp0'}
                  </p>
                </div>
                <div className="p-3 bg-income-50 rounded-full">
                  <TrendingUp className="w-6 h-6 text-income-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-expense-600 mt-1">
                    {summary ? formatCurrency(summary.total_expense) : 'Rp0'}
                  </p>
                </div>
                <div className="p-3 bg-expense-50 rounded-full">
                  <TrendingDown className="w-6 h-6 text-expense-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Saldo</p>
                  <p className="text-2xl font-bold mt-1">
                    {summary ? formatCurrency(summary.balance) : 'Rp0'}
                  </p>
                </div>
                <div className="p-3 bg-primary-50 rounded-full">
                  <Wallet className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Chart */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tren 6 Bulan Terakhir</h2>
              <MonthlyChart data={chartData} />
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran per Kategori</h2>
              <CategoryBreakdown data={categorySummary || []} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Transaksi Terbaru</h2>
              <Link
                href="/transactions"
                className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-gray-700 hover:bg-gray-100 px-3 py-1.5 text-sm gap-1.5"
              >
                Lihat Semua
              </Link>
            </div>
            
            {transactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="w-24 h-6 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : transactions?.results.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada transaksi bulan ini</p>
                <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions!.results.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', TRANSACTION_TYPE_COLORS[transaction.type])}>
                        <Icon name={transaction.category.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.category.name}</p>
                        <p className="text-sm text-gray-500">{transaction.description || 'Tidak ada deskripsi'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', transaction.type === 'income' ? 'text-income-600' : 'text-expense-600')}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </MainLayout>
  );
}
