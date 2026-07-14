import User from "../schema/user.schema.js";
import Organization from "../schema/Organizations.schema.js";
import Role from "../schema/role.schema.js";
import bcrypt from "bcrypt";

// Get all users (excluding password)
export const getAllUsers = async () => {
  return await User.find()
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
};

// Get a single user by ID
export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");

  if (!user) throw new Error("User not found");
  return user;
};

// Get users by organization
export const getUsersByOrganization = async (organizationId) => {
  return await User.find({ organization_id: organizationId })
    .populate("role_id", "role_name")
    .select("-password");
};

// Create a new user (admin action)
export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) throw new Error("Email already exists");

  const organization = await Organization.findById(userData.organization_id);
  if (!organization) throw new Error("Organization not found");

  const role = await Role.findById(userData.role_id);
  if (!role) throw new Error("Role not found");

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({ ...userData, password: hashedPassword });

  const { password: _, ...safeUser } = user.toObject();
  return safeUser;
};

// Update user profile
export const updateUser = async (id, userData) => {
  // Prevent password update through this service
  delete userData.password;

  const user = await User.findByIdAndUpdate(id, userData, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");

  if (!user) throw new Error("User not found");
  return user;
};

// Change user status (active / inactive / blocked)
export const updateUserStatus = async (id, status) => {
  const allowed = ["active", "inactive", "blocked"];
  if (!allowed.includes(status)) throw new Error("Invalid status value");

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).select("-password");

  if (!user) throw new Error("User not found");
  return user;
};

// Soft-delete by blocking user
export const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return { message: "User deleted successfully" };
};

// Search users by name or email
export const searchUsers = async (keyword) => {
  return await User.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
    ],
  })
    .populate("organization_id", "name")
    .populate("role_id", "role_name")
    .select("-password");
};