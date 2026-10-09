'use client';

import { useState } from 'react';
import { Search, Filter, Plus, ChevronDown, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useTransactions, useCategories, useDeleteTransaction } from '@/hooks/useApi';
import { formatCurrency, formatShortDate, TRANSACTION_TYPE_COLORS, getMonthOptions, getYearOptions } from '@/lib/utils';
import { toastSuccess, toastError } from '@/hooks/useToast';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import type { Transaction, Category } from '@/types';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { data: transactions, isLoading, refetch } = useTransactions({
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    date: `${yearFilter}-${monthFilter.toString().padStart(2, '0')}`,
    ordering: '-date',
  });
  
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toastSuccess('Transaksi berhasil dihapus');
        refetch();
      } catch {
        toastError('Gagal menghapus transaksi');
      }
    }
  };

  const openCreateForm = () => {
    setIsEditMode(false);
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };

  const openEditForm = (transaction: Transaction) => {
    setIsEditMode(true);
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTransaction(null);
  };

  const handleFormSubmit = () => {
    refetch();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
            <p className="text-gray-500">Kelola pemasukan dan pengeluaran Anda</p>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Transaksi Baru
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari deskripsi, kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'income' | 'expense' | '')}
                options={[
                  { value: '', label: 'Semua Tipe' },
                  { value: 'income', label: 'Pemasukan' },
                  { value: 'expense', label: 'Pengeluaran' },
                ]}
                className="w-full sm:w-40"
              />
              
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
                options={[
                  { value: '', label: 'Semua Kategori' },
                  ...(categories?.map((c) => ({ value: c.id, label: c.name })) || []),
                ]}
                className="w-full sm:w-48"
              />
              
              <div className="flex items-center gap-2">
                <Select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(Number(e.target.value))}
                  options={getMonthOptions()}
                  className="w-36"
                />
                <Select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(Number(e.target.value))}
                  options={getYearOptions()}
                  className="w-28"
                />
              </div>
              
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 px-6 py-4 border-b border-gray-100">
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
              <div className="text-center py-12">
                <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
                <Button className="mt-4" onClick={openCreateForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions!.results.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', TRANSACTION_TYPE_COLORS[transaction.type])}>
                        <Icon name={transaction.category.icon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{transaction.category.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {transaction.description || 'Tidak ada deskripsi'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className={cn('font-semibold whitespace-nowrap', transaction.type === 'income' ? 'text-income-600' : 'text-expense-600')}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                      <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
                        {formatShortDate(transaction.date)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditForm(transaction)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Edit transaksi"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Hapus transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {(transactions?.next || transactions?.previous) && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Menampilkan {transactions!.results.length} dari {transactions!.count} transaksi
                </p>
                <div className="flex gap-2">
                  {transactions?.previous && (
                    <Button variant="outline" size="sm" onClick={() => {}}>
                      Sebelumnya
                    </Button>
                  )}
                  {transactions?.next && (
                    <Button variant="outline" size="sm" onClick={() => {}}>
                      Selanjutnya
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Form Modal */}
        <TransactionForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          initialData={selectedTransaction}
        />
      </div>
    </MainLayout>
  );
}
