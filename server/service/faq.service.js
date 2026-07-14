import Faq from "../schema/Faq.schema.js";

// Create a new FAQ
export const createFaq = async (data) => {
  return await Faq.create(data);
};

// Get all active FAQs (for customers)
export const getActiveFaqs = async () => {
  return await Faq.find({ is_active: true }).sort({ category: 1, created_at: -1 });
};

// Get all FAQs (for admin)
export const getAllFaqs = async () => {
  return await Faq.find().populate("created_by", "name email").sort({ created_at: -1 });
};

// Get FAQ by ID
export const getFaqById = async (id) => {
  const faq = await Faq.findById(id);
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

// Update an FAQ
export const updateFaq = async (id, data) => {
  const faq = await Faq.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

// Delete an FAQ
export const deleteFaq = async (id) => {
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw new Error("FAQ not found");
  return { message: "FAQ deleted successfully" };
};
