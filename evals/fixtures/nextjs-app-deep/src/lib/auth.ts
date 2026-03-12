import jwt from 'jsonwebtoken';

const JWT_SECRET = 'acme-dashboard-secret-2024';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  return decoded;
}

export function refreshAccessToken(refreshToken: string): string {
  const payload = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function saveSession(accessToken: string, refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
}

export function getSession() {
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
  }
}
