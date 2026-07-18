export function validateNewPassword(next: string, confirm: string): string | null {
  if (next.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (next !== confirm) {
    return "Passwords do not match";
  }
  return null;
}
