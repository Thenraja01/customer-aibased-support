import {
  createFaq,
  getActiveFaqs,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
} from "../service/faq.service.js";

// POST /faqs
export const create = async (req, res) => {
  try {
    const data = { ...req.body, created_by: req.user?.userId };
    const faq = await createFaq(data);
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /faqs/active (Public/Customers)
export const getActive = async (req, res) => {
  try {
    const faqs = await getActiveFaqs();
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /faqs (Admin)
export const getAll = async (req, res) => {
  try {
    const faqs = await getAllFaqs();
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /faqs/:id
export const getById = async (req, res) => {
  try {
    const faq = await getFaqById(req.params.id);
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PUT /faqs/:id
export const update = async (req, res) => {
  try {
    const faq = await updateFaq(req.params.id, req.body);
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /faqs/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteFaq(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "FAQ not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
