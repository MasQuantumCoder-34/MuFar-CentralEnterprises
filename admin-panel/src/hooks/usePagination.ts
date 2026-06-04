'use client';

import { useState, useCallback } from 'react';
import { PAGINATION } from '@/types';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function usePagination(initialLimit = PAGINATION.DEFAULT_LIMIT) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: PAGINATION.DEFAULT_PAGE,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.limit),
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination({
      page: PAGINATION.DEFAULT_PAGE,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
    });
  }, [initialLimit]);

  return {
    ...pagination,
    setPage,
    setLimit,
    setTotal,
    reset,
  };
}
