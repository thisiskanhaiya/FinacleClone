import employees from './employees.json';
import customers from './customers.json';
import accounts from './accounts.json';
import products from './products.json';
import branches from './branches.json';
import bankParameters from './bankParameters.json';
import glAccounts from './glAccounts.json';
import termDeposits from './termDeposits.json';
import loans from './loans.json';
import transactions from './transactions.json';
import integrationMessages from './integrationMessages.json';

export const SEED_VERSION = '1.0.0';

/**
 * Seed manifest: collection name -> seed rows. The seed loader writes each
 * collection into localStorage on first boot and on environment reset.
 * All data is fictional training data.
 */
export const SEED_FILES = Object.freeze({
  employees,
  customers,
  accounts,
  products,
  branches,
  bankParameters,
  glAccounts,
  termDeposits,
  loans,
  transactions,
  integrationMessages,
});

/** Runtime collections that must exist but start empty on reset. */
export const EMPTY_COLLECTIONS = Object.freeze([
  'standingInstructions',
  'transactionLegs',
  'journals',
  'journalLines',
  'authorisationRequests',
  'tellerSessions',
  'exceptions',
  'auditEvents',
  'notifications',
  'receipts',
  'trainingProgress',
]);
