import { DashboardData, Transaction, Category, Wallet, Budget, AnalyticsData, PropFirm, PropFirmTransaction } from './types';

// ============================================
// LOCAL STORAGE DATA STORE
// All data is persisted in the browser's localStorage
// No server/database required — works on Vercel
// ============================================

const STORAGE_KEYS = {
  transactions: 'montra_transactions',
  wallets: 'montra_wallets',
  budgets: 'montra_budgets',
  categories: 'montra_categories',
  propFirms: 'montra_prop_firms',
  propFirmTxs: 'montra_prop_firm_txs',
  initialized: 'montra_initialized',
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// DEFAULT DATA
// ============================================

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', user_id: null as unknown as string, name: 'Food & Drinks', icon: '🍔', color: '#FF6B6B', type: 'expense', is_default: 1 },
  { id: 'cat_transport', user_id: null as unknown as string, name: 'Transport', icon: '🚗', color: '#4ECDC4', type: 'expense', is_default: 1 },
  { id: 'cat_shopping', user_id: null as unknown as string, name: 'Shopping', icon: '🛍️', color: '#A78BFA', type: 'expense', is_default: 1 },
  { id: 'cat_bills', user_id: null as unknown as string, name: 'Bills & Fees', icon: '📄', color: '#F59E0B', type: 'expense', is_default: 1 },
  { id: 'cat_entertainment', user_id: null as unknown as string, name: 'Entertainment', icon: '🎬', color: '#EC4899', type: 'expense', is_default: 1 },
  { id: 'cat_health', user_id: null as unknown as string, name: 'Health', icon: '💊', color: '#10B981', type: 'expense', is_default: 1 },
  { id: 'cat_education', user_id: null as unknown as string, name: 'Education', icon: '📚', color: '#3B82F6', type: 'expense', is_default: 1 },
  { id: 'cat_groceries', user_id: null as unknown as string, name: 'Groceries', icon: '🛒', color: '#8B5CF6', type: 'expense', is_default: 1 },
  { id: 'cat_subscriptions', user_id: null as unknown as string, name: 'Subscriptions', icon: '🔄', color: '#F97316', type: 'expense', is_default: 1 },
  { id: 'cat_travel', user_id: null as unknown as string, name: 'Travel', icon: '✈️', color: '#06B6D4', type: 'expense', is_default: 1 },
  { id: 'cat_gifts', user_id: null as unknown as string, name: 'Gifts', icon: '🎁', color: '#D946EF', type: 'expense', is_default: 1 },
  { id: 'cat_propfirm', user_id: null as unknown as string, name: 'Prop Firm', icon: '📈', color: '#0EA5E9', type: 'expense', is_default: 1 },
  { id: 'cat_other_exp', user_id: null as unknown as string, name: 'Other', icon: '📦', color: '#6B7280', type: 'expense', is_default: 1 },
  { id: 'cat_salary', user_id: null as unknown as string, name: 'Salary', icon: '💰', color: '#22C55E', type: 'income', is_default: 1 },
  { id: 'cat_freelance', user_id: null as unknown as string, name: 'Freelance', icon: '💻', color: '#3B82F6', type: 'income', is_default: 1 },
  { id: 'cat_investments', user_id: null as unknown as string, name: 'Investments', icon: '📈', color: '#10B981', type: 'income', is_default: 1 },
  { id: 'cat_payout', user_id: null as unknown as string, name: 'Payout', icon: '💵', color: '#22C55E', type: 'income', is_default: 1 },
  { id: 'cat_other_inc', user_id: null as unknown as string, name: 'Other Income', icon: '💵', color: '#6B7280', type: 'income', is_default: 1 },
];

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'wallet_cash', user_id: 'user', name: 'Cash', type: 'cash', balance: 0, currency: 'INR', icon: '💵', color: '#22C55E', created_at: new Date().toISOString() },
  { id: 'wallet_bank', user_id: 'user', name: 'Bank', type: 'bank', balance: 0, currency: 'INR', icon: '🏦', color: '#3B82F6', created_at: new Date().toISOString() },
  { id: 'wallet_upi', user_id: 'user', name: 'UPI', type: 'upi', balance: 0, currency: 'INR', icon: '📱', color: '#8B5CF6', created_at: new Date().toISOString() },
  { id: 'wallet_trading', user_id: 'user', name: 'Trading', type: 'trading', balance: 0, currency: 'INR', icon: '📈', color: '#F59E0B', created_at: new Date().toISOString() },
];

// ============================================
// INITIALIZE STORE
// ============================================
export function initializeStore() {
  if (typeof window === 'undefined') return;
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (!initialized) {
    setItem(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
    setItem(STORAGE_KEYS.wallets, DEFAULT_WALLETS);
    setItem(STORAGE_KEYS.budgets, []);
    setItem(STORAGE_KEYS.transactions, []);
    setItem(STORAGE_KEYS.propFirms, []);
    setItem(STORAGE_KEYS.propFirmTxs, []);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }
}

// ============================================
// CATEGORIES
// ============================================
export function getCategories(): Category[] {
  return getItem<Category[]>(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
}

// ============================================
// WALLETS
// ============================================
export function getWallets(): Wallet[] {
  return getItem<Wallet[]>(STORAGE_KEYS.wallets, DEFAULT_WALLETS);
}

export function addWallet(data: { name: string; type: string; balance: number; icon: string; color: string }): Wallet {
  const wallets = getWallets();
  const wallet: Wallet = {
    id: generateId('wallet'),
    user_id: 'user',
    name: data.name,
    type: data.type as Wallet['type'],
    balance: data.balance,
    currency: 'INR',
    icon: data.icon,
    color: data.color,
    created_at: new Date().toISOString(),
  };
  wallets.push(wallet);
  setItem(STORAGE_KEYS.wallets, wallets);
  return wallet;
}

export function updateWalletBalance(walletId: string, newBalance: number): void {
  const wallets = getWallets();
  const idx = wallets.findIndex(w => w.id === walletId);
  if (idx !== -1) {
    wallets[idx].balance = newBalance;
    setItem(STORAGE_KEYS.wallets, wallets);
  }
}

// ============================================
// TRANSACTIONS
// ============================================
export function getTransactions(filter?: { type?: string; category?: string; search?: string }): { transactions: Transaction[]; total: number } {
  let txs = getItem<Transaction[]>(STORAGE_KEYS.transactions, []);

  // Sort by date desc
  txs.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

  const total = txs.length;

  if (filter?.type && filter.type !== 'all') {
    txs = txs.filter(t => t.type === filter.type);
  }
  if (filter?.category) {
    txs = txs.filter(t => t.category_id === filter.category);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    txs = txs.filter(t =>
      (t.note || '').toLowerCase().includes(q) ||
      (t.category_name || '').toLowerCase().includes(q)
    );
  }

  return { transactions: txs, total };
}

export function addTransaction(data: { type: string; amount: number; category_id: string; wallet_id: string; note: string; date: string }): Transaction {
  const txs = getItem<Transaction[]>(STORAGE_KEYS.transactions, []);
  const categories = getCategories();
  const wallets = getWallets();

  const cat = categories.find(c => c.id === data.category_id);
  const wallet = wallets.find(w => w.id === data.wallet_id);

  const tx: Transaction = {
    id: generateId('tx'),
    user_id: 'user',
    wallet_id: data.wallet_id,
    category_id: data.category_id,
    type: data.type as 'income' | 'expense',
    amount: data.amount,
    note: data.note,
    date: data.date,
    created_at: new Date().toISOString(),
    category_name: cat?.name,
    category_icon: cat?.icon,
    category_color: cat?.color,
    wallet_name: wallet?.name,
  };

  txs.push(tx);
  setItem(STORAGE_KEYS.transactions, txs);

  // Update wallet balance
  if (wallet) {
    const allWallets = getWallets();
    const idx = allWallets.findIndex(w => w.id === wallet.id);
    if (idx !== -1) {
      allWallets[idx].balance += data.type === 'income' ? data.amount : -data.amount;
      setItem(STORAGE_KEYS.wallets, allWallets);
    }
  }

  return tx;
}

export function deleteTransaction(id: string): void {
  const txs = getItem<Transaction[]>(STORAGE_KEYS.transactions, []);
  const tx = txs.find(t => t.id === id);

  // Reverse wallet balance
  if (tx) {
    const wallets = getWallets();
    const wIdx = wallets.findIndex(w => w.id === tx.wallet_id);
    if (wIdx !== -1) {
      wallets[wIdx].balance += tx.type === 'income' ? -tx.amount : tx.amount;
      setItem(STORAGE_KEYS.wallets, wallets);
    }
  }

  setItem(STORAGE_KEYS.transactions, txs.filter(t => t.id !== id));
}

// ============================================
// BUDGETS
// ============================================
export function getBudgets(): Budget[] {
  const budgets = getItem<Budget[]>(STORAGE_KEYS.budgets, []);
  const txs = getItem<Transaction[]>(STORAGE_KEYS.transactions, []);
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  return budgets.map(b => {
    const spent = txs
      .filter(t => t.type === 'expense' && t.date >= firstOfMonth && (!b.category_id || t.category_id === b.category_id))
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...b, spent };
  });
}

export function addBudget(data: { category_id: string; amount: number; period: string }): Budget {
  const budgets = getItem<Budget[]>(STORAGE_KEYS.budgets, []);
  const now = new Date();
  const budget: Budget = {
    id: generateId('budget'),
    user_id: 'user',
    category_id: data.category_id || null as unknown as string,
    amount: data.amount,
    period: data.period as Budget['period'],
    start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    end_date: null,
    created_at: new Date().toISOString(),
  };
  budgets.push(budget);
  setItem(STORAGE_KEYS.budgets, budgets);
  return budget;
}

export function deleteBudget(id: string): void {
  const budgets = getItem<Budget[]>(STORAGE_KEYS.budgets, []);
  setItem(STORAGE_KEYS.budgets, budgets.filter(b => b.id !== id));
}

// ============================================
// DASHBOARD
// ============================================
export function getDashboardData(): DashboardData {
  const txs = getItem<Transaction[]>(STORAGE_KEYS.transactions, []);
  const wallets = getWallets();
  const now = new Date();

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const firstOfYear = `${now.getFullYear()}-01-01`;

  // Calculate week start (Monday)
  const dayOfWeek = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const monthExpenses = txs.filter(t => t.type === 'expense' && t.date >= firstOfMonth);
  const monthIncome = txs.filter(t => t.type === 'income' && t.date >= firstOfMonth);
  const weekExpenses = txs.filter(t => t.type === 'expense' && t.date >= weekStartStr);
  const yearExpenses = txs.filter(t => t.type === 'expense' && t.date >= firstOfYear);

  // Weekly spending by day
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklySpending = days.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const amount = txs.filter(t => t.type === 'expense' && t.date === dateStr).reduce((s, t) => s + t.amount, 0);
    return { day, amount };
  });

  // Category breakdown
  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number }>();
  for (const t of monthExpenses) {
    const key = t.category_id || 'other';
    const existing = catMap.get(key);
    if (existing) {
      existing.amount += t.amount;
    } else {
      catMap.set(key, { name: t.category_name || 'Other', icon: t.category_icon || '📦', color: t.category_color || '#6B7280', amount: t.amount });
    }
  }
  const totalMonthExpense = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const categoryBreakdown = Array.from(catMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map(c => ({ ...c, percentage: totalMonthExpense > 0 ? Math.round((c.amount / totalMonthExpense) * 100) : 0 }));

  // Recent transactions
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

  return {
    totalBalance,
    totalIncome: monthIncome.reduce((s, t) => s + t.amount, 0),
    totalExpenses: totalMonthExpense,
    weeklySpending,
    monthlySpending: totalMonthExpense,
    recentTransactions: sorted.slice(0, 10),
    categoryBreakdown,
    thisWeek: weekExpenses.reduce((s, t) => s + t.amount, 0),
    thisMonth: totalMonthExpense,
    thisYear: yearExpenses.reduce((s, t) => s + t.amount, 0),
  };
}

// ============================================
// ANALYTICS
// ============================================
export function getAnalyticsData(): AnalyticsData {
  const txs = getItem<Transaction[]>(STORAGE_KEYS.transactions, []);
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const monthExpenses = txs.filter(t => t.type === 'expense' && t.date >= firstOfMonth);
  const totalMonthExpense = monthExpenses.reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();
  for (const t of monthExpenses) {
    const key = t.category_id || 'other';
    const existing = catMap.get(key);
    if (existing) {
      existing.amount += t.amount;
      existing.count += 1;
    } else {
      catMap.set(key, { name: t.category_name || 'Other', icon: t.category_icon || '📦', color: t.category_color || '#6B7280', amount: t.amount, count: 1 });
    }
  }

  const categoryBreakdown = Array.from(catMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map(c => ({ ...c, percentage: totalMonthExpense > 0 ? Math.round((c.amount / totalMonthExpense) * 100) : 0 }));

  // Weekly trend (last 4 weeks)
  const weeklyTrend = [];
  for (let w = 3; w >= 0; w--) {
    const start = new Date(now);
    start.setDate(now.getDate() - (w + 1) * 7);
    const end = new Date(now);
    end.setDate(now.getDate() - w * 7);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    const amount = txs.filter(t => t.type === 'expense' && t.date >= startStr && t.date < endStr).reduce((s, t) => s + t.amount, 0);
    weeklyTrend.push({ week: `W${4 - w}`, amount });
  }

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const income = txs.filter(t => t.type === 'income' && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense' && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0);
    monthlyTrend.push({ month: d.toLocaleDateString('en', { month: 'short' }), income, expense });
  }

  const topCat = categoryBreakdown.length > 0 ? categoryBreakdown[0].name : 'N/A';

  return {
    totalTransactions: monthExpenses.length,
    dailyAverage: totalMonthExpense / Math.max(now.getDate(), 1),
    topCategory: topCat,
    categoryBreakdown,
    weeklyTrend,
    monthlyTrend,
  };
}

// ============================================
// PROP FIRMS
// ============================================
export function getPropFirmsData() {
  const firms = getItem<PropFirm[]>(STORAGE_KEYS.propFirms, []);
  const pfTxs = getItem<PropFirmTransaction[]>(STORAGE_KEYS.propFirmTxs, []);

  const enrichedFirms = firms.map(firm => {
    const firmTxs = pfTxs.filter(t => t.firm_id === firm.id);
    const totalSpent = firmTxs.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0);
    const totalPayout = firmTxs.filter(t => t.type === 'payout').reduce((s, t) => s + t.amount, 0);
    return { ...firm, total_spent: totalSpent, total_payout: totalPayout, net_pnl: totalPayout - totalSpent };
  });

  const totalSpent = pfTxs.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0);
  const totalPayout = pfTxs.filter(t => t.type === 'payout').reduce((s, t) => s + t.amount, 0);

  const txsWithFirm = pfTxs
    .map(t => ({ ...t, firm_name: firms.find(f => f.id === t.firm_id)?.name || 'Unknown' }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    firms: enrichedFirms,
    summary: {
      totalSpent,
      totalPayout,
      netPnL: totalPayout - totalSpent,
      totalFirms: firms.length,
      activeFirms: firms.filter(f => f.status === 'active').length,
      passedFirms: firms.filter(f => f.status === 'passed').length,
      failedFirms: firms.filter(f => f.status === 'failed').length,
    },
    transactions: txsWithFirm,
  };
}

export function addPropFirm(data: { name: string; status?: string; account_size?: string; challenge_type?: string; notes?: string }): PropFirm {
  const firms = getItem<PropFirm[]>(STORAGE_KEYS.propFirms, []);
  const firm: PropFirm = {
    id: generateId('pf'),
    user_id: 'user',
    name: data.name,
    status: (data.status || 'active') as PropFirm['status'],
    account_size: data.account_size || null,
    challenge_type: data.challenge_type || null,
    notes: data.notes || null,
    created_at: new Date().toISOString(),
  };
  firms.push(firm);
  setItem(STORAGE_KEYS.propFirms, firms);
  return firm;
}

export function updatePropFirmStatus(firmId: string, status: string): void {
  const firms = getItem<PropFirm[]>(STORAGE_KEYS.propFirms, []);
  const idx = firms.findIndex(f => f.id === firmId);
  if (idx !== -1) {
    firms[idx].status = status as PropFirm['status'];
    setItem(STORAGE_KEYS.propFirms, firms);
  }
}

export function deletePropFirm(firmId: string): void {
  const firms = getItem<PropFirm[]>(STORAGE_KEYS.propFirms, []);
  const pfTxs = getItem<PropFirmTransaction[]>(STORAGE_KEYS.propFirmTxs, []);
  setItem(STORAGE_KEYS.propFirms, firms.filter(f => f.id !== firmId));
  setItem(STORAGE_KEYS.propFirmTxs, pfTxs.filter(t => t.firm_id !== firmId));
}

export function addPropFirmTransaction(data: { firm_id: string; type: string; amount: number; note?: string; date: string }): PropFirmTransaction {
  const txs = getItem<PropFirmTransaction[]>(STORAGE_KEYS.propFirmTxs, []);
  const tx: PropFirmTransaction = {
    id: generateId('pftx'),
    user_id: 'user',
    firm_id: data.firm_id,
    type: data.type as 'spend' | 'payout',
    amount: data.amount,
    note: data.note || null,
    date: data.date,
    created_at: new Date().toISOString(),
  };
  txs.push(tx);
  setItem(STORAGE_KEYS.propFirmTxs, txs);
  return tx;
}

export function deletePropFirmTransaction(txId: string): void {
  const txs = getItem<PropFirmTransaction[]>(STORAGE_KEYS.propFirmTxs, []);
  setItem(STORAGE_KEYS.propFirmTxs, txs.filter(t => t.id !== txId));
}
