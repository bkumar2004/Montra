'use client';

import { useState } from 'react';
import { Category, Wallet } from '@/lib/types';

interface AddTransactionModalProps {
  categories: Category[];
  wallets: Wallet[];
  onClose: () => void;
  onSubmit: (data: {
    type: string; amount: number; category_id: string;
    wallet_id: string; note: string; date: string;
  }) => void;
}

export default function AddTransactionModal({ categories, wallets, onClose, onSubmit }: AddTransactionModalProps) {
  const [step, setStep] = useState<'amount' | 'details'>('amount');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleKeypad = (key: string) => {
    if (key === 'backspace') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(prev => prev + '.');
      }
    } else {
      setAmountStr(prev => {
        if (prev === '0') return key;
        // Limit decimal places
        const dotIndex = prev.indexOf('.');
        if (dotIndex !== -1 && prev.length - dotIndex > 2) return prev;
        return prev + key;
      });
    }
  };

  const amount = parseFloat(amountStr) || 0;

  const handleSubmit = () => {
    if (amount <= 0) return;
    onSubmit({
      type,
      amount,
      category_id: categoryId,
      wallet_id: walletId,
      note,
      date,
    });
  };

  const canProceed = amount > 0;
  const canSubmit = amount > 0 && walletId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <button className="modal-header-btn" onClick={step === 'details' ? () => setStep('amount') : onClose}>
            {step === 'details' ? '← Back' : 'Cancel'}
          </button>
          <span className="modal-title">
            New {type === 'expense' ? 'Expense' : 'Income'}
          </span>
          {step === 'amount' ? (
            <button
              className="modal-header-btn primary"
              onClick={() => setStep('details')}
              disabled={!canProceed}
            >
              Next
            </button>
          ) : (
            <button
              className="modal-header-btn primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Save
            </button>
          )}
        </div>

        <div className="modal-body">
          {/* Type Toggle */}
          <div className="type-toggle">
            <button
              className={`type-toggle-btn ${type === 'expense' ? 'active' : ''}`}
              onClick={() => { setType('expense'); setCategoryId(''); }}
            >
              Expense
            </button>
            <button
              className={`type-toggle-btn ${type === 'income' ? 'active' : ''}`}
              onClick={() => { setType('income'); setCategoryId(''); }}
            >
              Income
            </button>
          </div>

          {step === 'amount' ? (
            <>
              {/* Amount Display */}
              <div className="amount-display">
                <div className="label">What is the amount?</div>
                <div className="amount">
                  <span className="currency">₹</span>
                  {amountStr}
                </div>
              </div>

              {/* Keypad */}
              <div className="keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => (
                  <button
                    key={key}
                    className={`keypad-btn ${key === 'backspace' ? 'backspace' : ''}`}
                    onClick={() => handleKeypad(key)}
                  >
                    {key === 'backspace' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" />
                        <line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    ) : key}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Note */}
              <div className="form-group">
                <label className="form-label">Note</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="What was this for?"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  autoFocus
                  id="transaction-note"
                />
              </div>

              {/* Amount Preview */}
              <div className="form-row">
                <span className="form-row-label">Amount</span>
                <span className="form-row-value" onClick={() => setStep('amount')}>
                  ₹{amountStr}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>

              {/* Category */}
              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="form-label">Category</label>
                <div className="category-grid">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat.id}
                      className={`category-chip ${categoryId === cat.id ? 'active' : ''}`}
                      onClick={() => setCategoryId(cat.id)}
                    >
                      <span className="emoji">{cat.icon}</span>
                      <span className="name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet */}
              <div className="form-group">
                <label className="form-label">Payment</label>
                <select
                  className="form-select"
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  id="transaction-wallet"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  id="transaction-date"
                />
              </div>

              {/* Submit Button */}
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 16 }}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {type === 'expense' ? 'Add Expense' : 'Add Income'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
