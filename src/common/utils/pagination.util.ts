import { PaginatedResponseDto } from '../dto/paginated-response.dto.js';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(
  options: PaginationOptions,
  defaultLimit = 10,
): PaginationResult {
  const page = Math.max(1, Math.trunc(Number(options.page) || 1));

  const limit = Math.min(
    100,
    Math.max(1, Math.trunc(Number(options.limit) || defaultLimit)),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
