import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  const query = supabase
    .from('comments')
    .select('*, author:users(name, avatarUrl)')
    .order('createdAt', { ascending: false });

  if (postId) {
    query.eq('postId', postId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      content: body.content,
      postId: body.postId,
      userId: body.userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
