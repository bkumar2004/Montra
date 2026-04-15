import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'syncspend.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'cash',
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      icon TEXT DEFAULT 'wallet',
      color TEXT DEFAULT '#000000',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      category_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS prop_firms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'passed', 'failed', 'payout')),
      account_size TEXT,
      challenge_type TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prop_firm_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      firm_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('spend', 'payout')),
      amount REAL NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (firm_id) REFERENCES prop_firms(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
    CREATE INDEX IF NOT EXISTS idx_prop_firms_user ON prop_firms(user_id);
    CREATE INDEX IF NOT EXISTS idx_prop_firm_tx_user ON prop_firm_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_prop_firm_tx_firm ON prop_firm_transactions(firm_id);
  `);

  // Seed default categories if none exist
  const count = database.prepare('SELECT COUNT(*) as c FROM categories WHERE is_default = 1').get() as { c: number };
  if (count.c === 0) {
    const insert = database.prepare('INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES (?, NULL, ?, ?, ?, ?, 1)');
    const defaults = [
      ['cat_food', 'Food & Drinks', '🍔', '#FF6B6B', 'expense'],
      ['cat_transport', 'Transport', '🚗', '#4ECDC4', 'expense'],
      ['cat_shopping', 'Shopping', '🛍️', '#A78BFA', 'expense'],
      ['cat_bills', 'Bills & Fees', '📄', '#F59E0B', 'expense'],
      ['cat_entertainment', 'Entertainment', '🎬', '#EC4899', 'expense'],
      ['cat_health', 'Health', '💊', '#10B981', 'expense'],
      ['cat_education', 'Education', '📚', '#3B82F6', 'expense'],
      ['cat_groceries', 'Groceries', '🛒', '#8B5CF6', 'expense'],
      ['cat_subscriptions', 'Subscriptions', '🔄', '#F97316', 'expense'],
      ['cat_travel', 'Travel', '✈️', '#06B6D4', 'expense'],
      ['cat_gifts', 'Gifts', '🎁', '#D946EF', 'expense'],
      ['cat_other_exp', 'Other', '📦', '#6B7280', 'expense'],
      ['cat_salary', 'Salary', '💰', '#22C55E', 'income'],
      ['cat_freelance', 'Freelance', '💻', '#3B82F6', 'income'],
      ['cat_investments', 'Investments', '📈', '#10B981', 'income'],
      ['cat_other_inc', 'Other Income', '💵', '#6B7280', 'income'],
    ];
    const insertMany = database.transaction(() => {
      for (const d of defaults) {
        insert.run(d[0], d[1], d[2], d[3], d[4]);
      }
    });
    insertMany();
  }

  // Create a demo user if none exists
  const userCount = database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('demo123', 10);
    database.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(
      'user_demo',
      'demo@syncspend.app',
      'Demo User',
      hash
    );
    // Create default wallets
    database.prepare('INSERT INTO wallets (id, user_id, name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'wallet_cash', 'user_demo', 'Cash', 'cash', 2450.00, '💵', '#22C55E'
    );
    database.prepare('INSERT INTO wallets (id, user_id, name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'wallet_bank', 'user_demo', 'Bank Account', 'bank', 12840.50, '🏦', '#3B82F6'
    );
    database.prepare('INSERT INTO wallets (id, user_id, name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'wallet_crypto', 'user_demo', 'Crypto', 'crypto', 3200.00, '₿', '#F59E0B'
    );

    // Create demo budget
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    database.prepare('INSERT INTO budgets (id, user_id, category_id, amount, period, start_date) VALUES (?, ?, ?, ?, ?, ?)').run(
      'budget_monthly', 'user_demo', null, 3000, 'monthly', firstOfMonth
    );

    // Seed demo transactions
    const txInsert = database.prepare(
      'INSERT INTO transactions (id, user_id, wallet_id, category_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const demoTxs = [
      ['tx_1', 'user_demo', 'wallet_bank', 'cat_subscriptions', 'expense', 20.98, 'Spotify', '2026-04-14'],
      ['tx_2', 'user_demo', 'wallet_cash', 'cat_groceries', 'expense', 56.80, 'Groceries', '2026-04-14'],
      ['tx_3', 'user_demo', 'wallet_bank', 'cat_transport', 'expense', 26.40, 'Uber', '2026-04-13'],
      ['tx_4', 'user_demo', 'wallet_cash', 'cat_food', 'expense', 16.20, 'Dining out', '2026-04-13'],
      ['tx_5', 'user_demo', 'wallet_bank', 'cat_salary', 'income', 4500.00, 'Monthly Salary', '2026-04-01'],
      ['tx_6', 'user_demo', 'wallet_bank', 'cat_bills', 'expense', 89.99, 'Electric Bill', '2026-04-10'],
      ['tx_7', 'user_demo', 'wallet_cash', 'cat_shopping', 'expense', 145.50, 'New shoes', '2026-04-09'],
      ['tx_8', 'user_demo', 'wallet_bank', 'cat_entertainment', 'expense', 35.00, 'Movie tickets', '2026-04-08'],
      ['tx_9', 'user_demo', 'wallet_bank', 'cat_health', 'expense', 25.00, 'Pharmacy', '2026-04-07'],
      ['tx_10', 'user_demo', 'wallet_crypto', 'cat_investments', 'income', 320.00, 'Crypto gains', '2026-04-06'],
      ['tx_11', 'user_demo', 'wallet_cash', 'cat_food', 'expense', 42.30, 'Restaurant', '2026-04-05'],
      ['tx_12', 'user_demo', 'wallet_bank', 'cat_subscriptions', 'expense', 14.99, 'Netflix', '2026-04-04'],
      ['tx_13', 'user_demo', 'wallet_bank', 'cat_freelance', 'income', 800.00, 'Freelance project', '2026-04-03'],
      ['tx_14', 'user_demo', 'wallet_cash', 'cat_transport', 'expense', 55.00, 'Gas', '2026-04-02'],
      ['tx_15', 'user_demo', 'wallet_bank', 'cat_education', 'expense', 29.99, 'Udemy course', '2026-04-01'],
      ['tx_16', 'user_demo', 'wallet_cash', 'cat_groceries', 'expense', 78.45, 'Weekly groceries', '2026-03-30'],
      ['tx_17', 'user_demo', 'wallet_bank', 'cat_bills', 'expense', 120.00, 'Internet bill', '2026-03-28'],
      ['tx_18', 'user_demo', 'wallet_bank', 'cat_gifts', 'expense', 65.00, 'Birthday gift', '2026-03-25'],
    ];
    const insertTxs = database.transaction(() => {
      for (const tx of demoTxs) {
        txInsert.run(...tx);
      }
    });
    insertTxs();

    // Seed demo prop firms
    database.prepare(
      'INSERT INTO prop_firms (id, user_id, name, status, account_size, challenge_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('pf_1', 'user_demo', 'FTMO', 'passed', '$100K', 'Challenge', 'Passed phase 1 & 2');
    database.prepare(
      'INSERT INTO prop_firms (id, user_id, name, status, account_size, challenge_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('pf_2', 'user_demo', 'MyFundedFX', 'active', '$50K', 'Evaluation', 'Phase 1 in progress');
    database.prepare(
      'INSERT INTO prop_firms (id, user_id, name, status, account_size, challenge_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('pf_3', 'user_demo', 'The5ers', 'failed', '$40K', 'Instant', 'Hit max drawdown');

    // Seed demo prop firm transactions
    const pfTxInsert = database.prepare(
      'INSERT INTO prop_firm_transactions (id, user_id, firm_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const pfTxs = [
      ['pftx_1', 'user_demo', 'pf_1', 'spend', 15000, 'FTMO Challenge Fee', '2026-01-15'],
      ['pftx_2', 'user_demo', 'pf_1', 'payout', 45000, 'First Payout', '2026-03-01'],
      ['pftx_3', 'user_demo', 'pf_1', 'payout', 32000, 'Second Payout', '2026-04-01'],
      ['pftx_4', 'user_demo', 'pf_2', 'spend', 8500, 'MyFundedFX Eval Fee', '2026-03-20'],
      ['pftx_5', 'user_demo', 'pf_3', 'spend', 12000, 'The5ers Challenge Fee', '2026-02-10'],
    ];
    const insertPfTxs = database.transaction(() => {
      for (const tx of pfTxs) {
        pfTxInsert.run(...tx);
      }
    });
    insertPfTxs();
  }
}

export default getDb;
