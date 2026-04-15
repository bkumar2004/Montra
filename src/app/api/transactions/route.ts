import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, w.name as wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (type && type !== 'all') {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND t.category_id = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (t.note LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }

    // Count total
    const countQuery = query.replace(/SELECT t\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countRow = db.prepare(countQuery).get(...params) as { total: number };

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const transactions = db.prepare(query).all(...params);

    return NextResponse.json({ transactions, total: countRow.total });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const body = await request.json();

    const { wallet_id, category_id, type, amount, note, date } = body;

    if (!wallet_id || !type || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = `tx_${uuidv4().substring(0, 8)}`;

    db.prepare(
      'INSERT INTO transactions (id, user_id, wallet_id, category_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, wallet_id, category_id || null, type, amount, note || null, date);

    // Update wallet balance
    if (type === 'expense') {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ? AND user_id = ?').run(amount, wallet_id, userId);
    } else {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ? AND user_id = ?').run(amount, wallet_id, userId);
    }

    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, w.name as wallet_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.id = ?
    `).get(id);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Transaction POST error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    // Get transaction details to reverse wallet balance
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, userId) as { type: string; amount: number; wallet_id: string } | undefined;

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Reverse the balance change
    if (tx.type === 'expense') {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(tx.amount, tx.wallet_id);
    } else {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(tx.amount, tx.wallet_id);
    }

    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
