import React, { useState } from 'react';
import { Table, Button, Modal } from 'react-bootstrap';
import { format } from 'date-fns';

const AuftragTable = ({ auftraege }) => {
  const [selectedAuftrag, setSelectedAuftrag] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDetails = (auftrag) => {
    setSelectedAuftrag(auftrag);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const renderGraphData = (graphData) => {
    if (!graphData) return 'No graph data available';
    
    try {
      // Assuming graph data is stored as a JSON string
      const data = JSON.parse(graphData);
      return `${data.length} data points`;
    } catch (error) {
      return 'Graph data format error';
    }
  };

  return (
    <>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Controller</th>
            <th>ID Code</th>
            <th>Result</th>
            <th>Torque (Nom)</th>
            <th>Torque (Actual)</th>
            <th>Angle (Nom)</th>
            <th>Angle (Actual)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {auftraege.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center">No data available</td>
            </tr>
          ) : (
            auftraege.map((auftrag) => (
              <tr key={auftrag.id} className={auftrag.result === 'NOK' ? 'table-danger' : ''}>
                <td>{auftrag.id}</td>
                <td>{format(new Date(auftrag.date), 'yyyy-MM-dd HH:mm:ss')}</td>
                <td>{auftrag.controller_type}</td>
                <td>{auftrag.id_code}</td>
                <td>
                  <span className={`badge ${auftrag.result === 'OK' ? 'bg-success' : 'bg-danger'}`}>
                    {auftrag.result || 'N/A'}
                  </span>
                </td>
                <td>{auftrag.nominal_torque !== null ? auftrag.nominal_torque.toFixed(2) : 'N/A'}</td>
                <td>{auftrag.actual_torque !== null ? auftrag.actual_torque.toFixed(2) : 'N/A'}</td>
                <td>{auftrag.nominal_angle !== null ? auftrag.nominal_angle.toFixed(2) : 'N/A'}</td>
                <td>{auftrag.actual_angle !== null ? auftrag.actual_angle.toFixed(2) : 'N/A'}</td>
                <td>
                  <Button 
                    variant="info" 
                    size="sm" 
                    onClick={() => handleViewDetails(auftrag)}
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Details Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Auftrag Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAuftrag && (
            <div>
              <h5>Basic Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>ID</th>
                    <td>{selectedAuftrag.id}</td>
                    <th>Controller Type</th>
                    <td>{selectedAuftrag.controller_type}</td>
                  </tr>
                  <tr>
                    <th>Date</th>
                    <td>{format(new Date(selectedAuftrag.date), 'yyyy-MM-dd HH:mm:ss')}</td>
                    <th>ID Code</th>
                    <td>{selectedAuftrag.id_code}</td>
                  </tr>
                  <tr>
                    <th>Result</th>
                    <td>
                      <span className={`badge ${selectedAuftrag.result === 'OK' ? 'bg-success' : 'bg-danger'}`}>
                        {selectedAuftrag.result || 'N/A'}
                      </span>
                    </td>
                    <th>Screwdriver</th>
                    <td>{selectedAuftrag.screwdriver ? selectedAuftrag.screwdriver.name : 'Not assigned'}</td>
                  </tr>
                  <tr>
                    <th>Program Number</th>
                    <td>{selectedAuftrag.program_nr || 'N/A'}</td>
                    <th>Program Name</th>
                    <td>{selectedAuftrag.program_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Material Number</th>
                    <td>{selectedAuftrag.material_number || 'N/A'}</td>
                    <th>Serial Number</th>
                    <td>{selectedAuftrag.serial_number || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Channel</th>
                    <td>{selectedAuftrag.screw_channel || 'N/A'}</td>
                    <th>Cycle</th>
                    <td>{selectedAuftrag.cycle || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>

              <h5 className="mt-4">Measurement Data</h5>
              <Table bordered>
                <thead>
                  <tr>
                    <th></th>
                    <th>Nominal</th>
                    <th>Actual</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Torque</th>
                    <td>{selectedAuftrag.nominal_torque !== null ? selectedAuftrag.nominal_torque.toFixed(2) : 'N/A'}</td>
                    <td>{selectedAuftrag.actual_torque !== null ? selectedAuftrag.actual_torque.toFixed(2) : 'N/A'}</td>
                    <td>{selectedAuftrag.min_torque !== null ? selectedAuftrag.min_torque.toFixed(2) : 'N/A'}</td>
                    <td>{selectedAuftrag.max_torque !== null ? selectedAuftrag.max_torque.toFixed(2) : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Angle</th>
                    <td>{selectedAuftrag.nominal_angle !== null ? selectedAuftrag.nominal_angle.toFixed(2) : 'N/A'}</td>
                    <td>{selectedAuftrag.actual_angle !== null ? selectedAuftrag.actual_angle.toFixed(2) : 'N/A'}</td>
                    <td>{selectedAuftrag.min_angle !== null ? selectedAuftrag.min_angle.toFixed(2) : 'N/A'}</td>
                    <td>{selectedAuftrag.max_angle !== null ? selectedAuftrag.max_angle.toFixed(2) : 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>

              <h5 className="mt-4">Graph Data</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Angle Values:</strong> {renderGraphData(selectedAuftrag.angle_values)}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Torque Values:</strong> {renderGraphData(selectedAuftrag.torque_values)}</p>
                </div>
              </div>

              <h5 className="mt-4">Step Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Last Step Row</th>
                    <td>{selectedAuftrag.last_step_n || 'N/A'}</td>
                    <th>Last Step Column</th>
                    <td>{selectedAuftrag.last_step_p || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AuftragTable;
