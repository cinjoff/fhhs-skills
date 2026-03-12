import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// VULNERABILITY: No authentication check — endpoint is completely open
// VULNERABILITY: No CORS headers — any origin can access this data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || 'analytics';
  const limit = searchParams.get('limit') || '100';

  // VULNERABILITY: Table name from user input without validation
  const query = `SELECT * FROM ${table} LIMIT ${limit}`;
  const result = await pool.query(query);

  // No rate limiting, no pagination bounds, no auth
  return NextResponse.json({
    data: result.rows,
    count: result.rows.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // VULNERABILITY: Accepts arbitrary data without validation or sanitization
  const { table, record } = body;
  const columns = Object.keys(record).join(', ');
  const values = Object.values(record)
    .map((v) => `'${v}'`)
    .join(', ');

  const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *`;
  const result = await pool.query(query);

  return NextResponse.json(result.rows[0], { status: 201 });
}
