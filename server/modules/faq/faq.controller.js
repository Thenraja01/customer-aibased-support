import * as faqService from "./faq.service.js";

export const create = async (req, res) => {
  try {
    const faq = await faqService.createFaq(req.body);
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getActive = async (req, res) => {
  try {
    const faqs = await faqService.getActiveFaqs(req.query.organizationId);
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const faqs = await faqService.getAllFaqs();
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

export const remove = async (req, res) => {
  try {
    const result = await faqService.deleteFaq(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
