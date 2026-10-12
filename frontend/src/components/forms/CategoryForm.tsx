'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useApi';
import { toastSuccess, toastError } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  type: z.enum(['income', 'expense'], { required_error: 'Tipe wajib dipilih' }),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
});

type CategoryFormSchema = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
}

const DEFAULT_ICONS = [
  'briefcase', 'laptop', 'trending-up', 'gift', 'plus-circle',
  'utensils', 'car', 'shopping-bag', 'film', 'heart-pulse',
  'book-open', 'receipt', 'send', 'minus-circle', 'home',
  'shirt', 'gamepad-2', 'music', 'plane', 'graduation-cap',
];

const DEFAULT_COLORS = [
  '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
  '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F',
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
];

export function CategoryForm({ isOpen, onClose, initialData }: CategoryFormProps) {
  const isEditing = !!initialData;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      icon: '',
      color: '#EF4444',
    },
  });

  // Populate form when editing - reset when initialData changes
  if (isOpen && initialData) {
    reset({
      name: initialData.name,
      type: initialData.type,
      icon: initialData.icon,
      color: initialData.color,
    });
  } else if (isOpen && !initialData) {
    reset({
      name: '',
      type: 'expense',
      icon: '',
      color: '#EF4444',
    });
  }

  const onSubmit = async (data: CategoryFormSchema) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data });
        toastSuccess('Kategori berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(data);
        toastSuccess('Kategori berhasil ditambahkan');
      }
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string; name?: string[] } } };
      if (err.response?.status === 400 && err.response.data?.name) {
        // Set field error for duplicate name
        const nameError = Array.isArray(err.response.data.name)
          ? err.response.data.name.join(', ')
          : err.response.data.name;
        setError('name', { type: 'server', message: nameError });
      } else if (err.response?.status === 409 && err.response.data?.detail) {
        toastError(err.response.data.detail);
      } else if (err.response?.status === 409) {
        toastError('Kategori digunakan oleh transaksi dan tidak bisa dihapus');
      } else {
        toastError(err.response?.data?.detail || 'Terjadi kesalahan');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nama Kategori"
          placeholder="Contoh: Makanan & Minuman"
          error={errors.name?.message}
          {...register('name')}
        />
        
        <Select
          label="Tipe"
          options={[
            { value: 'income', label: 'Pemasukan' },
            { value: 'expense', label: 'Pengeluaran' },
          ]}
          error={errors.type?.message}
          {...register('type')}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ikon</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => register('icon').onChange({ target: { value: iconName } })}
                className={cn(
                  'p-2 rounded-lg border-2 transition-all',
                  watch('icon') === iconName
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                aria-pressed={watch('icon') === iconName}
              >
                <Icon name={iconName} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => register('color').onChange({ target: { value: color } })}
                className={cn(
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  watch('color') === color
                    ? 'ring-2 ring-offset-2 ring-primary-500'
                    : 'hover:scale-110'
                )}
                style={{ backgroundColor: color }}
                aria-pressed={watch('color') === color}
              />
            ))}
          </div>
          <Input
            type="color"
            className="mt-2 w-16 h-10 p-1 border rounded-lg cursor-pointer"
            {...register('color')}
          />
        </div>

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