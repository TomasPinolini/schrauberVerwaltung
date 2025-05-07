import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const AuftraegePage = () => {
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Screwing Process Data</h1>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Aufträge</h5>
            </Card.Header>
            <Card.Body>
              <p>This page will display screwdriver controller data.</p>
              <p>We're currently working on implementing this feature.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuftraegePage;
