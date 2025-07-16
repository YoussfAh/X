import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

const RouteError = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h1 className="display-4 mb-4">Oops!</h1>
          <div className="mb-4">
            <p className="lead">Sorry, an unexpected error has occurred.</p>
            <p>
              {error.status === 404 
                ? "The page you're looking for doesn't exist."
                : error.statusText || error.message}
            </p>
          </div>
          <div className="d-flex gap-3 justify-content-center">
            <Button as={Link} to="/home" variant="primary">
              Go to Home
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline-secondary"
            >
              Go Back
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RouteError;
