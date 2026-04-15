'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, Transaction, Category, Wallet, Budget, AnalyticsData, ActiveTab } from '@/lib/types';
import DashboardScreen from '@/components/DashboardScreen';
import TransactionsScreen from '@/components/TransactionsScreen';
import AddTransactionModal from '@/components/AddTransactionModal';
import AnalyticsScreen from '@/components/AnalyticsScreen';
import SettingsScreen from '@/components/SettingsScreen';
import PropFirmsScreen from '@/components/PropFirmsScreen';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [txFilter, setTxFilter] = useState<{ type: string; category: string; search: string }>({
    type: 'all', category: '', search: ''
  });

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem('montra-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('montra-theme', next);
  };

  // Fetch data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboard(data);
    } catch (e) {
      console.error('Failed to fetch dashboard', e);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (txFilter.type !== 'all') params.set('type', txFilter.type);
      if (txFilter.category) params.set('category', txFilter.category);
      if (txFilter.search) params.set('search', txFilter.search);
      params.set('limit', '100');

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalTransactions(data.total || 0);
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    }
  }, [txFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      setWallets(data);
    } catch (e) {
      console.error('Failed to fetch wallets', e);
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();
      setBudgets(data);
    } catch (e) {
      console.error('Failed to fetch budgets', e);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboard(),
      fetchTransactions(),
      fetchCategories(),
      fetchWallets(),
      fetchBudgets(),
      fetchAnalytics(),
    ]);
    setLoading(false);
  }, [fetchDashboard, fetchTransactions, fetchCategories, fetchWallets, fetchBudgets, fetchAnalytics]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAddTransaction = async (data: {
    type: string; amount: number; category_id: string;
    wallet_id: string; note: string; date: string;
  }) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add transaction');
      setShowAddModal(false);
      showToast('Transaction added successfully!');
      refreshAll();
    } catch {
      showToast('Failed to add transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Transaction deleted');
      refreshAll();
    } catch {
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleAddBudget = async (data: { category_id: string; amount: number; period: string }) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create budget');
      showToast('Budget created!');
      fetchBudgets();
    } catch {
      showToast('Failed to create budget', 'error');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      showToast('Budget removed');
      fetchBudgets();
    } catch {
      showToast('Failed to remove budget', 'error');
    }
  };

  const handleAddWallet = async (data: { name: string; type: string; balance: number; icon: string; color: string }) => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create wallet');
      showToast('Wallet created!');
      fetchWallets();
      fetchDashboard();
    } catch {
      showToast('Failed to create wallet', 'error');
    }
  };

  return (
    <div className="app-shell">
      {activeTab === 'dashboard' && (
        <DashboardScreen
          data={dashboard}
          loading={loading}
          wallets={wallets}
          budgets={budgets}
          onAddBudget={handleAddBudget}
          onDeleteBudget={handleDeleteBudget}
          onAddWallet={handleAddWallet}
          categories={categories}
          onViewAll={() => setActiveTab('transactions')}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsScreen
          transactions={transactions}
          total={totalTransactions}
          categories={categories}
          filter={txFilter}
          onFilterChange={setTxFilter}
          onDelete={handleDeleteTransaction}
          loading={loading}
        />
      )}

      {activeTab === 'trading' && (
        <PropFirmsScreen showToast={showToast} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsScreen
          data={analytics}
          loading={loading}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsScreen
          theme={theme}
          toggleTheme={toggleTheme}
          wallets={wallets}
          onAddWallet={handleAddWallet}
        />
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={() => setShowAddModal(true)}
      />

      {showAddModal && (
        <AddTransactionModal
          categories={categories}
          wallets={wallets}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTransaction}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
