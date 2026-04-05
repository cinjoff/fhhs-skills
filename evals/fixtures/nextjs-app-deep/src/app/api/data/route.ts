import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || 'analytics';
  const limit = searchParams.get('limit') || '100';

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(parseInt(limit));

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    count: data.length,
  });
}
