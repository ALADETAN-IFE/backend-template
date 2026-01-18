export const deps = ["argon2"];

export const getFiles = (language = "typescript") => {
  const ext = language === "javascript" ? ".js" : ".ts";

  const tsContent = `import argon2 from "argon2";

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
`;

  const jsContent = `const argon2 = require("argon2");

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
};

async function hashPassword(password) {
  return argon2.hash(password, HASH_OPTIONS);
}

async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

module.exports = { hashPassword, verifyPassword };
`;

  return {
    [`src/utils/hash${ext}`]: language === "javascript" ? jsContent : tsContent,
  };
};
