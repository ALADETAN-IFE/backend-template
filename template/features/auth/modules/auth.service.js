const { generateToken } = require("../../../utils/jwt");
const { UserModel } = require("../../../models/user.model");
const { hashPassword, verifyPassword } = require("../../../utils/hash");
const {
  UnauthorizedError,
  ConflictError,
} = require("../../../utils/http-error");

async function loginService({ email, password }) {
  const user = await UserModel.findOne({ email }).exec();
  if (!user) throw new UnauthorizedError("User not found");

  const match = await verifyPassword(user.password, password);
  if (!match) throw new UnauthorizedError("Invalid credentials");

  return generateToken({ email: user.email });
}

async function registerService({ email, password, fullName }) {
  const exists = await UserModel.findOne({ email }).exec();
  if (exists) throw new ConflictError("Email already registered");

  const hashed = await hashPassword(password);
  const user = await UserModel.create({ email, password: hashed, fullName });

  return generateToken({ email: user.email });
}

module.exports = { loginService, registerService };
