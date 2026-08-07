// Keep temporary test-only bypasses aligned. Turning real email verification
// back on also removes the payment bypass from every flow that imports this.
export const EMAIL_VERIFICATION_ENABLED = false;
export const PAYMENT_BYPASS_ENABLED = !EMAIL_VERIFICATION_ENABLED;
