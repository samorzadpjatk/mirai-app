export function buildPagination(
  total: number,
  limit: number,
  offset: number,
  currentPage: number,
): {
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = offset + limit < total;
  const hasPreviousPage = currentPage > 1;

  return {
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}
