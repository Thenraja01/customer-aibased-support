import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  updateUserStatus,
} from "../service/user.service.js";

// GET /users
export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /users/:id
export const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /users
export const addUser = async (req, res) => {
  try {
    const user = await createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    let status = 500;

    if (
      error.message === "Email already exists" ||
      error.message === "Organization not found" ||
      error.message === "Role not found"
    ) {
      status = 400;
    }

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /users/:id
export const editUser = async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /users/:id
export const removeUser = async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /users/search?q=keyword
export const searchUser = async (req, res) => {
  try {
    const users = await searchUsers(req.query.q || "");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /users/:id/status
export const patchUserStatus = async (req, res) => {
  try {
    const user = await updateUserStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};