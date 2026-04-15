import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);

    // Calculate spent amounts
    const now = new Date();
    const enriched = (budgets as any[]).map(b => {
      let startDate: string, endDate: string;
      if (b.period === 'monthly') {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
      } else if (b.period === 'weekly') {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        startDate = start.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
      }

      let spentQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ?';
      const spentParams: (string | number)[] = [userId, 'expense', startDate, endDate];

      if (b.category_id) {
        spentQuery += ' AND category_id = ?';
        spentParams.push(b.category_id);
      }

      const spentRow = db.prepare(spentQuery).get(...spentParams) as { total: number };
      return { ...b, spent: spentRow.total };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Budgets GET error:', error);
    return NextResponse.json({ error: 'Failed to load budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const body = await request.json();
    const { category_id, amount, period } = body;

    if (!amount || !period) {
      return NextResponse.json({ error: 'Amount and period are required' }, { status: 400 });
    }

    const id = `budget_${uuidv4().substring(0, 8)}`;
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    db.prepare(
      'INSERT INTO budgets (id, user_id, category_id, amount, period, start_date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, category_id || null, amount, period, startDate);

    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(id);

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Budget POST error:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
    }

    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Budget DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
