import SystemConfig from "./systemConfig.schema.js";

export const createConfig = async (data) => {
  return await SystemConfig.create(data);
};

export const getAllConfigs = async () => {
  return await SystemConfig.find().sort({ key: 1 });
};

export const getConfigByKey = async (key) => {
  const config = await SystemConfig.findOne({ key });
  if (!config) throw new Error("Configuration not found");
  return config;
};

export const updateConfig = async (key, data) => {
  const config = await SystemConfig.findOne({ key });
  if (!config) throw new Error("Configuration not found");
  if (!config.is_editable) throw new Error("Configuration is not editable");
  Object.assign(config, data);
  return await config.save();
};

export const deleteConfig = async (key) => {
  const config = await SystemConfig.findOneAndDelete({ key });
  if (!config) throw new Error("Configuration not found");
  return { message: "Configuration deleted" };
};
