'use client';

import { useState, useEffect, useCallback } from 'react';
import { PropFirm, PropFirmTransaction } from '@/lib/types';
import * as store from '@/lib/store';

interface PropFirmsData {
  firms: PropFirm[];
  summary: {
    totalSpent: number;
    totalPayout: number;
    netPnL: number;
    totalFirms: number;
    activeFirms: number;
    passedFirms: number;
    failedFirms: number;
  };
  transactions: (PropFirmTransaction & { firm_name?: string })[];
}

interface PropFirmsScreenProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export default function PropFirmsScreen({ showToast, onRefresh }: PropFirmsScreenProps) {
  const [data, setData] = useState<PropFirmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFirm, setShowAddFirm] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'firms' | 'history'>('overview');

  const [firmForm, setFirmForm] = useState({ name: '', status: 'active', account_size: '', challenge_type: '', notes: '' });
  const [txForm, setTxForm] = useState({ firm_id: '', type: 'spend', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const fetchData = useCallback(() => {
    setData(store.getPropFirmsData());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddFirm = () => {
    if (!firmForm.name) return;
    store.addPropFirm(firmForm);
    showToast('Firm added!', 'success');
    setFirmForm({ name: '', status: 'active', account_size: '', challenge_type: '', notes: '' });
    setShowAddFirm(false);
    fetchData();
  };

  const handleAddTransaction = () => {
    if (!txForm.firm_id || !txForm.amount) return;
    store.addPropFirmTransaction({ ...txForm, amount: parseFloat(txForm.amount) });
    showToast(txForm.type === 'spend' ? 'Spend recorded!' : 'Payout recorded!', 'success');
    setTxForm({ firm_id: '', type: 'spend', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
    setShowAddTx(false);
    fetchData();
    onRefresh?.();
  };

  const handleDeleteFirm = (firmId: string) => {
    store.deletePropFirm(firmId);
    showToast('Firm deleted', 'success');
    setExpandedFirm(null);
    fetchData();
    onRefresh?.();
  };

  const handleDeleteTx = (txId: string) => {
    store.deletePropFirmTransaction(txId);
    showToast('Transaction deleted', 'success');
    fetchData();
    onRefresh?.();
  };

  const handleUpdateStatus = (firmId: string, status: string) => {
    store.updatePropFirmStatus(firmId, status);
    showToast('Status updated', 'success');
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#007AFF';
      case 'passed': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'payout': return '#FF9500';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '⏳';
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'payout': return '💰';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
          <h1 className="page-title">Prop Firms</h1>
        </div>
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="page-content">
      <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <h1 className="page-title">Prop Firms</h1>
        <p className="page-subtitle">Track your prop firm spending & payouts</p>
      </div>

      {/* View Toggle */}
      <div className="type-toggle" style={{ marginBottom: 20 }}>
        <button className={`type-toggle-btn ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>
          Overview
        </button>
        <button className={`type-toggle-btn ${activeView === 'firms' ? 'active' : ''}`} onClick={() => setActiveView('firms')}>
          Firms
        </button>
        <button className={`type-toggle-btn ${activeView === 'history' ? 'active' : ''}`} onClick={() => setActiveView('history')}>
          History
        </button>
      </div>

      {/* ====== OVERVIEW ====== */}
      {activeView === 'overview' && s && (
        <>
          <div className="spending-card" style={{ textAlign: 'center' }}>
            <div className="spending-label">Net P&L</div>
            <div className="spending-amount" style={{ color: s.netPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: 8 }}>
              {s.netPnL >= 0 ? '+' : ''}{formatCurrency(s.netPnL)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>ROI: {s.totalSpent > 0 ? ((s.netPnL / s.totalSpent) * 100).toFixed(1) : '0'}%</span>
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-widget">
              <div className="label">Total Spent</div>
              <div className="value expense">{formatCurrency(s.totalSpent)}</div>
            </div>
            <div className="summary-widget">
              <div className="label">Total Payouts</div>
              <div className="value income">{formatCurrency(s.totalPayout)}</div>
            </div>
          </div>

          <div className="analytics-stat-row">
            <div className="analytics-stat">
              <div className="stat-value">{s.totalFirms}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="analytics-stat">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{s.passedFirms}</div>
              <div className="stat-label">Passed</div>
            </div>
            <div className="analytics-stat">
              <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{s.failedFirms}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setShowAddFirm(true); setActiveView('firms'); }}>
              + Add Firm
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddTx(true); setActiveView('history'); }}>
              + Log Spend/Payout
            </button>
          </div>

          {data?.firms.map(firm => (
            <div className="wallet-card" key={firm.id} onClick={() => { setExpandedFirm(firm.id); setActiveView('firms'); }}>
              <div className="wallet-icon" style={{ background: getStatusColor(firm.status) + '18' }}>
                {getStatusIcon(firm.status)}
              </div>
              <div className="wallet-info">
                <div className="wallet-name">{firm.name}</div>
                <div className="wallet-type">
                  <span style={{ color: getStatusColor(firm.status), fontWeight: 600, textTransform: 'capitalize' }}>{firm.status}</span>
                  {firm.account_size && ` · ${firm.account_size}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: (firm.net_pnl || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {(firm.net_pnl || 0) >= 0 ? '+' : ''}{formatCurrency(firm.net_pnl || 0)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>P&L</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ====== FIRMS ====== */}
      {activeView === 'firms' && (
        <>
          <div className="section-header">
            <h2 className="section-title">Your Firms</h2>
            <button className="section-action" onClick={() => setShowAddFirm(!showAddFirm)}>
              {showAddFirm ? 'Cancel' : '+ Add Firm'}
            </button>
          </div>

          {showAddFirm && (
            <div className="spending-card" style={{ marginBottom: 16, animation: 'scaleIn 0.2s ease' }}>
              <div className="form-group">
                <label className="form-label">Firm Name</label>
                <input className="form-input" placeholder="e.g. Lucid, MFFU, Tradeify..."
                  value={firmForm.name} onChange={e => setFirmForm({ ...firmForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Account Size</label>
                  <input className="form-input" placeholder="$100K"
                    value={firmForm.account_size} onChange={e => setFirmForm({ ...firmForm, account_size: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Challenge Type</label>
                  <select className="form-select" value={firmForm.challenge_type}
                    onChange={e => setFirmForm({ ...firmForm, challenge_type: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Challenge">Eval</option>
                    <option value="Evaluation">Funded</option>
                    <option value="Instant">Instant Funding</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={firmForm.status}
                  onChange={e => setFirmForm({ ...firmForm, status: e.target.value })}>
                  <option value="active">⏳ Active</option>
                  <option value="passed">✅ Passed</option>
                  <option value="failed">❌ Failed</option>
                  <option value="payout">💰 Payout Phase</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Optional notes..."
                  value={firmForm.notes} onChange={e => setFirmForm({ ...firmForm, notes: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-block" onClick={handleAddFirm}>Add Firm</button>
            </div>
          )}

          {data?.firms.map(firm => (
            <div key={firm.id} style={{ marginBottom: 14 }}>
              <div className="budget-card" style={{ marginBottom: 0 }}>
                <div className="budget-header">
                  <div className="budget-title">{getStatusIcon(firm.status)} {firm.name}</div>
                  <span className="budget-period" style={{ color: getStatusColor(firm.status), background: getStatusColor(firm.status) + '15' }}>
                    {firm.status}
                  </span>
                </div>

                {(firm.account_size || firm.challenge_type) && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', gap: 12 }}>
                    {firm.account_size && <span>📊 {firm.account_size}</span>}
                    {firm.challenge_type && <span>📋 {firm.challenge_type}</span>}
                  </div>
                )}

                {firm.notes && (
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, fontStyle: 'italic' }}>{firm.notes}</div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-input)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formatCurrency(firm.total_spent || 0)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Spent</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-input)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(firm.total_payout || 0)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payout</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-input)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: (firm.net_pnl || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {(firm.net_pnl || 0) >= 0 ? '+' : ''}{formatCurrency(firm.net_pnl || 0)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net</div>
                  </div>
                </div>

                {expandedFirm === firm.id ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['active', 'passed', 'failed', 'payout'].filter(s => s !== firm.status).map(status => (
                      <button key={status} className="filter-chip" onClick={() => handleUpdateStatus(firm.id, status)}
                        style={{ fontSize: 12, padding: '6px 12px' }}>
                        {getStatusIcon(status)} {status}
                      </button>
                    ))}
                    <button className="delete-btn" style={{ opacity: 1, animation: 'none', marginTop: 4 }}
                      onClick={() => handleDeleteFirm(firm.id)}>
                      🗑️ Delete Firm
                    </button>
                  </div>
                ) : (
                  <button style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 }}
                    onClick={() => setExpandedFirm(firm.id)}>
                    Manage ›
                  </button>
                )}
              </div>
            </div>
          ))}

          {(!data?.firms || data.firms.length === 0) && !showAddFirm && (
            <div className="empty-state">
              <div className="emoji">📈</div>
              <div className="title">No prop firms yet</div>
              <div className="subtitle">Add your first prop firm to start tracking</div>
            </div>
          )}
        </>
      )}

      {/* ====== HISTORY ====== */}
      {activeView === 'history' && (
        <>
          <div className="section-header">
            <h2 className="section-title">Transactions</h2>
            <button className="section-action" onClick={() => setShowAddTx(!showAddTx)}>
              {showAddTx ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showAddTx && (
            <div className="spending-card" style={{ marginBottom: 16, animation: 'scaleIn 0.2s ease' }}>
              <div className="type-toggle" style={{ marginBottom: 16 }}>
                <button className={`type-toggle-btn ${txForm.type === 'spend' ? 'active' : ''}`}
                  onClick={() => setTxForm({ ...txForm, type: 'spend' })}>
                  💸 Spend
                </button>
                <button className={`type-toggle-btn ${txForm.type === 'payout' ? 'active' : ''}`}
                  onClick={() => setTxForm({ ...txForm, type: 'payout' })}>
                  💰 Payout
                </button>
              </div>
              <div className="form-group">
                <label className="form-label">Firm</label>
                <select className="form-select" value={txForm.firm_id}
                  onChange={e => setTxForm({ ...txForm, firm_id: e.target.value })}>
                  <option value="">Select firm...</option>
                  {data?.firms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input className="form-input" type="number" placeholder="0"
                  value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input className="form-input" placeholder={txForm.type === 'spend' ? 'e.g. Challenge Fee' : 'e.g. Monthly Payout'}
                  value={txForm.note} onChange={e => setTxForm({ ...txForm, note: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={txForm.date}
                  onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-block" onClick={handleAddTransaction}
                disabled={!txForm.firm_id || !txForm.amount}>
                {txForm.type === 'spend' ? 'Record Spend' : 'Record Payout'}
              </button>
            </div>
          )}

          {data?.transactions.map(tx => (
            <div className="transaction-item" key={tx.id} onClick={() => handleDeleteTx(tx.id)}>
              <div className="transaction-icon" style={{ background: tx.type === 'payout' ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)' }}>
                {tx.type === 'payout' ? '💰' : '💸'}
              </div>
              <div className="transaction-info">
                <div className="transaction-name">{tx.note || (tx.type === 'spend' ? 'Firm Spend' : 'Payout')}</div>
                <div className="transaction-meta">
                  {tx.firm_name} · {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className={`transaction-amount ${tx.type === 'payout' ? 'income' : 'expense'}`}>
                {tx.type === 'payout' ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))}

          {(!data?.transactions || data.transactions.length === 0) && !showAddTx && (
            <div className="empty-state">
              <div className="emoji">📝</div>
              <div className="title">No transactions yet</div>
              <div className="subtitle">Log your prop firm spends and payouts</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
