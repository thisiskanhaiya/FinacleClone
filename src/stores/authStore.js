import { defineStore } from 'pinia';
import { authService } from '../services/authService.js';
import { hasCapability, canAccessOperation, isReadOnlyRole } from '../domain/rules/permissionRules.js';
import { getOperation } from '../data/operationSpecifications/operations.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null,
    restored: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.session),
    username: (state) => state.session?.username ?? null,
    displayName: (state) => state.session?.displayName ?? null,
    role: (state) => state.session?.role ?? null,
    branch: (state) => state.session?.branch ?? null,
    isReadOnly: (state) => (state.session ? isReadOnlyRole(state.session.role) : true),
  },
  actions: {
    /** Restore the session from sessionStorage (survives browser refresh). */
    async restore() {
      if (this.restored) return;
      this.session = await authService.getCurrentSession();
      this.restored = true;
    },
    async login(username, password) {
      this.session = await authService.login(username, password);
      this.restored = true;
      return this.session;
    },
    async logout(reason) {
      await authService.logout(reason);
      this.session = null;
    },
    async switchDemoUser(username) {
      this.session = await authService.switchDemoUser(username);
      return this.session;
    },
    hasCapability(capability) {
      return this.session ? hasCapability(this.session.role, capability) : false;
    },
    canAccessOperationCode(code) {
      if (!this.session) return false;
      const operation = getOperation(code);
      return canAccessOperation(this.session.role, operation);
    },
  },
});
