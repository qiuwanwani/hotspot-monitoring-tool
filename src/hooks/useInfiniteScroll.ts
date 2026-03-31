'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  initialPage?: number;
  threshold?: number;
  debounceMs?: number;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  reset: () => void;
  refresh: () => Promise<void>;
}

export function useInfiniteScroll<T>({
  fetchData,
  initialPage = 1,
  threshold = 100,
  debounceMs = 300,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadMore = useCallback(async () => {
    // 防止重复请求
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(page);
      setData((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchData, page, hasMore]);

  // 防抖加载
  const debouncedLoadMore = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      loadMore();
    }, debounceMs);
  }, [loadMore, debounceMs]);

  // 初始加载
  useEffect(() => {
    loadMore();
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 设置 Intersection Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          debouncedLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedLoadMore, hasMore, threshold]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    loadingRef.current = false;
    loadMore();
  }, [initialPage, loadMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    loadingRef.current = false;
    await loadMore();
  }, [initialPage, loadMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMoreRef,
    reset,
    refresh,
  };
}
