'use client';

import { useState } from 'react';
import { DashboardData, Wallet, Budget, Category } from '@/lib/types';
import { WeeklyBarChart } from './Charts';

interface DashboardScreenProps {
  data: DashboardData | null;
  loading: boolean;
  wallets: Wallet[];
  budgets: Budget[];
  categories: Category[];
  onAddBudget: (data: { category_id: string; amount: number; period: string }) => void;
  onDeleteBudget: (id: string) => void;
  onAddWallet: (data: { name: string; type: string; balance: number; icon: string; color: string }) => void;
  onViewAll: () => void;
  theme: string;
  toggleTheme: () => void;
}

export default function DashboardScreen({
  data, loading, wallets, budgets, categories, onAddBudget, onDeleteBudget, onAddWallet, onViewAll, theme, toggleTheme
}: DashboardScreenProps) {
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');
  const [newWallet, setNewWallet] = useState({ name: '', type: 'cash', balance: '', icon: '💰', color: '#000000' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getWalletDisplayName = () => {
    if (selectedWallet === 'all') return 'Personal';
    const w = wallets.find(w => w.id === selectedWallet);
    return w ? w.name : 'Personal';
  };

  const groupedTransactions = () => {
    if (!data?.recentTransactions) return {};
    const groups: Record<string, typeof data.recentTransactions> = {};
    for (const tx of data.recentTransactions) {
      const label = formatDate(tx.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    }
    return groups;
  };

  if (loading && !data) {
    return (
      <div className="page-content">
        <div className="header">
          <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 999 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 999 }} />
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 999 }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '100%', height: 260, borderRadius: 20, marginBottom: 24 }} />
        <div className="skeleton" style={{ width: '100%', height: 100, borderRadius: 14, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 100, borderRadius: 14 }} />
      </div>
    );
  }

  const grouped = groupedTransactions();

  return (
    <div className="page-content">
      {/* Header */}
      <div className="header">
        <div className="header-left" style={{ position: 'relative' }}>
          <button
            className="wallet-selector"
            onClick={() => setShowWalletDropdown(!showWalletDropdown)}
            id="wallet-selector"
          >
            {getWalletDisplayName()}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showWalletDropdown && (
            <div className="wallet-dropdown">
              <div
                className={`wallet-dropdown-item ${selectedWallet === 'all' ? 'active' : ''}`}
                onClick={() => { setSelectedWallet('all'); setShowWalletDropdown(false); }}
              >
                💳 All Wallets
              </div>
              {wallets.map(w => (
                <div
                  key={w.id}
                  className={`wallet-dropdown-item ${selectedWallet === w.id ? 'active' : ''}`}
                  onClick={() => { setSelectedWallet(w.id); setShowWalletDropdown(false); }}
                >
                  {w.icon} {w.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="header-right">
          <button className="header-btn" onClick={toggleTheme} id="theme-toggle" title="Toggle theme">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <button className="header-btn" id="search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className="header-btn" id="menu-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Total Spending Card */}
      {data && (
        <div className="spending-card">
          <div className="spending-label">Total Spending</div>
          <div className="spending-amount">{formatCurrency(data.totalExpenses)}</div>
          <WeeklyBarChart
            labels={data.weeklySpending.map(d => d.day)}
            data={data.weeklySpending.map(d => d.amount)}
            darkMode={theme === 'dark'}
          />
        </div>
      )}

      {/* Period Summary Cards */}
      {data && (
        <div className="period-cards">
          <div className="period-card">
            <div className="period-label">This Week</div>
            <div className="period-amount">{formatCurrency(data.thisWeek)}</div>
          </div>
          <div className="period-card">
            <div className="period-label">This Month</div>
            <div className="period-amount">{formatCurrency(data.thisMonth)}</div>
          </div>
          <div className="period-card">
            <div className="period-label">This Year</div>
            <div className="period-amount">{formatCurrency(data.thisYear)}</div>
          </div>
        </div>
      )}

      {/* Income / Expense Summary */}
      {data && (
        <div className="summary-row">
          <div className="summary-widget">
            <div className="label">Income</div>
            <div className="value income">{formatCurrency(data.totalIncome)}</div>
          </div>
          <div className="summary-widget">
            <div className="label">Expenses</div>
            <div className="value expense">{formatCurrency(data.totalExpenses)}</div>
          </div>
        </div>
      )}

      {/* Budget Section */}
      <div className="section-header">
        <h2 className="section-title">Budgets</h2>
        <button className="section-action" onClick={() => setShowBudgetForm(!showBudgetForm)}>
          {showBudgetForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showBudgetForm && (
        <div className="budget-card" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Category (optional)</label>
            <select className="form-select" value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.filter(c => c.type === 'expense').map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              className="form-input"
              type="number"
              placeholder="Enter budget amount"
              value={budgetAmount}
              onChange={e => setBudgetAmount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Period</label>
            <select className="form-select" value={budgetPeriod} onChange={e => setBudgetPeriod(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (budgetAmount) {
                onAddBudget({ category_id: budgetCategory, amount: parseFloat(budgetAmount), period: budgetPeriod });
                setBudgetAmount('');
                setBudgetCategory('');
                setShowBudgetForm(false);
              }
            }}
          >
            Create Budget
          </button>
        </div>
      )}

      {budgets.map(budget => {
        const pct = budget.amount > 0 ? Math.min((budget.spent || 0) / budget.amount * 100, 100) : 0;
        const remaining = budget.amount - (budget.spent || 0);
        const barClass = pct >= 100 ? 'danger' : pct >= 75 ? 'warning' : 'safe';

        return (
          <div className="budget-card" key={budget.id}>
            <div className="budget-header">
              <div className="budget-title">
                {budget.category_icon || '📊'} {budget.category_name || 'Overall'}
              </div>
              <span className="budget-period">{budget.period}</span>
            </div>
            <div className="budget-amounts">
              <span className="budget-spent">{formatCurrency(budget.spent || 0)}</span>
              <span className="budget-limit">of {formatCurrency(budget.amount)}</span>
            </div>
            <div className="budget-bar">
              <div className={`budget-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
            </div>
            <div className={`budget-remaining ${remaining < 0 ? 'over' : ''}`}>
              {remaining >= 0
                ? `${formatCurrency(remaining)} remaining`
                : `${formatCurrency(Math.abs(remaining))} over budget!`}
            </div>
            {pct >= 100 && (
              <div className="budget-alert">
                ⚠️ You&apos;ve exceeded this budget limit!
              </div>
            )}
            <button className="delete-btn" onClick={() => onDeleteBudget(budget.id)}>
              Remove Budget
            </button>
          </div>
        );
      })}

      {budgets.length === 0 && !showBudgetForm && (
        <div style={{ textAlign: 'center', padding: '20px 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
          No budgets set. Tap &quot;+ Add&quot; to create one.
        </div>
      )}

      {/* Wallets Section */}
      <div className="section-header" style={{ marginTop: 8 }}>
        <h2 className="section-title">Wallets</h2>
        <button className="section-action" onClick={() => setShowWalletForm(!showWalletForm)}>
          {showWalletForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showWalletForm && (
        <div className="budget-card" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="Wallet name" value={newWallet.name}
              onChange={e => setNewWallet({ ...newWallet, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={newWallet.type}
              onChange={e => setNewWallet({ ...newWallet, type: e.target.value })}>
              <option value="cash">💵 Cash</option>
              <option value="bank">🏦 Bank</option>
              <option value="crypto">₿ Crypto</option>
              <option value="savings">🏦 Savings</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Balance</label>
            <input className="form-input" type="number" placeholder="0.00" value={newWallet.balance}
              onChange={e => setNewWallet({ ...newWallet, balance: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 8 }}
            onClick={() => {
              if (newWallet.name) {
                const iconMap: Record<string, string> = { cash: '💵', bank: '🏦', crypto: '₿', savings: '🏦' };
                onAddWallet({
                  name: newWallet.name, type: newWallet.type,
                  balance: parseFloat(newWallet.balance) || 0,
                  icon: iconMap[newWallet.type] || '💰', color: '#000',
                });
                setNewWallet({ name: '', type: 'cash', balance: '', icon: '💰', color: '#000000' });
                setShowWalletForm(false);
              }
            }}>
            Create Wallet
          </button>
        </div>
      )}

      {wallets.map(wallet => (
        <div className="wallet-card" key={wallet.id}>
          <div className="wallet-icon" style={{ background: wallet.color + '15' }}>
            {wallet.icon}
          </div>
          <div className="wallet-info">
            <div className="wallet-name">{wallet.name}</div>
            <div className="wallet-type">{wallet.type}</div>
          </div>
          <div className="wallet-balance">{formatCurrency(wallet.balance)}</div>
        </div>
      ))}

      {/* Recent Transactions */}
      <div className="section-header" style={{ marginTop: 24 }}>
        <h2 className="section-title">Latest</h2>
        <button className="section-action" onClick={onViewAll}>View All</button>
      </div>

      {Object.entries(grouped).map(([dateLabel, txs]) => (
        <div className="transaction-group" key={dateLabel}>
          <div className="transaction-date-label">{dateLabel}</div>
          {txs.map(tx => (
            <div className="transaction-item" key={tx.id}>
              <div className="transaction-icon" style={{ background: (tx.category_color || '#6B7280') + '18' }}>
                {tx.category_icon || '📦'}
              </div>
              <div className="transaction-info">
                <div className="transaction-name">{tx.note || tx.category_name || 'Transaction'}</div>
                <div className="transaction-meta">
                  {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {tx.wallet_name && ` · ${tx.wallet_name}`}
                </div>
              </div>
              <div className={`transaction-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      ))}

      {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
        <div className="empty-state">
          <div className="emoji">📝</div>
          <div className="title">No transactions yet</div>
          <div className="subtitle">Tap the + button to add your first transaction</div>
        </div>
      )}
    </div>
  );
}
