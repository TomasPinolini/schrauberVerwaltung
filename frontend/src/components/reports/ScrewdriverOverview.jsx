import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, className }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
    <h4 className="text-sm font-medium text-gray-500">{title}</h4>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const ScrewdriverOverview = ({ 
  totalCount, 
  activeCount, 
  inactiveCount
}) => {
  const [parentAttributes, setParentAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stateFilter, setStateFilter] = useState('all');

  useEffect(() => {
    const fetchParentAttributes = async () => {
      try {
        const response = await axios.get('/api/screwdrivers/parent-attributes');
        setParentAttributes(response.data);
        if (response.data.length > 0) {
          setSelectedAttribute(response.data[0].id);
        }
      } catch (err) {
        setError('Fehler beim Laden der Attribute');
        console.error('Error fetching parent attributes:', err);
      }
    };

    fetchParentAttributes();
  }, []);

  useEffect(() => {
    const fetchDistribution = async () => {
      if (!selectedAttribute) return;
      setLoading(true);
      try {
        // Fetch for all, active, and inactive
        const [activeRes, inactiveRes] = await Promise.all([
          axios.get(`/api/screwdrivers/parent-attributes/${selectedAttribute}/distribution?state=active`),
          axios.get(`/api/screwdrivers/parent-attributes/${selectedAttribute}/distribution?state=inactive`)
        ]);
        setDistribution({
          active: activeRes.data,
          inactive: inactiveRes.data
        });
        setError(null);
      } catch (err) {
        setError('Fehler beim Laden der Verteilung');
        console.error('Error fetching distribution:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDistribution();
  }, [selectedAttribute]);

  const chartData = distribution ? {
    labels: distribution.active.distribution.map(item => item.value),
    datasets: [
      {
        label: 'Aktiv',
        data: distribution.active.distribution.map(item => item.count),
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderColor: 'rgba(34,197,94,1)',
        borderWidth: 1
      },
      {
        label: 'Inaktiv',
        data: distribution.inactive.distribution.map(item => item.count),
        backgroundColor: 'rgba(239,68,68,0.7)',
        borderColor: 'rgba(239,68,68,1)',
        borderWidth: 1
      }
    ]
  } : {
    labels: [],
    datasets: []
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: distribution ? `Verteilung nach ${distribution.active.attributeName}` : 'Verteilung'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Gesamtanzahl Schraubendreher" 
          value={totalCount}
          className="border-l-4 border-blue-500"
        />
        <StatCard 
          title="Aktive Schraubendreher" 
          value={activeCount}
          className="border-l-4 border-green-500"
        />
        <StatCard 
          title="Inaktive Schraubendreher" 
          value={inactiveCount}
          className="border-l-4 border-red-500"
        />
      </div>

      {/* Attribute Selection and Bar Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4">
          <label htmlFor="attribute-select" className="block text-sm font-medium text-gray-700">
            Attribut auswählen
          </label>
          <select
            id="attribute-select"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedAttribute || ''}
            onChange={e => setSelectedAttribute(e.target.value)}
          >
            {parentAttributes.map(attr => (
              <option key={attr.id} value={attr.id}>
                {attr.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Daten werden geladen...</p>
          </div>
        ) : (
          distribution && (
            <div style={{ maxHeight: 420, minHeight: 250 }}>
              <Bar options={{ ...chartOptions, maintainAspectRatio: false }} data={
                stateFilter === 'all' ? chartData : {
                  labels: distribution[stateFilter]?.distribution.map(item => item.value) || [],
                  datasets: [
                    {
                      label: stateFilter === 'active' ? 'Aktiv' : 'Inaktiv',
                      data: distribution[stateFilter]?.distribution.map(item => item.count) || [],
                      backgroundColor: stateFilter === 'active' ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)',
                      borderColor: stateFilter === 'active' ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)',
                      borderWidth: 1
                    }
                  ]
                }
              } height={320} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  className: PropTypes.string,
};

ScrewdriverOverview.propTypes = {
  totalCount: PropTypes.number.isRequired,
  activeCount: PropTypes.number.isRequired,
  inactiveCount: PropTypes.number.isRequired
};

export default ScrewdriverOverview;