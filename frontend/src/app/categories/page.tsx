'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useApi';
import { toastSuccess, toastError } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  
  const { data: categories, isLoading, refetch } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];
  const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];
  const currentCategories = activeTab === 'income' ? incomeCategories : expenseCategories;

  const handleDelete = async (id: number, isDefault: boolean) => {
    if (isDefault) {
      toastError('Kategori default tidak bisa dihapus');
      return;
    }
    if (confirm('Yakin ingin menghapus kategori ini? Transaksi yang menggunakan kategori ini tidak akan terhapus.')) {
      try {
        await deleteMutation.mutateAsync(id);
        toastSuccess('Kategori berhasil dihapus');
        refetch();
      } catch {
        toastError('Gagal menghapus kategori');
      }
    }
  };

  const openCreateForm = () => {
    setIsEditMode(false);
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    if (category.is_default) {
      toastError('Kategori default tidak bisa diedit');
      return;
    }
    setIsEditMode(true);
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
            <p className="text-gray-500">Kelola kategori pemasukan dan pengeluaran</p>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Kategori Baru
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('income')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'income'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'expense'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Pengeluaran
          </button>
        </div>

        {/* Categories Grid */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-gray-200 rounded-full mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : currentCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Belum ada kategori {activeTab === 'income' ? 'pemasukan' : 'pengeluaran'}
                </p>
                <Button onClick={openCreateForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kategori
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {currentCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: category.color }}>
                        <Icon name={category.icon} className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{category.name}</p>
                          {category.is_default && (
                            <span aria-label="Kategori default">
                              <Shield className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {category.transaction_count} transaksi • {category.total_amount ? `Rp${parseFloat(category.total_amount).toLocaleString('id-ID')}` : 'Rp0'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!category.is_default && (
                        <button
                          onClick={() => openEditForm(category)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Edit kategori"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {!category.is_default && (
                        <button
                          onClick={() => handleDelete(category.id, category.is_default)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Hapus kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Form Modal */}
        <CategoryForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          initialData={selectedCategory}
        />
      </div>
    </MainLayout>
  );
}
