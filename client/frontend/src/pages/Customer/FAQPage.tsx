import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FAQAPI } from "@/api";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const res = await FAQAPI.getActive();
        if (res.data.success) {
          setFaqs(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFAQs();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading FAQs...</div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 max-w-4xl mx-auto">
      <motion.div variants={staggerItem} className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-sm text-muted-foreground">
          Find quick answers to common questions about our services.
        </p>
      </motion.div>

      {faqs.length === 0 ? (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-8 text-center">
          <HelpCircle size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No FAQs available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq._id}
              variants={staggerItem}
              className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <span className="font-medium text-sm">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={18} className="text-muted-foreground flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown size={18} className="text-muted-foreground flex-shrink-0 ml-4" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 pt-0 text-sm text-muted-foreground border-t dark:border-white/[0.06]">
                  <div className="pt-4 whitespace-pre-wrap">{faq.answer}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
