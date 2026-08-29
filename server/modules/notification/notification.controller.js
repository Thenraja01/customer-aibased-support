import mongoose from "mongoose";
import * as notifService from "./notification.service.js";

const isStaffRole = (roleName) =>
  ["super_admin", "admin", "support"].includes(roleName?.toLowerCase());

export const create = async (req, res) => {
  try {
    const notif = await notifService.createNotification(req.body);
    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const broadcast = async (req, res) => {
  try {
    const { userIds, ...data } = req.body;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = req.user?.organizationId;
    const branchId = req.user?.branchId;

    if (!isSuperAdmin) {
      if (!orgId) {
        return res.status(400).json({ success: false, message: "No organization associated with your account" });
      }

      // Check if all userIds belong to the caller's organization
      const User = mongoose.model("User");
      const count = await User.countDocuments({
        _id: { $in: userIds },
        organization_id: orgId,
      });

      if (count !== userIds.length) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Cannot broadcast to users outside your organization",
        });
      }

      // Set organization and branch scope on the broadcast payload
      data.organization_id = orgId;
      data.branch_id = branchId || null;
    } else {
      // Super admin can broadcast, default to target user's organization if possible
      // or keep it blank.
    }

    const notifs = await notifService.broadcastNotification(data, userIds);
    res.status(201).json({ success: true, data: notifs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const notifs = await notifService.getNotificationsByUser(req.params.userId);
    res.status(200).json({ success: true, data: notifs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnread = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const notifs = await notifService.getUnreadNotifications(req.params.userId);
    res.status(200).json({ success: true, data: notifs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const count = await notifService.countUnread(req.params.userId);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const read = async (req, res) => {
  try {
    const notif = await notifService.getNotificationById(req.params.id);
    if (!isStaffRole(req.user.roleName) && notif.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const updated = await notifService.markAsRead(req.params.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    const status = error.message === "Notification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const readAll = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await notifService.markAllAsRead(req.params.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const notif = await notifService.getNotificationById(req.params.id);
    if (!isStaffRole(req.user.roleName) && notif.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await notifService.deleteNotification(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Notification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const clear = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await notifService.clearNotifications(req.params.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const broadcastToOrg = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const notifs = await notifService.broadcastToOrganization(req.body, orgId, req.user.userId);
    res.status(201).json({ success: true, data: notifs, count: notifs.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPreviewCount = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const targetUsers = await notifService.resolveAudienceUsers(orgId, {
      audienceType: req.body.audienceType || "all",
      branchIds: req.body.branchIds || [],
      roleIds: req.body.roleIds || [],
    });
    res.status(200).json({ success: true, count: targetUsers.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const history = await notifService.getCampaignHistory(orgId, page, limit);
    res.status(200).json({ success: true, ...history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const campaign = await notifService.getCampaignById(req.params.id, orgId);
    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    const status = error.message === "Campaign notification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const list = await notifService.getTemplates(orgId);
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const created = await notifService.createTemplate(req.body, orgId, req.user.userId);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const result = await notifService.deleteTemplate(req.params.id, orgId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const broadcastToAll = async (req, res) => {
  try {
    const notifs = await notifService.broadcastToAll(req.body);
    res.status(201).json({ success: true, data: notifs, count: notifs.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const broadcastToOrgById = async (req, res) => {
  try {
    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const notifs = await notifService.broadcastToOrganization(req.body, orgId);
    res.status(201).json({ success: true, data: notifs, count: notifs.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
