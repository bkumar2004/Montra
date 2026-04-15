'use client';

import { useState } from 'react';
import { Wallet } from '@/lib/types';

interface SettingsScreenProps {
  theme: string;
  toggleTheme: () => void;
  wallets: Wallet[];
  onAddWallet: (data: { name: string; type: string; balance: number; icon: string; color: string }) => void;
}

export default function SettingsScreen({ theme, toggleTheme, wallets, onAddWallet }: SettingsScreenProps) {
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', type: 'cash', balance: '' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="page-content">
      <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences</p>
      </div>

      {/* Profile Card */}
      <div className="spending-card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
          background: 'var(--accent)', color: 'var(--text-inverse)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800
        }}>
          ₹
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}></div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}></div>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>Total Balance</div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{formatCurrency(totalBalance)}</div>
      </div>

      {/* Appearance */}
      <div className="settings-group">
        <div className="settings-group-title">Appearance</div>
        <div className="settings-item" style={{ borderRadius: 'var(--radius-md)' }} onClick={toggleTheme}>
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'var(--accent-soft)', borderRadius: 10 }}>
              {theme === 'light' ? '☀️' : '🌙'}
            </div>
            <span className="settings-item-label">Dark Mode</span>
          </div>
          <button className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`} onClick={e => { e.stopPropagation(); toggleTheme(); }} />
        </div>
      </div>

      {/* Wallets */}
      <div className="settings-group">
        <div className="settings-group-title">Wallets</div>
        {wallets.map((wallet, idx) => (
          <div
            key={wallet.id}
            className="settings-item"
            style={{
              borderRadius: wallets.length === 1 ? 'var(--radius-md)' :
                idx === 0 ? 'var(--radius-md) var(--radius-md) 0 0' :
                idx === wallets.length - 1 ? '0 0 var(--radius-md) var(--radius-md)' : '0'
            }}
          >
            <div className="settings-item-left">
              <div className="settings-icon" style={{ background: wallet.color + '15', borderRadius: 10 }}>
                {wallet.icon}
              </div>
              <div>
                <span className="settings-item-label">{wallet.name}</span>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{wallet.type}</div>
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(wallet.balance)}</span>
          </div>
        ))}
      </div>

      {/* Add Wallet */}
      {!showWalletForm ? (
        <button
          className="btn btn-secondary btn-block"
          onClick={() => setShowWalletForm(true)}
          style={{ marginBottom: 24 }}
        >
          + Add Wallet
        </button>
      ) : (
        <div className="spending-card" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Wallet Name</label>
            <input className="form-input" placeholder="e.g. Savings Account"
              value={newWallet.name} onChange={e => setNewWallet({ ...newWallet, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={newWallet.type}
              onChange={e => setNewWallet({ ...newWallet, type: e.target.value })}>
              <option value="cash">💵 Cash</option>
              <option value="bank">🏦 Bank Account</option>
              <option value="crypto">₿ Crypto</option>
              <option value="savings">💰 Savings</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Balance</label>
            <input className="form-input" type="number" placeholder="0.00"
              value={newWallet.balance} onChange={e => setNewWallet({ ...newWallet, balance: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }}
              onClick={() => { setShowWalletForm(false); setNewWallet({ name: '', type: 'cash', balance: '' }); }}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }}
              onClick={() => {
                if (newWallet.name) {
                  const iconMap: Record<string, string> = { cash: '💵', bank: '🏦', crypto: '₿', savings: '💰' };
                  onAddWallet({
                    name: newWallet.name, type: newWallet.type,
                    balance: parseFloat(newWallet.balance) || 0,
                    icon: iconMap[newWallet.type] || '💰', color: '#3B82F6',
                  });
                  setNewWallet({ name: '', type: 'cash', balance: '' });
                  setShowWalletForm(false);
                }
              }}>
              Create
            </button>
          </div>
        </div>
      )}

      {/* General */}
      <div className="settings-group">
        <div className="settings-group-title">General</div>
        <div className="settings-item" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'var(--accent-soft)', borderRadius: 10 }}>💱</div>
            <span className="settings-item-label">Currency</span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 15 }}>INR (₹)</span>
        </div>
        <div className="settings-item">
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'var(--accent-soft)', borderRadius: 10 }}>🔔</div>
            <span className="settings-item-label">Notifications</span>
          </div>
          <button className="toggle-switch active" />
        </div>
        <div className="settings-item" style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'var(--accent-soft)', borderRadius: 10 }}>📊</div>
            <span className="settings-item-label">Weekly Report</span>
          </div>
          <button className="toggle-switch active" />
        </div>
      </div>

      {/* Contact */}
      <div className="settings-group">
        <div className="settings-group-title">Contact</div>
        <a
          href="https://instagram.com/bhavishayydangi"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="settings-item" style={{ borderRadius: 'var(--radius-md)' }}>
            <div className="settings-item-left">
              <div className="settings-icon" style={{
                background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                borderRadius: 10, color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <span className="settings-item-label">Instagram</span>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@bhavishayydangi</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </a>
      </div>

      {/* About */}
      <div className="settings-group">
        <div className="settings-group-title">About</div>
        <div className="settings-item" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'var(--accent-soft)', borderRadius: 10 }}>❔</div>
            <span className="settings-item-label">Version</span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>1.0.0</span>
        </div>
        <div className="settings-item" style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'var(--accent-soft)', borderRadius: 10 }}>💕</div>
            <span className="settings-item-label">Made by FUTURE</span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Montra</span>
        </div>
      </div>

      {/* Account */}
      <div className="settings-group" style={{ marginBottom: 40 }}>
        <div className="settings-group-title">Account</div>
        <div className="settings-item" style={{ borderRadius: 'var(--radius-md)' }}>
          <div className="settings-item-left">
            <div className="settings-icon" style={{ background: 'rgba(255,59,48,0.1)', borderRadius: 10 }}>🚪</div>
            <span className="settings-item-label" style={{ color: 'var(--accent-red)' }}>Sign Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
