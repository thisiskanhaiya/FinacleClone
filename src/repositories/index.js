import { localStorageAdapter } from './adapters/LocalStorageAdapter.js';
import { sessionStorageAdapter } from './adapters/SessionStorageAdapter.js';
import { CollectionRepository } from './CollectionRepository.js';

/**
 * Repository factory. Every durable collection in the training environment
 * gets a CollectionRepository bound to the local adapter. To migrate to a
 * Spring Boot backend, replace the adapter here with an HTTP adapter that
 * honours the same get/set/remove/keys contract per collection
 * (see BACKEND_MIGRATION_GUIDE.md).
 */
export const COLLECTIONS = Object.freeze({
  EMPLOYEES: 'employees',
  CUSTOMERS: 'customers',
  ACCOUNTS: 'accounts',
  PRODUCTS: 'products',
  BRANCHES: 'branches',
  BANK_PARAMETERS: 'bankParameters',
  GL_ACCOUNTS: 'glAccounts',
  TERM_DEPOSITS: 'termDeposits',
  LOANS: 'loans',
  STANDING_INSTRUCTIONS: 'standingInstructions',
  TRANSACTIONS: 'transactions',
  TRANSACTION_LEGS: 'transactionLegs',
  JOURNALS: 'journals',
  JOURNAL_LINES: 'journalLines',
  AUTHORISATION_REQUESTS: 'authorisationRequests',
  TELLER_SESSIONS: 'tellerSessions',
  INTEGRATION_MESSAGES: 'integrationMessages',
  EXCEPTIONS: 'exceptions',
  AUDIT_EVENTS: 'auditEvents',
  NOTIFICATIONS: 'notifications',
  RECEIPTS: 'receipts',
  TRAINING_PROGRESS: 'trainingProgress',
});

const repositories = new Map();

export function getRepository(collectionName, adapter = localStorageAdapter) {
  const cacheKey = `${collectionName}`;
  if (adapter === localStorageAdapter && repositories.has(cacheKey)) {
    return repositories.get(cacheKey);
  }
  const repo = new CollectionRepository(collectionName, adapter);
  if (adapter === localStorageAdapter) repositories.set(cacheKey, repo);
  return repo;
}

export const employeeRepository = getRepository(COLLECTIONS.EMPLOYEES);
export const auditRepository = getRepository(COLLECTIONS.AUDIT_EVENTS);
export const customerRepository = getRepository(COLLECTIONS.CUSTOMERS);
export const accountRepository = getRepository(COLLECTIONS.ACCOUNTS);
export const authorisationRepository = getRepository(COLLECTIONS.AUTHORISATION_REQUESTS);
export const trainingProgressRepository = getRepository(COLLECTIONS.TRAINING_PROGRESS);

/** Session repository intentionally uses sessionStorage, not localStorage. */
export const sessionRepository = new CollectionRepository('sessions', sessionStorageAdapter);

export { localStorageAdapter, sessionStorageAdapter };
