export const deps = ["argon2"];

export const files = {
  "src/utils/hash.ts": `
import argon2 from "argon2";

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
};

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, HASH_OPTIONS);
};

export const verifyPassword = async (
  hash: string,
  password: string,
): Promise<boolean> => {
  return argon2.verify(hash, password);
};
`
};
