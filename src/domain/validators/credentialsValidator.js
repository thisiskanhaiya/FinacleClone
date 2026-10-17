/**
 * Validation for the login form. Pure functions, no Vue imports.
 */
export function validateCredentials({ username, password }) {
  const errors = {};
  if (!username || !username.trim()) {
    errors.username = 'Username is required.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
