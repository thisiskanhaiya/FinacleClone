import { getRepository, COLLECTIONS, sessionStorageAdapter, localStorageAdapter } from '../repositories/index.js';
import { createSession } from '../domain/models/session.js';
import { validateCredentials } from '../domain/validators/credentialsValidator.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { nextId } from '../utils/id.js';
import { PermissionError, ValidationError } from '../utils/errors.js';

const SESSION_ID = 'current';

/**
 * AuthService - demo authentication for the training environment.
 *
 * Passwords are stored in seed data in plain text BY DESIGN for this local,
 * fictional training tool (documented limitation in README). Sessions live
 * in sessionStorage: they survive refresh, not a tab close.
 */
export class AuthService {
  constructor(adapter = localStorageAdapter, sessionAdapter = sessionStorageAdapter) {
    this.employees = getRepository(COLLECTIONS.EMPLOYEES, adapter);
    this.sessions = getRepository('sessions', sessionAdapter);
  }

  async _createSession(employee, via) {
    const businessDate = await environmentService.getBusinessDate();
    const session = createSession({
      id: nextId('SES'),
      username: employee.username,
      displayName: employee.displayName,
      role: employee.role,
      branch: employee.branch,
      businessDate,
      via,
    });
    await this.sessions.replaceAll([session]);
    return session;
  }

  async login(username, password) {
    const { valid, errors } = validateCredentials({ username, password });
    if (!valid) throw new ValidationError('Enter username and password.', errors);

    const employee = await this.employees.findOneWhere(
      (e) => e.username.toLowerCase() === String(username).trim().toLowerCase(),
    );
    if (!employee || employee.password !== password) {
      await recordAudit({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        entityType: 'SESSION',
        performedBy: String(username).trim(),
        result: 'FAILURE',
        details: { reason: employee ? 'INVALID_PASSWORD' : 'UNKNOWN_USER' },
      });
      throw new ValidationError('Invalid username or password.');
    }
    if (employee.status !== 'ACTIVE') {
      await recordAudit({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        entityType: 'SESSION',
        performedBy: employee.username,
        performedByRole: employee.role,
        result: 'FAILURE',
        details: { reason: 'USER_INACTIVE' },
      });
      throw new ValidationError('This demo user is inactive.');
    }

    const session = await this._createSession(employee, 'LOGIN');
    await recordAudit({
      action: AUDIT_ACTIONS.LOGIN,
      entityType: 'SESSION',
      entityId: session.id,
      performedBy: employee.username,
      performedByRole: employee.role,
      branch: employee.branch,
      details: { via: 'LOGIN' },
    });
    return session;
  }

  async logout(reason = 'USER_LOGOUT') {
    const session = await this.getCurrentSession();
    if (session) {
      await recordAudit({
        action: AUDIT_ACTIONS.LOGOUT,
        entityType: 'SESSION',
        entityId: session.id,
        performedBy: session.username,
        performedByRole: session.role,
        branch: session.branch,
        details: { reason },
      });
    }
    await this.sessions.clear();
  }

  /**
   * Development-only demo user switch. Ends the current session with an
   * audited logout, then creates a fully new, audited session for the
   * target demo user. Role checking is NOT bypassed: the new session
   * simply carries the target user's own role.
   */
  async switchDemoUser(targetUsername) {
    const target = await this.employees.findOneWhere(
      (e) => e.username.toLowerCase() === String(targetUsername).trim().toLowerCase(),
    );
    if (!target || !target.isDemo) {
      throw new ValidationError('Switch Demo User only works with the fictional demo users.');
    }
    const previous = await this.getCurrentSession();
    if (previous) {
      await recordAudit({
        action: AUDIT_ACTIONS.SESSION_SWITCH,
        entityType: 'SESSION',
        entityId: previous.id,
        performedBy: previous.username,
        performedByRole: previous.role,
        branch: previous.branch,
        details: { from: previous.username, to: target.username },
      });
    }
    await this.sessions.clear();
    const session = await this._createSession(target, 'SWITCH');
    await recordAudit({
      action: AUDIT_ACTIONS.LOGIN,
      entityType: 'SESSION',
      entityId: session.id,
      performedBy: target.username,
      performedByRole: target.role,
      branch: target.branch,
      details: { via: 'SWITCH', from: previous?.username ?? null },
    });
    return session;
  }

  async getCurrentSession() {
    const sessions = await this.sessions.findAll();
    return sessions[0] ?? null;
  }

  async requireSession() {
    const session = await this.getCurrentSession();
    if (!session) throw new PermissionError('No active session. Please log in.');
    return session;
  }
}

export const authService = new AuthService();
export { SESSION_ID };
