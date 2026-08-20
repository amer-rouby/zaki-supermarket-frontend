import { signal, computed } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

/** Reusable server-side pagination state for list screens. */
export function createPaginatorState(defaultPageSize = 10) {
  const pageIndex = signal(0);
  const pageSize = signal(defaultPageSize);
  const totalElements = signal(0);
  const loading = signal(false);

  const pageParams = computed(() => ({
    page: pageIndex(),
    size: pageSize()
  }));

  function onPageChange(event: PageEvent): void {
    pageIndex.set(event.pageIndex);
    pageSize.set(event.pageSize);
  }

  function reset(): void {
    pageIndex.set(0);
  }

  return {
    pageIndex,
    pageSize,
    totalElements,
    loading,
    pageParams,
    onPageChange,
    reset
  };
}
