// Canonical password policy for every set/change-password screen.
// Mirrors the backend source of truth in apps/vs_user/password_policy.py
// (GET /auth/password/policy/). Keep the two in sync — the backend enforces
// exactly these rules, so weakening them here only hides real failures.

export const PASSWORD_MIN_LENGTH = 12;

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { label: "An uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "A number (0–9)", test: (p) => /\d/.test(p) },
  { label: "A special character (e.g. ! @ # $ %)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** True when the password satisfies every rule in the policy. */
export const passwordMeetsPolicy = (password: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(password));

/** One-line summary used as a form-validation message (the checklist shows detail). */
export const PASSWORD_POLICY_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter, ` +
  `a lowercase letter, a number, and a special character.`;
