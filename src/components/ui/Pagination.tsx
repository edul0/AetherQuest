"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  disabled?: boolean;
}

/**
 * Generate array of page numbers to display
 */
function getPaginationNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): (number | string)[] {
  const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
  
  if (totalNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots =
    leftSiblingIndex > 2;
  const shouldShowRightDots =
    rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  const items: (number | string)[] = [];

  // Always show first page
  items.push(firstPageIndex);

  // Left dots
  if (shouldShowLeftDots) {
    items.push("...");
  } else if (leftSiblingIndex > 1) {
    // Show numbers between 1 and left sibling
    for (let i = 1; i < leftSiblingIndex; i++) {
      items.push(i);
    }
  }

  // Sibling pages
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push(i);
  }

  // Right dots
  if (shouldShowRightDots) {
    items.push("...");
  } else if (rightSiblingIndex < totalPages - 1) {
    // Show numbers between right sibling and last
    for (let i = rightSiblingIndex + 1; i < lastPageIndex; i++) {
      items.push(i);
    }
  }

  // Always show last page
  if (lastPageIndex > firstPageIndex) {
    items.push(lastPageIndex);
  }

  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  disabled = false,
}: PaginationProps) {
  const pages = getPaginationNumbers(currentPage, totalPages, siblingCount);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav
      className="flex items-center justify-center gap-1"
      role="navigation"
      aria-label="Paginação"
    >
      {/* Previous Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrevious}
        disabled={disabled || currentPage === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => (
          <div key={index}>
            {page === "..." ? (
              <span className="px-2 py-1 text-aq-text-muted">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "primary" : "secondary"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                disabled={disabled}
                aria-current={currentPage === page ? "page" : undefined}
                className="min-w-10 h-10"
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Next Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleNext}
        disabled={disabled || currentPage === totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}

/**
 * Simple page info component
 */
export function PaginationInfo({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="text-xs text-aq-text-muted">
      <span>
        Exibindo {startItem} a {endItem} de {totalItems} items (página {currentPage} de{" "}
        {totalPages})
      </span>
    </div>
  );
}
