import { toCents } from '../../utils/money.js';

/**
 * Account opening eligibility rules. Pure functions driven by product and
 * customer parameters - no rule is hardcoded in a component.
 *
 * Rules:
 *  - customer (CIF) must exist and be ACTIVE
 *  - KYC must be COMPLETE
 *  - product must be ACTIVE
 *  - customer type must be eligible for the product category
 *    (CURRENT -> CORPORATE, SAVINGS -> RETAIL)
 *  - opening amount must meet the product minimum
 */
export function validateAccountOpening({ customer, product, openingAmount }) {
  const errors = {};

  if (!customer) {
    errors.cif = 'Customer (CIF) not found.';
  } else {
    if (customer.status !== 'ACTIVE') {
      errors.cif = `CIF ${customer.cif} is ${customer.status} - only ACTIVE customers can open accounts.`;
    }
    if (customer.kycStatus !== 'COMPLETE') {
      errors.kyc = `KYC status is ${customer.kycStatus} - complete KYC before opening an account.`;
    }
  }

  if (!product) {
    errors.productCode = 'Select a product.';
  } else if (product.status !== 'ACTIVE') {
    errors.productCode = `Product ${product.productCode} is not active.`;
  }

  if (customer && product) {
    if (product.accountCategory === 'CURRENT' && customer.type !== 'CORPORATE') {
      errors.productCode = 'Current accounts are only available to corporate customers.';
    }
    if (product.accountCategory === 'SAVINGS' && customer.type !== 'RETAIL') {
      errors.productCode = 'Savings accounts are only available to retail customers.';
    }
  }

  try {
    const cents = toCents(openingAmount);
    if (cents <= 0) {
      errors.openingAmount = 'Opening amount must be greater than zero.';
    } else if (product && cents < toCents(product.minOpeningAmount)) {
      errors.openingAmount = `Minimum opening amount for ${product.productCode} is ${product.minOpeningAmount.toFixed(2)}.`;
    }
  } catch {
    errors.openingAmount = 'Enter a valid amount (up to 2 decimal places).';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
