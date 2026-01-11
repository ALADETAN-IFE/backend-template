export const deps = ["bcrypt"];

export const files = {
  "src/utils/hash.ts": `
import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  hash: string,
  password: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
`
};
