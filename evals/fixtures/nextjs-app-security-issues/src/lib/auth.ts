import jwt from 'jsonwebtoken';

// VULNERABILITY: Hardcoded JWT secret in source code
const JWT_SECRET = 'super-secret-key-do-not-share-2024';

const REFRESH_SECRET = 'refresh-secret-key-also-hardcoded';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// VULNERABILITY: Storing session data in localStorage (accessible to XSS)
export function saveSession(accessToken: string, refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('session_data', JSON.stringify({
      loggedIn: true,
      lastActivity: Date.now(),
    }));
  }
}

export function getSession(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === 'undefined') return null;

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_data');
  }
}
