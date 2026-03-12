import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // VULNERABILITY: SQL injection via string concatenation
  const query = `SELECT * FROM users WHERE id = ${id}`;
  const result = await pool.query(query);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, role } = body;

  // VULNERABILITY: SQL injection via template literal interpolation
  const query = `INSERT INTO users (name, email, role) VALUES ('${name}', '${email}', '${role}') RETURNING *`;
  const result = await pool.query(query);

  return NextResponse.json(result.rows[0], { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // VULNERABILITY: No authorization check — any user can delete any user
  const query = `DELETE FROM users WHERE id = ${id}`;
  await pool.query(query);

  return NextResponse.json({ success: true });
}
