/** Domain error types shared across engines and services. */

export class PermissionError extends Error {
  constructor(message = 'Not authorised for your current role.') {
    super(message);
    this.name = 'PermissionError';
    this.code = 'NOT_AUTHORISED';
  }
}

export class ValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_FAILED';
    this.fieldErrors = fieldErrors;
  }
}

export class WorkflowError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkflowError';
    this.code = 'WORKFLOW_VIOLATION';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Record not found.') {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
  }
}

export class NotImplementedInPhaseError extends Error {
  constructor(feature, phase) {
    super(`${feature} is delivered in Phase ${phase} of the training environment build plan.`);
    this.name = 'NotImplementedInPhaseError';
    this.code = 'NOT_IN_PHASE';
    this.phase = phase;
  }
}
