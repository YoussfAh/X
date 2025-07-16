import { Pagination } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const Paginate = ({ pages, page, isAdmin = false, keyword = '' }) => {
  const navigate = useNavigate();

  const handleClick = (x) => {
    if (isAdmin) {
      navigate(`/admin/productlist/${x + 1}`);
    }
  };

  // Helper function to determine which page numbers to display
  const getPageNumbers = () => {
    const totalPages = pages;
    const currentPage = page;
    const maxPagesToShow = 5; // Maximum number of page buttons to show at once
    
    let startPage, endPage;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages are less than max, show all pages
      startPage = 1;
      endPage = totalPages;
    } else {
      // Calculate center of the pagination based on current page
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrentPage) {
        // Current page is near the start
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        // Current page is near the end
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        // Current page is in the middle
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }
    
    // Create array of page numbers to display (1-indexed for display)
    return Array.from(Array((endPage - startPage) + 1).keys())
      .map(i => startPage + i);
  };

  return (
    pages > 1 && (
      <Pagination>
        {/* First Page button */}
        <Pagination.First
          onClick={() => handleClick(0)}
          disabled={page === 1}
        />
        
        {/* Previous Page button */}
        <Pagination.Prev
          onClick={() => handleClick(page - 2)}
          disabled={page === 1}
        />
        
        {/* Page Numbers */}
        {getPageNumbers().map(pageNum => (
          <Pagination.Item
            key={pageNum}
            as={isAdmin ? 'button' : Link}
            to={
              !isAdmin
                ? keyword
                  ? `/search/${keyword}/page/${pageNum}`
                  : `/page/${pageNum}`
                : undefined
            }
            active={pageNum === page}
            onClick={isAdmin ? () => handleClick(pageNum - 1) : undefined}
          >
            {pageNum}
          </Pagination.Item>
        ))}
        
        {/* Next Page button */}
        <Pagination.Next
          onClick={() => handleClick(page)}
          disabled={page === pages}
        />
        
        {/* Last Page button */}
        <Pagination.Last
          onClick={() => handleClick(pages - 1)}
          disabled={page === pages}
        />
      </Pagination>
    )
  );
};

export default Paginate;
