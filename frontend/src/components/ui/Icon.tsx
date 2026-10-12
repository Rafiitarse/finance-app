'use client';

import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  'aria-hidden'?: boolean;
}

// Map of allowed icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  'briefcase': LucideIcons.Briefcase,
  'laptop': LucideIcons.Laptop,
  'trending-up': LucideIcons.TrendingUp,
  'gift': LucideIcons.Gift,
  'plus-circle': LucideIcons.PlusCircle,
  'utensils': LucideIcons.Utensils,
  'car': LucideIcons.Car,
  'shopping-bag': LucideIcons.ShoppingBag,
  'film': LucideIcons.Film,
  'heart-pulse': LucideIcons.HeartPulse,
  'book-open': LucideIcons.BookOpen,
  'receipt': LucideIcons.Receipt,
  'send': LucideIcons.Send,
  'minus-circle': LucideIcons.MinusCircle,
  'home': LucideIcons.Home,
  'shirt': LucideIcons.Shirt,
  'gamepad-2': LucideIcons.Gamepad2,
  'music': LucideIcons.Music,
  'plane': LucideIcons.Plane,
  'graduation-cap': LucideIcons.GraduationCap,
  'wallet': LucideIcons.Wallet,
  'credit-card': LucideIcons.CreditCard,
  'tags': LucideIcons.Tags,
  'settings': LucideIcons.Settings,
  'bar-chart-2': LucideIcons.BarChart2,
};

export function Icon({ name, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  const IconComponent = iconMap[name] || LucideIcons.HelpCircle;
  
  return (
    <IconComponent 
      className={cn('w-5 h-5', className)} 
      aria-hidden={ariaHidden}
    />
  );
}

// Helper to get icon component by name
export function getIconComponent(name: string) {
  return iconMap[name] || LucideIcons.HelpCircle;
}
