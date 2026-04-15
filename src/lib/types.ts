export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'crypto' | 'savings';
  balance: number;
  currency: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  is_default: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
  // Joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  wallet_name?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  created_at: string;
  // Computed
  spent?: number;
  category_name?: string;
  category_icon?: string;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  weeklySpending: { day: string; amount: number }[];
  monthlySpending: number;
  recentTransactions: Transaction[];
  categoryBreakdown: { name: string; icon: string; color: string; amount: number; percentage: number }[];
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

export interface AnalyticsData {
  categoryBreakdown: { name: string; icon: string; color: string; amount: number; percentage: number; count: number }[];
  weeklyTrend: { week: string; amount: number }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
  dailyAverage: number;
  topCategory: string;
  totalTransactions: number;
}

export type ThemeMode = 'light' | 'dark';
export type ActiveTab = 'dashboard' | 'transactions' | 'add' | 'analytics' | 'trading' | 'settings';

export interface PropFirm {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'passed' | 'failed' | 'payout';
  account_size: string | null;
  challenge_type: string | null;
  notes: string | null;
  created_at: string;
  // Computed
  total_spent?: number;
  total_payout?: number;
  net_pnl?: number;
}

export interface PropFirmTransaction {
  id: string;
  user_id: string;
  firm_id: string;
  type: 'spend' | 'payout';
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
  // Joined
  firm_name?: string;
}
