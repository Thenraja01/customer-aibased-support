import * as userService from "./user.service.js";

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.userId, req.body);
    res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const result = await userService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: "User created successfully", data: user });
  } catch (error) {
    let status = 500;
    if (["Email already exists", "Organization not found", "Role not found"].includes(error.message)) {
      status = 400;
    }
    res.status(status).json({ success: false, message: error.message });
  }
};

export const editUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const searchUser = async (req, res) => {
  try {
    const users = await userService.searchUsers(req.query.q || "");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const patchUserStatus = async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
