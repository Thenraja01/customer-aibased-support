import * as faqService from "./faq.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

export const create = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId;
    const branchId = req.scope?.branchId || req.user?.branchId;
    const faq = await faqService.createFaq(req.body, req.user, orgId, branchId);
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getActive = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.scope?.organizationId || req.user?.organizationId);
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : (req.scope?.branchId || req.user?.branchId);
    const faqs = await faqService.getActiveFaqs(orgId, branchId);
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.scope?.organizationId || req.user?.organizationId);
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : (req.scope?.branchId || req.user?.branchId);
    const faqs = await faqService.getAllFaqs(orgId, branchId);
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.scope?.organizationId || req.user?.organizationId);
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : (req.scope?.branchId || req.user?.branchId);
    const faqs = await faqService.getFaqsByStatus(req.params.status, orgId, branchId);
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const faq = await faqService.getFaqById(req.params.id);
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const faq = await faqService.updateFaq(req.params.id, req.body);
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  try {
    const faq = await faqService.approveFaq(req.params.id, req.user.userId || req.user._id);
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const reject = async (req, res) => {
  try {
    const faq = await faqService.rejectFaq(req.params.id);
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await faqService.deleteFaq(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getMyFaqs = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId;
    const branchId = req.scope?.branchId || req.user?.branchId;
    const faqs = await faqService.getFaqsByUser(req.user.userId || req.user._id, orgId, branchId);
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
