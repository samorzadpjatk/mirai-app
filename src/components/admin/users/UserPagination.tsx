"use client";

import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text, Select } from "@radix-ui/themes";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

interface UserPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export default function UserPagination({
  pagination,
  onPageChange,
  onLimitChange,
  isLoading = false,
}: UserPaginationProps) {
  const { currentPage, totalPages, totalCount, hasNextPage, hasPreviousPage, limit } = pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Flex direction="column" gap="3">
      {/* Page info */}
      <Flex justify="between" align="center">
        <Text size="2" color="gray">
          Showing {Math.min((currentPage - 1) * limit + 1, totalCount)}-{Math.min(currentPage * limit, totalCount)} of {totalCount} users
        </Text>
        
        <Flex align="center" gap="2">
          <Text size="2" color="gray">Entries per page:</Text>
          <Select.Root
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(parseInt(value))}
            disabled={isLoading}
          >
            <Select.Trigger style={{ width: "80px" }} />
            <Select.Content>
              <Select.Item value="10">10</Select.Item>
              <Select.Item value="20">20</Select.Item>
              <Select.Item value="30">30</Select.Item>
              <Select.Item value="50">50</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" gap="1">
          {/* Previous button */}
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage || isLoading}
            size="2"
          >
            <ChevronLeftIcon />
          </Button>

          {/* Page numbers */}
          {pageNumbers.map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <Button variant="ghost" disabled size="2">
                  <DotsHorizontalIcon />
                </Button>
              ) : (
                <Button
                  variant={page === currentPage ? "solid" : "ghost"}
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  size="2"
                  style={{ minWidth: "40px" }}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}

          {/* Next button */}
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || isLoading}
            size="2"
          >
            <ChevronRightIcon />
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
