import React, { useMemo } from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductScreen from '../../screens/ProductScreen';

const ProductList = ({ collection, isDarkMode }) => {
  const products = useMemo(() => 
    collection.products.filter(item => item.product), 
    [collection.products]
  );

  const productCardStyle = useMemo(() => ({
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 4px 12px rgba(0, 0, 0, 0.03)',
    marginBottom: '2rem',
    width: '100%', // Ensure full width
  }), [isDarkMode]);

  const dividerStyle = useMemo(() => ({
    width: '100%',
    height: '1px',
    background: isDarkMode 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    margin: '2rem 0',
  }), [isDarkMode]);

  const containerStyle = useMemo(() => ({
    marginTop: '2rem',
    width: '100%', // Full width
    padding: 0, // No padding
  }), []);

  return (
    <div style={containerStyle}>
      <Row className="mx-0 w-100"> {/* Remove default Row margins and set full width */}
        {products.map((item, index) => {
          const product = item.product;
          if (!product) return null;

          return (
            <React.Fragment key={product._id}>
              <Col xs={12} className="px-0"> {/* Remove default Col padding */}
                <div style={productCardStyle}>
                  <ProductScreen productId={product._id} inCollection={true} />
                </div>
              </Col>
              {index < products.length - 1 && (
                <Col xs={12} className="px-0"> {/* Remove default Col padding */}
                  <div style={dividerStyle} />
                </Col>
              )}
            </React.Fragment>
          );
        })}
      </Row>
    </div>
  );
};

export default React.memo(ProductList);