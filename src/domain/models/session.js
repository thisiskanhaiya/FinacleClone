/**
 * Session factory. Sessions live in sessionStorage only, so a browser
 * refresh keeps the session but closing the tab ends it.
 */
export function createSession({
  id,
  username,
  displayName,
  role,
  branch,
  businessDate,
  loginAt = new Date().toISOString(),
  via = 'LOGIN',
}) {
  return {
    id,
    username,
    displayName,
    role,
    branch,
    businessDate,
    loginAt,
    via,
  };
}
