import { useEffect, useRef, useCallback } from 'react';

export function useChatScroll(deps: any[]) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, deps);

  const handleScroll = useCallback(() => {
    // scroll handler
  }, []);

  return { containerRef: ref, handleScroll };
}
