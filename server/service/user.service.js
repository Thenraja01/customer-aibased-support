import User from "../schemas/user.schema.js";

export const getAllUsers = async () => {
  return await User.find()
    .populate("organization_id", "name")
    .populate("role_id", "name")
    .select("password");
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate("organization_id", "name")
    .populate("role_id", "name")
    .select("password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};


export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const organization = await Organization.findById(data.organization_id);

  if (!organization) {
    throw new Error("Organization not found");
  }

  const role = await Role.findById(data.role_id);

  if (!role) {
    throw new Error("Role not found");
  }


  return await User.create(userData);
};

export const updateUser = async (id, userData) => {
  const user = await User.findByIdAndUpdate(id, userData, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name")
    .populate("role_id", "name")
    .select("password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    message: "User deleted successfully",
  };
};