import NotificationPreference from "./notificationPreference.schema.js";

export const getMyPreferences = async (userId) => {
  let prefs = await NotificationPreference.findOne({ user_id: userId });
  if (!prefs) {
    prefs = await NotificationPreference.create({ user_id: userId });
  }
  return prefs;
};

export const updatePreferences = async (userId, data) => {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { user_id: userId },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
  return prefs;
};

export const getAll = async () => {
  return await NotificationPreference.find()
    .populate("user_id", "name email")
    .sort({ updated_at: -1 });
};
