/**
 * Security Error Sanitizer & Secure Logging Utility
 *
 * Prevents sensitive information leakage (API keys, passwords, database specifics,
 * and internal filesystem absolute paths) in error messages and application logs.
 */

// Patterns matching potential sensitive credentials and internal system details
const SENSITIVE_PATTERNS = [
  // Google / Gemini API Keys (legacy AIza... and modern AQ....)
  /\bAIza[0-9A-Za-z-_]{30,45}\b/g,
  /\bAQ\.[0-9A-Za-z-_]{35,65}\b/g,
  // Generic Bearer tokens
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  // Generic API keys and secret tokens
  /\b(?:key|api[_-]?key|secret|password|token)\s*[:=]\s*["']?[A-Za-z0-9_\-]{8,}["']?/gi,
  // Windows absolute paths (e.g., E:\AI Legal Assistant\src\...)
  /[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g,
  // Unix absolute paths (/home/... or /var/...)
  /(?:\/(?:home|var|usr|etc|tmp|app|Users))(?:\/[^/\s\0]+)+/g,
];

/**
 * Sanitizes a string by stripping API keys, tokens, and absolute filesystem paths.
 */
export function sanitizeSensitiveString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECURITY_TOKEN]');
  }
  return sanitized;
}

/**
 * Creates a safe, user-facing error message.
 * For 500-level internal errors, avoids leaking internal stack traces or database errors.
 */
export function getSafeErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected internal error occurred. Please try again later.'
): string {
  if (!error) {
    return fallbackMessage;
  }

  const rawMessage = error instanceof Error ? error.message : String(error);

  // If the error message mentions common internal runtime / database / network exceptions, return generic message
  if (
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|database|prisma|knex|postgres|mongo|stack trace|at line|SyntaxError|TypeError|ReferenceError/i.test(
      rawMessage
    )
  ) {
    return fallbackMessage;
  }

  // Sanitize any potential keys or paths from operational error messages
  return sanitizeSensitiveString(rawMessage);
}

/**
 * Secure logging wrapper: ensures secrets or environment variables are not dumped
 * into stdout/stderr logs.
 */
export function safeLogError(context: string, error: unknown): void {
  const safeContext = sanitizeSensitiveString(context);
  const safeMsg = error instanceof Error ? sanitizeSensitiveString(error.message) : sanitizeSensitiveString(String(error));
  console.error(`[SECURE_LOG] ${safeContext}: ${safeMsg}`);
}
