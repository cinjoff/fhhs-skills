import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token required' }, { status: 400 });
    }

    const accessToken = refreshAccessToken(refreshToken);

    return NextResponse.json({ accessToken });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
  }
}
