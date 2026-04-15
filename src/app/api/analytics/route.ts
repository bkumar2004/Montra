import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

    // Category breakdown this month
    const categoryBreakdown = db.prepare(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) as amount, COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
    `).all(userId, firstOfMonth, lastOfMonth) as any[];

    const totalCatExpense = categoryBreakdown.reduce((s: number, c: any) => s + c.amount, 0);
    const categoryWithPct = categoryBreakdown.map((c: any) => ({
      ...c,
      percentage: totalCatExpense > 0 ? Math.round((c.amount / totalCatExpense) * 100) : 0,
    }));

    // Weekly trend (last 8 weeks)
    const weeklyTrend = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const row = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?'
      ).get(userId, 'expense', weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]) as { total: number };
      weeklyTrend.push({
        week: `W${8 - i}`,
        amount: row.total,
      });
    }

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const incRow = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?'
      ).get(userId, 'income', monthStart, monthEnd) as { total: number };

      const expRow = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?'
      ).get(userId, 'expense', monthStart, monthEnd) as { total: number };

      monthlyTrend.push({
        month: months[d.getMonth()],
        income: incRow.total,
        expense: expRow.total,
      });
    }

    // Daily average this month
    const daysInMonth = now.getDate();
    const dailyAverage = totalCatExpense > 0 ? totalCatExpense / daysInMonth : 0;

    // Top category
    const topCategory = categoryWithPct.length > 0 ? categoryWithPct[0].name : 'None';

    // Total transactions this month
    const txCountRow = db.prepare(
      'SELECT COUNT(*) as c FROM transactions WHERE user_id = ? AND date >= ? AND date <= ?'
    ).get(userId, firstOfMonth, lastOfMonth) as { c: number };

    return NextResponse.json({
      categoryBreakdown: categoryWithPct,
      weeklyTrend,
      monthlyTrend,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      topCategory,
      totalTransactions: txCountRow.c,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
