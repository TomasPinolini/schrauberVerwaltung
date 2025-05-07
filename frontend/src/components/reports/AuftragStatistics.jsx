import React, { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AuftragStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auftraege/statistics/overview');
      setStatistics(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch statistics');
      setLoading(false);
      toast.error('Failed to load statistics data');
      console.error(err);
    }
  };

  const controllerChartData = {
    labels: statistics?.controllers.map(item => item.controller_type) || [],
    datasets: [
      {
        label: 'Number of Records',
        data: statistics?.controllers.map(item => item.count) || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const resultChartData = {
    labels: statistics?.results.map(item => item.result || 'Unknown') || [],
    datasets: [
      {
        label: 'Results',
        data: statistics?.results.map(item => item.count) || [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const dailyChartData = {
    labels: statistics?.daily.map(item => item.date) || [],
    datasets: [
      {
        label: 'Daily Records',
        data: statistics?.daily.map(item => item.count) || [],
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1
      },
    ],
  };

  const measurementChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Measurements by Controller Type',
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
      },
    },
  };

  const measurementChartData = {
    labels: statistics?.measurements.map(item => item.controller_type) || [],
    datasets: [
      {
        label: 'Avg Torque',
        data: statistics?.measurements.map(item => item.avg_torque) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Avg Angle',
        data: statistics?.measurements.map(item => item.avg_angle) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <Row>
      <Col md={6} lg={3} className="mb-4">
        <Card className="h-100">
          <Card.Header>Controller Types</Card.Header>
          <Card.Body>
            {statistics?.controllers.length > 0 ? (
              <Pie data={controllerChartData} />
            ) : (
              <p className="text-center">No data available</p>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6} lg={3} className="mb-4">
        <Card className="h-100">
          <Card.Header>Results Distribution</Card.Header>
          <Card.Body>
            {statistics?.results.length > 0 ? (
              <Pie data={resultChartData} />
            ) : (
              <p className="text-center">No data available</p>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6} lg={3} className="mb-4">
        <Card className="h-100">
          <Card.Header>Daily Activity</Card.Header>
          <Card.Body>
            {statistics?.daily.length > 0 ? (
              <Line data={dailyChartData} />
            ) : (
              <p className="text-center">No data available</p>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6} lg={3} className="mb-4">
        <Card className="h-100">
          <Card.Header>Average Measurements</Card.Header>
          <Card.Body>
            {statistics?.measurements.length > 0 ? (
              <Bar 
                data={measurementChartData} 
                options={measurementChartOptions}
              />
            ) : (
              <p className="text-center">No data available</p>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AuftragStatistics;
