import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";

export const register = async (userData) => {
  const {
    organization_id,
    role_id,
    name,
    email,
    phone,
    password,
    dob,
  } = userData;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already registered");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    organization_id,
    role_id,
    name,
    email,
    phone,
    password: hashedPassword,
    dob,
    auth_type: "local",
    status: "active",
  });

  return {
    message: "User registered successfully",
    user: {
      id: user._id,
      organization_id: user.organization_id,
      role_id: user.role_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email })
    .populate("organization_id")
    .populate("role_id");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "active") {
    throw new Error(`Account is ${user.status}`);
  }
const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }
  const token = jwt.sign(
    {
      userId: user._id,
      organizationId: user.organization_id._id,
      roleId: user.role_id._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    user: {
      id: user._id,
      organization_id: user.organization_id,
      role_id: user.role_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
  };
};