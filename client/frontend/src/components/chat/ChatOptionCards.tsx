import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";

export interface ChatOption {
  label: string;
  text: string;
}

interface ChatOptionCardsProps {
  options: ChatOption[];
  onSelect: (text: string) => void;
}

function parseOptions(content: string): ChatOption[] | null {
  const options: ChatOption[] = [];

  const patternA = /\*\*Choose an option:\*\*[\s\S]*?\*\*A:\*\*\s*(.+?)(?:\n\*\*B:\*\*|\n\n)/i;
  const patternB = /\*\*B:\*\*\s*(.+?)(?:\n\n|\n\*\*|$)/i;

  const matchA = content.match(patternA);
  const matchB = content.match(patternB);

  if (matchA && matchB) {
    options.push({ label: "A", text: matchA[1].trim() });
    options.push({ label: "B", text: matchB[1].trim() });
    return options;
  }

  const bracketPattern = /\[Option ([A-Z]):\s*(.+?)\]/g;
  let match;
  while ((match = bracketPattern.exec(content)) !== null) {
    options.push({ label: match[1], text: match[2].trim() });
  }
  if (options.length >= 2) return options;

  const lines = content.split("\n");
  const optionLines: ChatOption[] = [];
  for (const line of lines) {
    const m = line.match(/^\*\*([A-Z]):\*\*\s*(.+)/);
    if (m) {
      optionLines.push({ label: m[1], text: m[2].trim() });
    }
  }
  if (optionLines.length >= 2) return optionLines;

  return null;
}

export { parseOptions };

const ChatOptionCards = memo(function ChatOptionCards({
  options,
  onSelect,
}: ChatOptionCardsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-wrap gap-2 mt-3"
    >
      {options.map((opt) => (
        <motion.button
          key={opt.label}
          variants={staggerItem}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(opt.text)}
          className={cn(
            "flex items-start gap-2 px-4 py-2.5 rounded-xl text-left text-sm",
            "border border-primary/20 bg-primary/5 dark:bg-primary/10",
            "hover:bg-primary/10 dark:hover:bg-primary/15 hover:border-primary/30",
            "hover:shadow-md hover:shadow-primary/10 transition-all duration-200",
            "active:bg-primary/15 max-w-[280px]"
          )}
        >
          <span className="flex-shrink-0 w-5 h-5 rounded-md bg-primary/15 dark:bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {opt.label}
          </span>
          <span className="text-foreground/90 leading-snug">{opt.text}</span>
        </motion.button>
      ))}
    </motion.div>
  );
});

export default ChatOptionCards;
