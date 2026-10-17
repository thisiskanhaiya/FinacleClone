import { getRepository, COLLECTIONS } from '../repositories/index.js';

const BANK_PARAMS_ID = 'BANK-PARAMS';

/**
 * EnvironmentService - bank/branch context: business date, branch
 * parameters, product parameters. Read-only in Phase 1; day-end and
 * parameter maintenance arrive in later phases.
 */
export class EnvironmentService {
  constructor(adapter) {
    this.bankParameters = getRepository(COLLECTIONS.BANK_PARAMETERS, adapter);
    this.branches = getRepository(COLLECTIONS.BRANCHES, adapter);
    this.products = getRepository(COLLECTIONS.PRODUCTS, adapter);
  }

  async getBankParameters() {
    return this.bankParameters.findById(BANK_PARAMS_ID);
  }

  async getBusinessDate() {
    const params = await this.getBankParameters();
    return params?.businessDate ?? null;
  }

  async getBranch(branchCode) {
    return this.branches.findById(branchCode);
  }

  async listBranches() {
    return this.branches.findAll();
  }

  async listProducts() {
    return this.products.findAll();
  }

  async getProduct(productCode) {
    return this.products.findById(productCode);
  }
}

export const environmentService = new EnvironmentService();
