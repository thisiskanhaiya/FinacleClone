/**
 * CIF payload validation. Pure functions - no Vue, no storage.
 * Used by customerService (service-level enforcement) and by the
 * operation screens to display the same errors immediately.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9-]{8,14}$/;
const ID_PROOF_TYPES = ['PASSPORT', 'PAN_CARD', 'AADHAAR', 'VOTER_ID', 'REGISTRATION_CERT'];
const RISK_CATEGORIES = ['LOW', 'MEDIUM', 'HIGH'];
const CUSTOMER_TYPES = ['RETAIL', 'CORPORATE'];
const SEGMENTS = ['REGULAR', 'SALARY', 'PREMIUM', 'SME', 'CORPORATE'];

export function validateCifPayload(payload) {
  const errors = {};
  const p = payload ?? {};

  if (!p.name || p.name.trim().length < 3) {
    errors.name = 'Customer name is required (min 3 characters).';
  }
  if (!CUSTOMER_TYPES.includes(p.type)) {
    errors.type = 'Customer type must be RETAIL or CORPORATE.';
  }
  if (!SEGMENTS.includes(p.segment)) {
    errors.segment = 'Select a valid segment.';
  }
  if (!RISK_CATEGORIES.includes(p.riskCategory)) {
    errors.riskCategory = 'Select a valid risk category.';
  }
  if (p.email && !EMAIL_RE.test(p.email)) {
    errors.email = 'Email format is invalid.';
  }
  if (!p.phone || !PHONE_RE.test(String(p.phone).trim())) {
    errors.phone = 'Phone is required (digits and dashes, 9-15 characters).';
  }
  if (!ID_PROOF_TYPES.includes(p.idProofType)) {
    errors.idProofType = 'Select an identity proof type.';
  }
  if (!p.idProofNumber || String(p.idProofNumber).trim().length < 4) {
    errors.idProofNumber = 'Identity proof number is required (min 4 characters).';
  }
  if (p.type === 'CORPORATE' && (!p.registrationRef || !String(p.registrationRef).trim())) {
    errors.registrationRef = 'Corporate customers require an entity registration reference.';
  }
  if (!p.address || !String(p.address).trim()) {
    errors.address = 'Address is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Fields a retail/corporate modify request is allowed to touch. */
export const MODIFIABLE_CIF_FIELDS = Object.freeze(['phone', 'email', 'address', 'segment']);

export function validateCifModification(before, changes) {
  const errors = {};
  const touched = Object.keys(changes ?? {}).filter(
    (k) => MODIFIABLE_CIF_FIELDS.includes(k) && String(changes[k] ?? '') !== String(before?.[k] ?? ''),
  );
  if (touched.length === 0) {
    errors._form = 'No changes detected - modify at least one field before submitting.';
    return { valid: false, errors, touched };
  }
  if (touched.includes('email') && changes.email && !EMAIL_RE.test(changes.email)) {
    errors.email = 'Email format is invalid.';
  }
  if (touched.includes('phone') && !PHONE_RE.test(String(changes.phone).trim())) {
    errors.phone = 'Phone format is invalid.';
  }
  if (touched.includes('address') && !String(changes.address).trim()) {
    errors.address = 'Address cannot be empty.';
  }
  return { valid: Object.keys(errors).length === 0, errors, touched };
}
