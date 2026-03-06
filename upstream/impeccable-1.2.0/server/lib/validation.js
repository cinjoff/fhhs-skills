// Shared validation helpers for input sanitization

// Only allow alphanumeric, hyphens, and underscores in IDs
export const VALID_ID = /^[a-zA-Z0-9_-]+$/;

export const ALLOWED_PROVIDERS = [
  'cursor', 'claude-code', 'gemini', 'codex', 'agents', 'kiro',
  'universal', 'universal-prefixed',
];
export const ALLOWED_TYPES = ['skill', 'command'];

export function isValidId(id) {
  return typeof id === 'string' && VALID_ID.test(id);
}

export function isAllowedProvider(provider) {
  return ALLOWED_PROVIDERS.includes(provider);
}

export function isAllowedType(type) {
  return ALLOWED_TYPES.includes(type);
}

// Sanitize a filename for use in Content-Disposition headers
export function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}
