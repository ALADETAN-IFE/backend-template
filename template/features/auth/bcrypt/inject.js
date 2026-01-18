export const deps = ["bcrypt"];

export const devDeps = ["@types/bcrypt"];

export const getFiles = (language = "typescript") => {
  const ext = language === "javascript" ? ".js" : ".ts";

  const tsContent = `import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (
  hash: string,
  password: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
`;

  const jsContent = `const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(hash, password) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
`;

  return {
    [`src/utils/hash${ext}`]: language === "javascript" ? jsContent : tsContent,
  };
};
