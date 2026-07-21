import bcrypt from "bcrypt";
import User from "../user/user.schema.js";
import Role from "../role/role.schema.js"; // Add this import
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

// Roles that cannot be assigned during registration
const RESTRICTED_ROLES = ["tenant admin", "super admin"];

export const register = async (userData) => {
  const { organization_id, role_id, name, email, phone, password, dob } =
    userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already registered");

  // Validate that the role is not restricted
  if (role_id) {
    const role = await Role.findById(role_id);
    
    if (!role) {
      throw new Error("Invalid role selected");
    }
    
    // Check if the role is restricted
    if (RESTRICTED_ROLES.some(restricted => 
      role.role_name.toLowerCase() === restricted.toLowerCase()
    )) {
      throw new Error("Cannot register with admin or super admin roles");
    }
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

  if (!user || user.status !== "active") {
    throw new Error("Invalid email or current password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or current password");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      organizationId: user.organization_id._id,
      roleId: user.role_id._id,
      roleName: user.role_id.role_name,
      email: user.email,
    },
    env.JWT_SECRET,
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

export const changePassword = async (email, currentPassword, newPassword) => {
  const user = await User.findOne({ email });
  if (!user || user.status !== "active") {
    throw new Error("Invalid email or current password");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or current password");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("New password cannot be the same as the current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return { message: "Password changed successfully" };
};