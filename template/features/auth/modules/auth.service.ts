import { generateToken } from "@/utils";
import { UserModel } from "@/models/user.model";
import { hashPassword, verifyPassword } from "@/utils";
import { UnauthorizedError, ConflictError } from "@/utils";

export const loginService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = await UserModel.findOne({ email }).exec();
  if (!user) throw new UnauthorizedError("User not found");

  const match = await verifyPassword(user.password, password);
  if (!match) throw new UnauthorizedError("Invalid credentials");

  return generateToken({ email: user.email });
};

export const registerService = async ({
  email,
  password,
  fullName,
}: {
  email: string;
  password: string;
  fullName: string;
}) => {
  const exists = await UserModel.findOne({ email }).exec();
  if (exists) throw new ConflictError("Email already registered");

  const hashed = await hashPassword(password);
  const user = await UserModel.create({ email, password: hashed, fullName });

  return generateToken({ email: user.email });
};
