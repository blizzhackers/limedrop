import { useEffect, useEffectEvent, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  filteredCount: number;
  pageSize: number;
  onFilteredCountReset?: () => void;
}

export function useInfiniteScroll({
  scrollRef,
  filteredCount,
  pageSize,
  onFilteredCountReset,
}: UseInfiniteScrollOptions) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedCount, setLoadedCount] = useState(pageSize);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const onScroll = useEffectEvent(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;

      setShowBackToTop(el.scrollTop > 300);

      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 500;
      const isMobile = window.innerWidth < 768;

      if (
        isNearBottom &&
        isMobile &&
        !isLoadingMore &&
        loadedCount < filteredCount
      ) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setLoadedCount((prev) => Math.min(prev + pageSize, filteredCount));
          setIsLoadingMore(false);
          setTimeout(() => {
            el.scrollBy({
              top: Math.min(pageSize * 200 * 0.3, 400),
              behavior: "smooth",
            });
          }, 200);
        }, 300);
      }
    }, 100);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: refs don't need to be in dependency array
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const prevFilteredCount = useRef(filteredCount);
  useEffect(() => {
    if (prevFilteredCount.current !== filteredCount) {
      setLoadedCount(pageSize);
      onFilteredCountReset?.();
      prevFilteredCount.current = filteredCount;
    }
  }, [filteredCount, pageSize, onFilteredCountReset]);

  return { loadedCount, isLoadingMore, showBackToTop };
}
