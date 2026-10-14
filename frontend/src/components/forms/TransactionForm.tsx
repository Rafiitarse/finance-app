'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCategories } from '@/hooks/useApi';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useApi';
import { toastSuccess, toastError } from '@/hooks/useToast';
import type { Transaction, TransactionFormData, Category } from '@/types';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  category_id: z.number({ required_error: 'Kategori wajib dipilih' }),
  amount: z.string()
    .min(1, 'Jumlah wajib diisi')
    .refine((val) => parseFloat(val) >= 0.01, 'Jumlah minimal 0.01')
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), 'Maksimal 2 desimal'),
  description: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
});

type TransactionFormSchema = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
  defaultDate?: string;
}

export function TransactionForm({ isOpen, onClose, initialData, defaultDate }: TransactionFormProps) {
  const isEditing = !!initialData;
  const { data: categories } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  
  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];
  const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      category_id: 0,
      amount: '',
      description: '',
      date: defaultDate || new Date().toISOString().split('T')[0],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        category_id: initialData.category_id,
        amount: initialData.amount,
        description: initialData.description || '',
        date: initialData.date,
      });
    } else {
      reset({
        category_id: 0,
        amount: '',
        description: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, defaultDate, reset]);

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Pilih kategori', disabled: true },
    { value: 'income', label: '— Pemasukan —', disabled: true },
    ...incomeCategories.map((c) => ({ value: c.id, label: c.name })),
    { value: 'expense', label: '— Pengeluaran —', disabled: true },
    ...expenseCategories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const onSubmit = async (data: TransactionFormSchema) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data });
        toastSuccess('Transaksi berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(data);
        toastSuccess('Transaksi berhasil ditambahkan');
      }
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string; amount?: string[] } } };
      if (err.response?.status === 400 && err.response.data?.amount) {
        const amountError = Array.isArray(err.response.data.amount)
          ? err.response.data.amount.join(', ')
          : err.response.data.amount;
        setError('amount', { type: 'server', message: amountError });
      } else {
        toastError(err.response?.data?.detail || 'Terjadi kesalahan');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaksi' : 'Tambah Transaksi'}
      size="md"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Kategori"
          options={categoryOptions}
          placeholder="Pilih kategori"
          error={errors.category_id?.message}
          {...register('category_id', { valueAsNumber: true })}
        />
        
        <Input
          label="Jumlah"
          type="number"
          step="any"
          min="0.01"
          inputMode="decimal"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount')}
        />
        
        <Input
          label="Tanggal"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />
        
        <Textarea
          label="Deskripsi (opsional)"
          placeholder="Catatan tambahan..."
          rows={3}
          {...register('description')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
