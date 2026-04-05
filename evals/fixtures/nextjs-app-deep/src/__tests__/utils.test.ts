import { describe, it, expect } from 'vitest';
import { formatDate, truncateText, parseQueryString, generateId } from '@/lib/utils';

describe('formatDate', () => {
  it('should format a date string to readable format', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toBe('Jan 15, 2024');
  });

  it('should handle Date objects', () => {
    const result = formatDate(new Date('2024-06-01'));
    expect(result).toContain('2024');
  });
});

describe('truncateText', () => {
  it('should return the original text when shorter than maxLength', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('should truncate and add ellipsis when text exceeds maxLength', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });

  it('should return the text as-is when length equals maxLength', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });
});

describe('parseQueryString', () => {
  it('should parse a simple query string', () => {
    const result = parseQueryString('foo=bar&baz=qux');
    expect(result).toEqual({ foo: 'bar', baz: 'qux' });
  });

  it('should return empty object for empty string', () => {
    expect(parseQueryString('')).toEqual({});
  });

  it('should handle encoded values', () => {
    const result = parseQueryString('name=hello%20world');
    expect(result).toEqual({ name: 'hello world' });
  });
});

describe('generateId', () => {
  it('should return a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('should return unique values on successive calls', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });
});
