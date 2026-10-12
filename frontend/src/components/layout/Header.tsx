'use client';

import { useState, Fragment } from 'react';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore, useUIStore } from '@/lib/store';
import { useLogout } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: clearAuth } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.push('/login');
      setProfileOpen(false);
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/transactions': 'Transaksi',
      '/categories': 'Kategori',
      '/reports': 'Laporan',
      '/settings': 'Pengaturan',
    };
    return titles[pathname] || 'FinanceApp';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 lg:ml-64">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.first_name || user?.username || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
            </button>

            {profileOpen && (
              <Fragment>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-100 shadow-lg py-1 z-50 animate-slide-down">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </Fragment>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
