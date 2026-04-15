'use client';

import { useState } from 'react';
import { Transaction, Category } from '@/lib/types';

interface TransactionsScreenProps {
  transactions: Transaction[];
  total: number;
  categories: Category[];
  filter: { type: string; category: string; search: string };
  onFilterChange: (filter: { type: string; category: string; search: string }) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function TransactionsScreen({
  transactions, total, categories, filter, onFilterChange, onDelete, loading
}: TransactionsScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  // Group transactions by date
  const grouped: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const label = formatDate(tx.date);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(tx);
  }

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="page-content">
      {/* Page Header */}
      <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">{total} total transactions</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search transactions..."
          value={filter.search}
          onChange={e => onFilterChange({ ...filter, search: e.target.value })}
          id="transaction-search"
        />
      </div>

      {/* Type Filter */}
      <div className="filters-bar">
        {['all', 'expense', 'income'].map(type => (
          <button
            key={type}
            className={`filter-chip ${filter.type === type ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, type })}
          >
            {type === 'all' ? 'All' : type === 'expense' ? '↓ Expenses' : '↑ Income'}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="filters-bar" style={{ marginBottom: 8 }}>
        <button
          className={`filter-chip ${filter.category === '' ? 'active' : ''}`}
          onClick={() => onFilterChange({ ...filter, category: '' })}
        >
          All Categories
        </button>
        {expenseCategories.map(cat => (
          <button
            key={cat.id}
            className={`filter-chip ${filter.category === cat.id ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, category: cat.id })}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {loading && transactions.length === 0 ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([dateLabel, txs]) => (
          <div className="transaction-group" key={dateLabel}>
            <div className="transaction-date-label">{dateLabel}</div>
            {txs.map(tx => (
              <div key={tx.id}>
                <div
                  className="transaction-item"
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                >
                  <div className="transaction-icon" style={{ background: (tx.category_color || '#6B7280') + '18' }}>
                    {tx.category_icon || '📦'}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-name">{tx.note || tx.category_name || 'Transaction'}</div>
                    <div className="transaction-meta">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {tx.wallet_name && ` · ${tx.wallet_name}`}
                      {tx.category_name && ` · ${tx.category_name}`}
                    </div>
                  </div>
                  <div className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
                {expandedId === tx.id && (
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(tx.id); setExpandedId(null); }}>
                    🗑️ Delete Transaction
                  </button>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <div className="title">No transactions found</div>
          <div className="subtitle">Try adjusting your filters or add a new transaction</div>
        </div>
      )}
    </div>
  );
}
