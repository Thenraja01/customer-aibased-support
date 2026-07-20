import * as systemConfigService from "./systemConfig.service.js";

export const create = async (req, res) => {
  try {
    const config = await systemConfigService.createConfig(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const configs = await systemConfigService.getAllConfigs();
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByKey = async (req, res) => {
  try {
    const config = await systemConfigService.getConfigByKey(req.params.key);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    const status = error.message === "Configuration not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const config = await systemConfigService.updateConfig(req.params.key, req.body);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    const status = error.message === "Configuration not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await systemConfigService.deleteConfig(req.params.key);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Configuration not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
