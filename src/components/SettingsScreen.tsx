'use client';

import { useState } from 'react';
import { Wallet } from '@/lib/types';
import * as store from '@/lib/store';

interface SettingsScreenProps {
  theme: string;
  toggleTheme: () => void;
  wallets: Wallet[];
  onRefresh: () => void;
}

export default function SettingsScreen({ theme, toggleTheme, wallets, onRefresh }: SettingsScreenProps) {
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const handleStartEdit = (wallet: Wallet) => {
    setEditingWallet(wallet.id);
    setEditBalance(wallet.balance.toString());
  };

  const handleSaveBalance = () => {
    if (editingWallet && editBalance !== '') {
      store.updateWalletBalance(editingWallet, parseFloat(editBalance) || 0);
      setEditingWallet(null);
      setEditBalance('');
      onRefresh();
    }
  };

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('montra_'));
      keys.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div className="page-content">
      <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="spending-card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: '#fff', fontWeight: 800,
        }}>B</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Bhavishay
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Prop Trader & Developer</div>
      </div>

      {/* Appearance */}
      <div className="section-header">
        <h2 className="section-title">Appearance</h2>
      </div>
      <div className="settings-group" style={{ marginBottom: 24 }}>
        <div className="settings-item" onClick={toggleTheme}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="settings-icon" style={{ background: 'rgba(147,51,234,0.1)' }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
            </div>
          </div>
          <div style={{
            width: 48, height: 28, borderRadius: 14, padding: 3,
            background: theme === 'dark' ? 'var(--accent)' : 'var(--border-primary)',
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              transition: 'transform 0.3s ease',
              transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
      </div>

      {/* Wallets & Savings */}
      <div className="section-header">
        <h2 className="section-title">Wallets & Savings</h2>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatCurrency(totalBalance)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, paddingLeft: 4 }}>
        Tap any wallet to set your current balance
      </div>
      <div className="settings-group" style={{ marginBottom: 24 }}>
        {wallets.map(wallet => (
          <div key={wallet.id} className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {editingWallet === wallet.id ? (
              /* Edit Mode */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="settings-icon" style={{ background: wallet.color + '18', fontSize: 20 }}>
                    {wallet.icon}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Set {wallet.name} Balance
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}>₹</span>
                  <input
                    type="number"
                    className="form-input"
                    value={editBalance}
                    onChange={e => setEditBalance(e.target.value)}
                    autoFocus
                    placeholder="0"
                    style={{ flex: 1, padding: '12px 14px', fontSize: 18, fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSaveBalance} style={{
                    flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>Save</button>
                  <button onClick={() => setEditingWallet(null)} style={{
                    flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: 'none',
                    borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                onClick={() => handleStartEdit(wallet)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="settings-icon" style={{ background: wallet.color + '18', fontSize: 20 }}>
                    {wallet.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{wallet.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{wallet.type}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(wallet.balance)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--accent-blue)', fontWeight: 500 }}>tap to set</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="section-header">
        <h2 className="section-title">Contact</h2>
      </div>
      <div className="settings-group" style={{ marginBottom: 24 }}>
        <a href="https://instagram.com/bhavishayydangi" target="_blank" rel="noopener noreferrer"
          className="settings-item" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="settings-icon" style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)', color: '#fff', fontSize: 16 }}>
              📸
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Instagram</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@bhavishayydangi</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>

      {/* Data Management */}
      <div className="section-header">
        <h2 className="section-title">Data</h2>
      </div>
      <div className="settings-group" style={{ marginBottom: 24 }}>
        <div className="settings-item" onClick={handleResetData}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="settings-icon" style={{ background: 'rgba(255,59,48,0.1)' }}>
              🗑️
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#FF3B30' }}>Reset All Data</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Clear all transactions & start fresh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0 100px', color: 'var(--text-tertiary)', fontSize: 13 }}>
        <div style={{ marginBottom: 4, fontWeight: 600 }}>Montra</div>
        <div>Made by FUTURE</div>
        <div style={{ marginTop: 4, fontSize: 11 }}>v1.0.0</div>
      </div>
    </div>
  );
}
