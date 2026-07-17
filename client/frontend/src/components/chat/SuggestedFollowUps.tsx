import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface SuggestedFollowUpsProps {
  messageContent: string;
  onSelect: (text: string) => void;
}

function generateFollowUps(content: string): string[] {
  const lower = content.toLowerCase();
  const suggestions: string[] = [];

  if (lower.includes("account") || lower.includes("login") || lower.includes("sign")) {
    suggestions.push("How do I reset my password?");
    suggestions.push("How do I change my email?");
  }
  if (lower.includes("billing") || lower.includes("payment") || lower.includes("charge")) {
    suggestions.push("Can I get a refund?");
    suggestions.push("How do I update my payment method?");
  }
  if (lower.includes("order") || lower.includes("shipping") || lower.includes("delivery")) {
    suggestions.push("Where is my order?");
    suggestions.push("How do I track my package?");
  }
  if (lower.includes("technical") || lower.includes("error") || lower.includes("bug")) {
    suggestions.push("Can you help me troubleshoot?");
    suggestions.push("Is this a known issue?");
  }
  if (lower.includes("ticket") || lower.includes("escalat")) {
    suggestions.push("What's the expected response time?");
    suggestions.push("Can I speak with a human agent?");
  }

  if (suggestions.length < 2) {
    suggestions.push("Can you explain that in more detail?");
    suggestions.push("What should I do next?");
  }

  return suggestions.slice(0, 3);
}

const SuggestedFollowUps = memo(function SuggestedFollowUps({
  messageContent,
  onSelect,
}: SuggestedFollowUpsProps) {
  const followUps = useMemo(() => generateFollowUps(messageContent), [messageContent]);

  if (followUps.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-wrap gap-1.5 mt-2 ml-10"
    >
      {followUps.map((text) => (
        <motion.button
          key={text}
          variants={staggerItem}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(text)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs",
            "border border-border bg-background hover:bg-muted/80",
            "hover:border-primary/30 transition-all duration-150",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquarePlus size={12} />
          {text}
        </motion.button>
      ))}
    </motion.div>
  );
});

export default SuggestedFollowUps;
