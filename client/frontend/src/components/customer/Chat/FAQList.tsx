import { useState, useEffect } from 'react';
import { FAQAPI } from '@/api/faq.api';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { FAQ } from '@/types/chat.types';

export function FAQList() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const res = await FAQAPI.getAll();
      setFaqs(res.data.data || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const filtered = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        FAQ
      </h3>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full h-8 pl-9 pr-3 text-xs rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No FAQs found</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((faq) => (
            <div key={faq._id} className="rounded-lg border">
              <button
                onClick={() => setExpandedId(expandedId === faq._id ? null : faq._id)}
                className="w-full flex items-center justify-between p-3 text-left text-sm"
              >
                <span className="font-medium">{faq.question}</span>
                {expandedId === faq._id ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              {expandedId === faq._id && (
                <div className="px-3 pb-3 text-sm text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
