export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateUsername(username: string): ValidationResult {
  if (!username) return { ok: false, error: "Username is required." };
  if (username.length < USERNAME_MIN) {
    return { ok: false, error: `Username must be at least ${USERNAME_MIN} characters.` };
  }
  if (username.length > USERNAME_MAX) {
    return { ok: false, error: `Username must be at most ${USERNAME_MAX} characters.` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Username can only use letters, numbers and underscores." };
  }
  return { ok: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { ok: false, error: "Password is required." };
  if (password.length < PASSWORD_MIN) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN} characters.` };
  }
  return { ok: true };
}

/** Usernames are stored lowercase so `Budi` and `budi` can't both exist. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
