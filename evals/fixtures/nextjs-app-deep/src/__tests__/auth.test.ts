import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '@/lib/auth';

describe('auth', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  };

  it('should generate a valid JWT token', () => {
    const token = signToken(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid token and return payload', () => {
    const token = signToken(mockPayload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  it('should include standard JWT claims', () => {
    const token = signToken(mockPayload);
    const decoded = verifyToken(token);

    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
    expect(decoded).toHaveProperty('role');
  });
});
