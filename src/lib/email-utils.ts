const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates an e-mail address format.
 */
export function isValidEmail(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return EMAIL_REGEX.test(raw.trim());
}

/**
 * Normalizes an e-mail address (trim + lowercase).
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Extracts {{placeholder}} tokens from an HTML template.
 * Kept as a utility even though this module sends 100% static content.
 */
export function extractEmailTemplatePlaceholders(html: string): string[] {
  const matches = html.match(/\{\{\s*([^{}\s]+)\s*\}\}/g) || [];
  const names = matches.map((m) => m.replace(/[{}]/g, "").trim());
  return Array.from(new Set(names));
}
