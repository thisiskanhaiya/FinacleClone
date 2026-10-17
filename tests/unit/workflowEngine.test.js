import { describe, it, expect } from 'vitest';
import { workflowEngine } from '../../src/engine/WorkflowEngine.js';
import { WORKFLOW_STATUS as S } from '../../src/domain/enums/workflowStatus.js';

describe('maker-checker workflow state machine', () => {
  it('supports the happy path DRAFT → VALIDATED → PENDING_AUTHORISATION → APPROVED → POSTED', () => {
    expect(workflowEngine.canTransition(S.DRAFT, S.VALIDATED)).toBe(true);
    expect(workflowEngine.canTransition(S.VALIDATED, S.PENDING_AUTHORISATION)).toBe(true);
    expect(workflowEngine.canTransition(S.PENDING_AUTHORISATION, S.APPROVED)).toBe(true);
    expect(workflowEngine.canTransition(S.APPROVED, S.POSTED)).toBe(true);
  });

  it('supports return-for-correction and resubmission', () => {
    expect(workflowEngine.canTransition(S.PENDING_AUTHORISATION, S.RETURNED_FOR_CORRECTION)).toBe(true);
    expect(workflowEngine.canTransition(S.RETURNED_FOR_CORRECTION, S.RESUBMITTED)).toBe(true);
    expect(workflowEngine.canTransition(S.RESUBMITTED, S.PENDING_AUTHORISATION)).toBe(true);
  });

  it('supports rejection from pending authorisation', () => {
    expect(workflowEngine.canTransition(S.PENDING_AUTHORISATION, S.REJECTED)).toBe(true);
  });

  it('supports reversal only from POSTED', () => {
    expect(workflowEngine.canTransition(S.POSTED, S.REVERSED)).toBe(true);
    expect(workflowEngine.canTransition(S.APPROVED, S.REVERSED)).toBe(false);
    expect(workflowEngine.canTransition(S.PENDING_AUTHORISATION, S.REVERSED)).toBe(false);
  });

  it('blocks illegal transitions', () => {
    expect(workflowEngine.canTransition(S.DRAFT, S.POSTED)).toBe(false);
    expect(workflowEngine.canTransition(S.REJECTED, S.APPROVED)).toBe(false);
    expect(workflowEngine.canTransition(S.REVERSED, S.POSTED)).toBe(false);
    expect(() => workflowEngine.assertTransition(S.DRAFT, S.POSTED)).toThrow(/Invalid workflow transition/);
  });

  it('prevents duplicate submission', () => {
    expect(workflowEngine.assertSubmittable(S.DRAFT)).toBe(true);
    expect(() => workflowEngine.assertSubmittable(S.PENDING_AUTHORISATION)).toThrow(/duplicate submission/i);
    expect(() => workflowEngine.assertSubmittable(S.APPROVED)).toThrow();
  });

  it('prevents duplicate approval', () => {
    expect(workflowEngine.assertDecidable(S.PENDING_AUTHORISATION)).toBe(true);
    expect(() => workflowEngine.assertDecidable(S.APPROVED)).toThrow(/duplicate approval/i);
    expect(() => workflowEngine.assertDecidable(S.POSTED)).toThrow();
  });
});
