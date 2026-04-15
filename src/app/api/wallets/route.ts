import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const wallets = db.prepare('SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at ASC').all(userId);
    return NextResponse.json(wallets);
  } catch (error) {
    console.error('Wallets GET error:', error);
    return NextResponse.json({ error: 'Failed to load wallets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const body = await request.json();

    const { name, type, balance, icon, color } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const id = `wallet_${uuidv4().substring(0, 8)}`;

    db.prepare(
      'INSERT INTO wallets (id, user_id, name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, name, type, balance || 0, icon || '💰', color || '#000000');

    const wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(id);
    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error('Wallet POST error:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const body = await request.json();
    const { id, name, type, balance, icon, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
    }

    db.prepare(
      'UPDATE wallets SET name = COALESCE(?, name), type = COALESCE(?, type), balance = COALESCE(?, balance), icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ? AND user_id = ?'
    ).run(name, type, balance, icon, color, id, userId);

    const wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(id);
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Wallet PUT error:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const userId = 'user_demo';
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
    }

    // Check if wallet has transactions
    const txCount = db.prepare('SELECT COUNT(*) as c FROM transactions WHERE wallet_id = ?').get(id) as { c: number };
    if (txCount.c > 0) {
      return NextResponse.json({ error: 'Cannot delete wallet with transactions' }, { status: 400 });
    }

    db.prepare('DELETE FROM wallets WHERE id = ? AND user_id = ?').run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wallet DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
  }
}
