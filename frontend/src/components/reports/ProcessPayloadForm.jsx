import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProcessPayloadForm = ({ onSuccess }) => {
  const [payload, setPayload] = useState('');
  const [controllerType, setControllerType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const controllerOptions = [
    'MFV3_Halle204_Rest_CH',
    'MFV3_Halle204_Vorm_Prop_Druck',
    'MFV23_Halle101_114227CP_link',
    'MFV23_Halle101_114227CP_recht',
    'MOE61_Halle206_BGGF1GF3',
    'MOE61_Halle207_BEM',
    'MOE61_Halle206_GH4'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!payload || !controllerType) {
      setError('Payload and controller type are required');
      return;
    }

    try {
      // Parse the payload to ensure it's valid JSON
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (err) {
        setError('Invalid JSON payload');
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      const response = await axios.post('/api/auftraege/process', {
        payload: parsedPayload,
        controllerType
      });

      setResult(response.data);
      setLoading(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to process payload');
      toast.error('Failed to process payload');
      console.error(err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        setPayload(fileContent);
      } catch (err) {
        setError('Failed to read file');
        toast.error('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessBatch = async () => {
    // This would be implemented to handle batch processing
    // For now, we'll just show a toast message
    toast.info('Batch processing functionality will be available soon');
  };

  return (
    <Card className="mb-4">
      <Card.Header>Process Payload</Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {result && (
          <Alert variant="success">
            <p>Payload processed successfully!</p>
            <p>Process ID: {result.auftrag.id}</p>
            <p>Controller Type: {result.auftrag.controller_type}</p>
            <p>Result: <span className={`badge ${result.auftrag.result === 'OK' ? 'bg-success' : 'bg-danger'}`}>{result.auftrag.result || 'N/A'}</span></p>
            {result.screwdriver && (
              <p>Associated with screwdriver: {result.screwdriver.name} (ID: {result.screwdriver.id})</p>
            )}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Controller Type</Form.Label>
            <Form.Select
              value={controllerType}
              onChange={(e) => setControllerType(e.target.value)}
              required
            >
              <option value="">Select Controller Type</option>
              {controllerOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Payload (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Paste JSON payload here"
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            <div>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="me-2"
              >
                {loading ? 'Processing...' : 'Process Payload'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleProcessBatch}
                disabled={loading}
              >
                Process Batch
              </Button>
            </div>
            
            <div>
              <Form.Group>
                <Form.Label className="btn btn-outline-secondary mb-0">
                  Upload JSON File
                  <Form.Control
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </Form.Label>
              </Form.Group>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ProcessPayloadForm;
