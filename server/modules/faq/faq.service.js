import Faq from "./faq.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const createFaq = async (data) => {
  return await Faq.create(data);
};

export const getActiveFaqs = async (organizationId) => {
  const query = { is_active: true };
  if (organizationId) query.organization_id = organizationId;
  return await Faq.find(query).sort({ created_at: -1 });
};

export const getAllFaqs = async () => {
  return await Faq.find()
    .populate("organization_id", "name")
    .sort({ created_at: -1 });
};

export const getFaqById = async (id) => {
  const faq = await Faq.findById(id).populate("organization_id", "name");
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

export const updateFaq = async (id, data) => {
  const faq = await Faq.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

export const deleteFaq = async (id) => {
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw new Error("FAQ not found");
  return { message: "FAQ deleted" };
};
