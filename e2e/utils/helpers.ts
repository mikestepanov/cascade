/**
 * Generate a consistent test email address that complies with backend validation
 * Format: e2e-test-{timestamp}@inbox.mailtrap.io
 *
 * Note: The domain @inbox.mailtrap.io is used as a tag for the backend
 * to identify test users and bypass real email sending.
 * We do NOT use the Mailtrap service itself.
 */
export function getTestEmailAddress(prefix = "e2e-test"): string {
  const timestamp = Date.now();
  // Keep the domain to satisfy isTestEmail() check in backend
  return `${prefix}-${timestamp}@inbox.mailtrap.io`;
}
