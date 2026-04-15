import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare(
      'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY type, name'
    ).all('user_demo');
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
