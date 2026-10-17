import { defineStore } from 'pinia';
import { environmentService } from '../services/environmentService.js';
import { getRepository, COLLECTIONS } from '../repositories/index.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';

export const useEnvironmentStore = defineStore('environment', {
  state: () => ({
    bankParameters: null,
    branches: [],
    pendingAuthorisationCount: 0,
    lastTransactionResponse: null,
    currentOperationCode: null,
  }),
  getters: {
    businessDate: (state) => state.bankParameters?.businessDate ?? '-',
    businessDateStatus: (state) => state.bankParameters?.businessDateStatus ?? '-',
    bankName: (state) => state.bankParameters?.bankName ?? 'Training Bank (Fictional)',
  },
  actions: {
    async load() {
      this.bankParameters = await environmentService.getBankParameters();
      this.branches = await environmentService.listBranches();
      await this.refreshPendingCount();
    },
    async refreshPendingCount() {
      const requests = await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).count(
        (r) => r.status === WORKFLOW_STATUS.PENDING_AUTHORISATION,
      );
      const transactions = await getRepository(COLLECTIONS.TRANSACTIONS).count(
        (t) => t.status === WORKFLOW_STATUS.PENDING_AUTHORISATION,
      );
      this.pendingAuthorisationCount = requests + transactions;
    },
    setLastTransactionResponse(response) {
      this.lastTransactionResponse = response;
    },
    setCurrentOperation(code) {
      this.currentOperationCode = code;
    },
  },
});
