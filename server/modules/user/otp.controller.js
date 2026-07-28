import * as otpService from "./otp.service.js";

export const requestOtp = async (req, res) => {
  try {
    const result = await otpService.generateOtp(req.body.email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const result = await otpService.verifyOtp(req.body.email, req.body.otp);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const result = await otpService.resetPasswordWithOtp(
      req.body.email,
      req.body.otp,
      req.body.newPassword
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
