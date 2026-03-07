import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import {
  LoginSchemaType,
  RegisterSchemaType,
} from "../validators/auth.validator";

export const registerService = async (body: RegisterSchemaType) => {
  const { email } = body;
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new UnauthorizedException("Người dùng đã tồn tại");
  const newUser = new UserModel({
    name: body.name,
    email: body.email,
    password: body.password,
    avatar: body.avatar,
  });
  await newUser.save();
  return newUser;
};

export const loginService = async (body: LoginSchemaType) => {
  const { email, password } = body;

  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("Email hoặc mật khẩu không đúng");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw new UnauthorizedException("Email hoặc mật khẩu không hợp lệ");

  return user;
};