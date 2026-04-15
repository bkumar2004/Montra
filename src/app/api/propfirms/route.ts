import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const userId = 'user_demo';

    const firms = db.prepare('SELECT * FROM prop_firms WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];

    // Enrich with totals
    const enriched = firms.map(firm => {
      const spentRow = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM prop_firm_transactions WHERE user_id = ? AND firm_id = ? AND type = ?'
      ).get(userId, firm.id, 'spend') as { total: number };

      const payoutRow = db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM prop_firm_transactions WHERE user_id = ? AND firm_id = ? AND type = ?'
      ).get(userId, firm.id, 'payout') as { total: number };

      return {
        ...firm,
        total_spent: spentRow.total,
        total_payout: payoutRow.total,
        net_pnl: payoutRow.total - spentRow.total,
      };
    });

    // Overall summary
    const totalSpentRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM prop_firm_transactions WHERE user_id = ? AND type = ?'
    ).get(userId, 'spend') as { total: number };

    const totalPayoutRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM prop_firm_transactions WHERE user_id = ? AND type = ?'
    ).get(userId, 'payout') as { total: number };

    // Recent prop firm transactions
    const recentTxs = db.prepare(`
      SELECT pft.*, pf.name as firm_name
      FROM prop_firm_transactions pft
      JOIN prop_firms pf ON pft.firm_id = pf.id
      WHERE pft.user_id = ?
      ORDER BY pft.date DESC, pft.created_at DESC
      LIMIT 50
    `).all(userId);

    return NextResponse.json({
      firms: enriched,
      summary: {
        totalSpent: totalSpentRow.total,
        totalPayout: totalPayoutRow.total,
        netPnL: totalPayoutRow.total - totalSpentRow.total,
        totalFirms: firms.length,
        activeFirms: firms.filter((f: any) => f.status === 'active').length,
        passedFirms: firms.filter((f: any) => f.status === 'passed').length,
        failedFirms: firms.filter((f: any) => f.status === 'failed').length,
      },
      transactions: recentTxs,
    });
  } catch (error) {
    console.error('Prop firms GET error:', error);
    return NextResponse.json({ error: 'Failed to load prop firms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const body = await request.json();
    const { action } = body;

    if (action === 'add_firm') {
      const { name, status, account_size, challenge_type, notes } = body;
      if (!name) return NextResponse.json({ error: 'Firm name is required' }, { status: 400 });

      const id = `pf_${uuidv4().substring(0, 8)}`;
      db.prepare(
        'INSERT INTO prop_firms (id, user_id, name, status, account_size, challenge_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, userId, name, status || 'active', account_size || null, challenge_type || null, notes || null);

      return NextResponse.json({ id, success: true }, { status: 201 });
    }

    if (action === 'add_transaction') {
      const { firm_id, type, amount, note, date } = body;
      if (!firm_id || !type || !amount || !date) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const id = `pftx_${uuidv4().substring(0, 8)}`;
      db.prepare(
        'INSERT INTO prop_firm_transactions (id, user_id, firm_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, userId, firm_id, type, amount, note || null, date);

      return NextResponse.json({ id, success: true }, { status: 201 });
    }

    if (action === 'update_firm_status') {
      const { firm_id, status } = body;
      if (!firm_id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

      db.prepare('UPDATE prop_firms SET status = ? WHERE id = ? AND user_id = ?').run(status, firm_id, userId);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_firm') {
      const { firm_id } = body;
      if (!firm_id) return NextResponse.json({ error: 'Firm ID required' }, { status: 400 });

      db.prepare('DELETE FROM prop_firm_transactions WHERE firm_id = ? AND user_id = ?').run(firm_id, userId);
      db.prepare('DELETE FROM prop_firms WHERE id = ? AND user_id = ?').run(firm_id, userId);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_transaction') {
      const { transaction_id } = body;
      if (!transaction_id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });

      db.prepare('DELETE FROM prop_firm_transactions WHERE id = ? AND user_id = ?').run(transaction_id, userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Prop firms POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
