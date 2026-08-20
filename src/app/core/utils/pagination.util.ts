import { PaginatedResponse } from '../models/api-response.model';

export function emptyPaginatedResponse<T>(size = 10): PaginatedResponse<T> {
  return {
    content: [],
    totalPages: 0,
    totalElements: 0,
    size,
    number: 0,
    first: true,
    last: true,
    empty: true
  };
}
