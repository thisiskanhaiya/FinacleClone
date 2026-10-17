import { WORKFLOW_TRANSITIONS } from '../domain/workflows/requestWorkflow.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { WorkflowError } from '../utils/errors.js';

/**
 * WorkflowEngine - enforces the maker-checker state machine.
 * Pure transition logic; persistence and auditing are handled by services
 * that call this engine, which keeps the engine trivially testable.
 */
export class WorkflowEngine {
  canTransition(fromStatus, toStatus) {
    return (WORKFLOW_TRANSITIONS[fromStatus] ?? []).includes(toStatus);
  }

  allowedTransitions(fromStatus) {
    return [...(WORKFLOW_TRANSITIONS[fromStatus] ?? [])];
  }

  assertTransition(fromStatus, toStatus) {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new WorkflowError(
        `Invalid workflow transition: ${fromStatus} -> ${toStatus}.`,
      );
    }
    return true;
  }

  /** Submitting twice must not be possible for the same request record. */
  assertSubmittable(currentStatus) {
    const allowed = [WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.VALIDATED, WORKFLOW_STATUS.RESUBMITTED];
    if (!allowed.includes(currentStatus)) {
      throw new WorkflowError(
        `Request in status ${currentStatus} cannot be submitted (duplicate submission is prohibited).`,
      );
    }
    return true;
  }

  /** Approving twice must not be possible for the same request record. */
  assertDecidable(currentStatus) {
    if (currentStatus !== WORKFLOW_STATUS.PENDING_AUTHORISATION) {
      throw new WorkflowError(
        `Request in status ${currentStatus} is not awaiting authorisation (duplicate approval is prohibited).`,
      );
    }
    return true;
  }
}

export const workflowEngine = new WorkflowEngine();
