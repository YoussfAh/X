import { Pagination, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const CollectionPaginate = ({ pages, page }) => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Listen for window resize to adjust pagination display
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = (pageNumber) => {
    const pageUrl = pageNumber === 1 ? '/admin/collectionlist' : `/admin/collectionlist/${pageNumber}`;
    navigate(pageUrl);
  };

  if (pages <= 1) return null;

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 992;

  // Mobile compact pagination
  if (isMobile) {
    return (
      <div
        className="d-flex align-items-center justify-content-center gap-2"
        style={{ fontSize: '0.875rem' }}
      >
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={page === 1}
          onClick={() => page > 1 && handleClick(page - 1)}
          style={{
            padding: '0.25rem 0.5rem',
            minWidth: '32px',
            border: 'none',
            background: 'transparent'
          }}
        >
          <FaChevronLeft size={12} />
        </Button>

        <span
          style={{
            minWidth: '80px',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}
        >
          {page} of {pages}
        </span>

        <Button
          variant="outline-secondary"
          size="sm"
          disabled={page === pages}
          onClick={() => page < pages && handleClick(page + 1)}
          style={{
            padding: '0.25rem 0.5rem',
            minWidth: '32px',
            border: 'none',
            background: 'transparent'
          }}
        >
          <FaChevronRight size={12} />
        </Button>
      </div>
    );
  }

  // Calculate pagination display for tablet and desktop
  const getVisiblePages = () => {
    let maxVisible = isTablet ? 5 : 7;

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(pages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return { start, end };
  };

  const { start, end } = getVisiblePages();

  // Desktop/Tablet pagination
  return (
    <Pagination
      className="mb-0 justify-content-center"
      style={{
        flexWrap: 'wrap',
        gap: '0.25rem'
      }}
    >
      {/* First page button */}
      {page > 2 && (
        <Pagination.First
          onClick={() => handleClick(1)}
          title="First page"
          style={{
            fontSize: '0.875rem',
            padding: '0.375rem 0.5rem'
          }}
        >
          <FaAngleDoubleLeft size={12} />
        </Pagination.First>
      )}

      {/* Previous page button */}
      <Pagination.Prev
        disabled={page === 1}
        onClick={() => page > 1 && handleClick(page - 1)}
        title="Previous page"
        style={{
          fontSize: '0.875rem',
          padding: '0.375rem 0.5rem',
          minWidth: '45px'
        }}
      >
        <FaChevronLeft size={10} />
      </Pagination.Prev>

      {/* Show ellipsis if there are hidden pages at the beginning */}
      {start > 1 && (
        <>
          <Pagination.Item onClick={() => handleClick(1)}>1</Pagination.Item>
          {start > 2 && <Pagination.Ellipsis disabled />}
        </>
      )}

      {/* Page numbers */}
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((pageNumber) => (
        <Pagination.Item
          key={pageNumber}
          active={pageNumber === page}
          onClick={() => handleClick(pageNumber)}
          style={{
            fontSize: '0.875rem',
            padding: '0.375rem 0.5rem',
            minWidth: '35px',
            fontWeight: pageNumber === page ? '600' : '500'
          }}
        >
          {pageNumber}
        </Pagination.Item>
      ))}

      {/* Show ellipsis if there are hidden pages at the end */}
      {end < pages && (
        <>
          {end < pages - 1 && <Pagination.Ellipsis disabled />}
          <Pagination.Item onClick={() => handleClick(pages)}>{pages}</Pagination.Item>
        </>
      )}

      {/* Next page button */}
      <Pagination.Next
        disabled={page === pages}
        onClick={() => page < pages && handleClick(page + 1)}
        title="Next page"
        style={{
          fontSize: '0.875rem',
          padding: '0.375rem 0.5rem',
          minWidth: '45px'
        }}
      >
        <FaChevronRight size={10} />
      </Pagination.Next>

      {/* Last page button */}
      {page < pages - 1 && (
        <Pagination.Last
          onClick={() => handleClick(pages)}
          title="Last page"
          style={{
            fontSize: '0.875rem',
            padding: '0.375rem 0.5rem'
          }}
        >
          <FaAngleDoubleRight size={12} />
        </Pagination.Last>
      )}
    </Pagination>
  );
};

export default CollectionPaginate;