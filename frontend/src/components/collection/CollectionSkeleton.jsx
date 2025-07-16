import React from 'react';

const CollectionSkeleton = () => {
  return (
    <div className="collection-skeleton-wrapper" style={{ 
      padding: '1rem',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Header Skeleton */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--border-color)',
          opacity: 0.6
        }} />
        <div style={{
          height: '32px',
          width: '200px',
          borderRadius: '8px',
          background: 'var(--border-color)',
          opacity: 0.6
        }} />
      </div>

      {/* Hero Section Skeleton */}
      <div style={{
        width: '100%',
        height: '300px',
        borderRadius: '16px',
        background: 'var(--border-color)',
        marginBottom: '2rem',
        opacity: 0.6
      }} />

      {/* Content Skeleton */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem' 
      }}>
        {[1, 2].map((item) => (
          <div key={item} style={{
            display: 'flex',
            gap: '1rem',
            padding: '1.5rem',
            background: 'var(--background-color)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '8px',
              background: 'var(--border-color)',
              opacity: 0.6
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: '24px',
                width: '60%',
                borderRadius: '4px',
                background: 'var(--border-color)',
                marginBottom: '1rem',
                opacity: 0.6
              }} />
              <div style={{
                height: '16px',
                width: '40%',
                borderRadius: '4px',
                background: 'var(--border-color)',
                opacity: 0.6
              }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .skeleton-item {
            flex-direction: column;
          }
          .skeleton-image {
            width: 100% !important;
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CollectionSkeleton; 