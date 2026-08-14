import { useEffect, useState, useCallback } from "react";
import { FAQAPI } from "@/api";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  useEffect(() => {
    const loadFAQs = async () => {
      setLoading(true);
      try {
        const res = await FAQAPI.getActive();
        if (res.data.success) {
          setFaqs(res.data.data);
        }
      } catch {
        toast.error("Error", "Failed to load FAQs. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadFAQs();
  }, []);

  const toggleFAQ = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFAQ(index);
    }
  }, [toggleFAQ]);

  const filteredFaqs = searchQuery
    ? faqs.filter((faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          Loading FAQs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold ">Frequently Asked Questions</h1>
        <p className="text-sm text-muted-foreground">
          Find quick answers to common questions about our services.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background dark:bg-card/50 dark:border-white/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Search frequently asked questions"
        />
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="rounded-lg border bg-card dark:bg-card/50 p-8 sm:p-12 text-center">
          <HelpCircle size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">
            {searchQuery ? "No FAQs match your search" : "No FAQs available at the moment"}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-sm text-primary hover:underline mt-2">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Frequently asked questions">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq._id} className="rounded-lg border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden transition-shadow hover:shadow-sm" role="listitem">
                <button
                  onClick={() => toggleFAQ(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq._id}`}
                  className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left focus:outline-none focus-visible:bg-muted/50"
                >
                  <span className="text-sm sm:text-base font-medium pr-2">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp size={16} className="shrink-0 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronDown size={16} className="shrink-0 text-muted-foreground transition-transform" />
                  )}
                </button>
                <div
                  id={`faq-answer-${faq._id}`}
                  role="region"
                  aria-labelledby={`faq-question-${faq._id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t dark:border-white/[0.06] pt-3 whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
