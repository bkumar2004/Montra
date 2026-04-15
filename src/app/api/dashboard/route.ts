import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const userId = 'user_demo'; // Will be replaced with auth

    // Total balance across all wallets
    const balanceRow = db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM wallets WHERE user_id = ?').get(userId) as { total: number };
    const totalBalance = balanceRow.total;

    // Current month boundaries
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

    // Total income & expenses this month
    const incomeRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?'
    ).get(userId, 'income', firstOfMonth, lastOfMonth) as { total: number };

    const expenseRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?'
    ).get(userId, 'expense', firstOfMonth, lastOfMonth) as { total: number };

    // Weekly spending (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySpending = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const row = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date = ?'
      ).get(userId, 'expense', dateStr) as { total: number };
      weeklySpending.push({ day: days[d.getDay()], amount: row.total });
    }

    // This week total
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const thisWeekRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ?'
    ).get(userId, 'expense', startOfWeek.toISOString().split('T')[0]) as { total: number };

    // This year total
    const firstOfYear = `${now.getFullYear()}-01-01`;
    const thisYearRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ?'
    ).get(userId, 'expense', firstOfYear) as { total: number };

    // Recent transactions
    const recentTransactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, w.name as wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `).all(userId);

    // Category breakdown this month
    const categoryBreakdown = db.prepare(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) as amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
    `).all(userId, firstOfMonth, lastOfMonth) as { name: string; icon: string; color: string; amount: number }[];

    const totalCatExpense = categoryBreakdown.reduce((s, c) => s + c.amount, 0);
    const categoryWithPct = categoryBreakdown.map(c => ({
      ...c,
      percentage: totalCatExpense > 0 ? Math.round((c.amount / totalCatExpense) * 100) : 0,
    }));

    return NextResponse.json({
      totalBalance,
      totalIncome: incomeRow.total,
      totalExpenses: expenseRow.total,
      weeklySpending,
      monthlySpending: expenseRow.total,
      recentTransactions,
      categoryBreakdown: categoryWithPct,
      thisWeek: thisWeekRow.total,
      thisMonth: expenseRow.total,
      thisYear: thisYearRow.total,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
