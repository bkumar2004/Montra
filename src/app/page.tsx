'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, Transaction, Category, Wallet, Budget, AnalyticsData, ActiveTab } from '@/lib/types';
import * as store from '@/lib/store';
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
  const [ready, setReady] = useState(false);

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

  // Initialize store & theme
  useEffect(() => {
    store.initializeStore();
    setReady(true);

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

  // Refresh all data from localStorage
  const refreshAll = useCallback(() => {
    if (!ready) return;
    setLoading(true);

    setDashboard(store.getDashboardData());
    setCategories(store.getCategories());
    setWallets(store.getWallets());
    setBudgets(store.getBudgets());
    setAnalytics(store.getAnalyticsData());

    const result = store.getTransactions(txFilter);
    setTransactions(result.transactions);
    setTotalTransactions(result.total);

    setLoading(false);
  }, [ready, txFilter]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAddTransaction = (data: {
    type: string; amount: number; category_id: string;
    wallet_id: string; note: string; date: string;
  }) => {
    try {
      store.addTransaction(data);
      setShowAddModal(false);
      showToast('Transaction added!');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to add transaction', 'error');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    try {
      store.deleteTransaction(id);
      showToast('Transaction deleted');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleAddBudget = (data: { category_id: string; amount: number; period: string }) => {
    try {
      store.addBudget(data);
      showToast('Budget created!');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to create budget', 'error');
    }
  };

  const handleDeleteBudget = (id: string) => {
    try {
      store.deleteBudget(id);
      showToast('Budget removed');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove budget', 'error');
    }
  };

  const handleAddWallet = (data: { name: string; type: string; balance: number; icon: string; color: string }) => {
    try {
      store.addWallet(data);
      showToast('Wallet created!');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to create wallet', 'error');
    }
  };

  if (!ready) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

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
        <PropFirmsScreen showToast={showToast} onRefresh={refreshAll} />
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
          onRefresh={refreshAll}
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
