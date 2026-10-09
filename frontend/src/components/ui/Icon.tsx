'use client';

import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

type LucideIconName = keyof typeof LucideIcons;

interface IconProps {
  name: string;
  className?: string;
  'aria-hidden'?: boolean;
}

// Map of allowed icon names to Lucide components
const iconMap: Record<string, LucideIconName> = {
  'briefcase': 'Briefcase',
  'laptop': 'Laptop',
  'trending-up': 'TrendingUp',
  'gift': 'Gift',
  'plus-circle': 'PlusCircle',
  'utensils': 'Utensils',
  'car': 'Car',
  'shopping-bag': 'ShoppingBag',
  'film': 'Film',
  'heart-pulse': 'HeartPulse',
  'book-open': 'BookOpen',
  'receipt': 'Receipt',
  'send': 'Send',
  'minus-circle': 'MinusCircle',
  'home': 'Home',
  'shirt': 'Shirt',
  'gamepad-2': 'Gamepad2',
  'music': 'Music',
  'plane': 'Plane',
  'graduation-cap': 'GraduationCap',
  'wallet': 'Wallet',
  'credit-card': 'CreditCard',
  'tags': 'Tags',
  'settings': 'Settings',
  'bar-chart-2': 'BarChart2',
};

export function Icon({ name, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  const IconComponent = LucideIcons[iconMap[name] as LucideIconName] || LucideIcons.HelpCircle;
  
  return (
    <IconComponent 
      className={cn('w-5 h-5', className)} 
      aria-hidden={ariaHidden}
    />
  );
}

// Helper to get icon component by name
export function getIconComponent(name: string) {
  return LucideIcons[iconMap[name] as LucideIconName] || LucideIcons.HelpCircle;
}
