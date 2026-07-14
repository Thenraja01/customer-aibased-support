import {
  register,
  login,
  changePassword,
} from "../services/auth.service.js";

// POST /auth/register
export const registerUser = async (req, res) => {
  try {
    const result = await register(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    let status = 500;

    if (error.message === "Email already registered") {
      status = 400;
    }

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /auth/login
export const loginUser = async (req, res) => {
  try {
    const result = await login(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      data: result.user,
    });
  } catch (error) {
    let status = 500;

    if (
      error.message === "Invalid email or password" ||
      error.message.startsWith("Account is")
    ) {
      status = 401;
    }

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /auth/change-password
export const updatePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const result = await changePassword(
      email,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    let status = 500;

    if (
      error.message === "User not found" ||
      error.message === "Current password is incorrect" ||
      error.message ===
        "New password cannot be the same as the current password" ||
      error.message.startsWith("Account is")
    ) {
      status = 400;
    }

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};