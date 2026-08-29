import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Auto-scrolls a chat message container to the bottom when the
 * `messages` array changes — but only if the user isn't manually
 * scrolled up (i.e. they've "unlocked" auto-scroll by scrolling to the bottom).
 *
 * Uses `requestAnimationFrame` for smooth, jank-free scrolling.
 */
export function useAutoScroll(messages: any[] | undefined | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current || !autoScroll) return;
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [autoScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return { containerRef, handleScroll, scrollToBottom, autoScroll };
}
