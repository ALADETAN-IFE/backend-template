/**
 * This base hash utility defines generic hashing function signatures.
 * The actual implementation will be replaced by bcrypt or argon2 depending
 * on user selection during template generation.
 */

export async function hashPassword(_password: string): Promise<string> {
  throw new Error(
    "hashPassword() not implemented — hashing method not selected (bcrypt or argon2)"
  );
}

export async function verifyPassword(
  _hashed: string,
  _password: string
): Promise<boolean> {
  throw new Error(
    "verifyPassword() not implemented — hashing method not selected (bcrypt or argon2)"
  );
}
