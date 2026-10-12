// API Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: boolean;
  transaction_count: number;
  total_amount: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  category: Category;
  category_id: number;
  type: 'income' | 'expense';
  amount: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlySummary {
  month: string;
  total_income: string;
  total_expense: string;
  balance: string;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  type: 'income' | 'expense';
  total_amount: string;
  transaction_count: number;
  percentage: string;
}

// Form Types
export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface TransactionFormData {
  category_id: number;
  amount: string;
  description?: string;
  date: string;
}

export interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// Filter Types
export interface TransactionFilters {
  category?: number;
  type?: 'income' | 'expense';
  date?: string;
  search?: string;
  ordering?: string;
  page?: number;
  month?: number;
  year?: number;
}

export interface SummaryFilters {
  year?: number;
  month?: number;
}
