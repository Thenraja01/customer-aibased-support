import * as notificationPreferenceService from "./notificationPreference.service.js";

export const getMyPreferences = async (req, res) => {
  try {
    const prefs = await notificationPreferenceService.getMyPreferences(req.user.userId);
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const prefs = await notificationPreferenceService.updatePreferences(req.user.userId, req.body);
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const prefs = await notificationPreferenceService.getAll();
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
