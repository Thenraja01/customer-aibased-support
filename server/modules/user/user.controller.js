import * as userService from "./user.service.js";

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.scope || null);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgCustomers = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) return res.status(400).json({ success: false, message: "Organization not resolved" });
    const branchId = req.scope?.isOrgAdmin ? null : req.user.branchId;
    const customers = await userService.getOrgCustomers(orgId, branchId);
    res.status(200).json({ success: true, data: customers });
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
    // Pass the creator (req.user) for scope enforcement
    const user = await userService.createUser(req.body, req.user);
    res.status(201).json({ success: true, message: "User created successfully", data: user });
  } catch (error) {
    let status = 500;
    if (error.message.startsWith("Forbidden")) {
      status = 403;
    } else if (["Email already exists", "Organization not found", "Role not found"].includes(error.message)) {
      status = 400;
    }
    res.status(status).json({ success: false, message: error.message });
  }
};

export const editUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.scope || null);
    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : error.message.startsWith("Forbidden") ? 403 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.scope || null);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : error.message.startsWith("Forbidden") ? 403 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const searchUser = async (req, res) => {
  try {
    const users = await userService.searchUsers(req.query.q || "", req.scope || null);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const patchUserStatus = async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.status, req.scope || null);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : error.message.startsWith("Forbidden") ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * POST /users/fcm-token
 * Save or update the FCM device registration token for the authenticated user.
 * The frontend must call this endpoint after the FCM SDK returns a new token
 * (on first load, after token refresh, or after permission is granted).
 */
export const updateFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string" || token.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A valid FCM token string is required",
      });
    }
    await userService.saveFcmToken(req.user.userId, token.trim());
    res.status(200).json({ success: true, message: "FCM token saved" });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /users/fcm-token
 * Remove the FCM device token for the authenticated user.
 * Call this on logout or when push notifications are disabled by the user.
 */
export const removeFcmToken = async (req, res) => {
  try {
    const result = await userService.clearFcmToken(req.user.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let imageUrl = req.file.path;
    if (!imageUrl) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const user = await userService.updateProfile(req.user.userId, { profileImage: imageUrl });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { profileImage: imageUrl }
    });
  } catch (error) {
    res.status(550).json({ success: false, message: error.message });
  }
};

export const enable2FA = async (req, res) => {
  try {
    await userService.updateProfile(req.user.userId, { two_factor_enabled: true });
    res.status(200).json({
      success: true,
      message: "Two-factor authentication enabled successfully",
      data: { two_factor_enabled: true }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const disable2FA = async (req, res) => {
  try {
    await userService.updateProfile(req.user.userId, { two_factor_enabled: false });
    res.status(200).json({
      success: true,
      message: "Two-factor authentication disabled successfully",
      data: { two_factor_enabled: false }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
