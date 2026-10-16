'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Tags,
  Settings,
} from 'lucide-react';
import { useUIStore } from '@/lib/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', href: '/transactions', icon: CreditCard },
  { name: 'Kategori', href: '/categories', icon: Tags },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-16 items-center px-6 border-b border-gray-100">
          <Link href="/dashboard" className="text-xl font-bold text-primary-600">
            FinanceApp
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
