import React from 'react';
import PropTypes from 'prop-types';

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getActionType = (log) => {
  if (!log.previous_value) return 'Neu';
  if (log.previous_value === 'on' || log.previous_value === 'off') return 'Status';
  return 'Update';
};

const getActionDetails = (log) => {
  if (!log.previous_value) return 'Neue Konfiguration erstellt';
  if (log.previous_value === 'on') return 'Aktiv → Inaktiv';
  if (log.previous_value === 'off') return 'Inaktiv → Aktiv';
  return `${log.attribute_name}: ${log.previous_value} → ${log.new_value}`;
};

const ActivityLog = ({ logs, loading }) => {
  if (loading) {
    return <p className="text-gray-600">Protokoll wird geladen...</p>;
  }

  if (!logs.length) {
    return <p className="text-gray-600">Keine Aktivitäten gefunden.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Zeitpunkt
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktion
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Schraubendreher
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDateTime(log.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${getActionType(log) === 'Neu' ? 'bg-green-100 text-green-800' : 
                    getActionType(log) === 'Status' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'}`}>
                  {getActionType(log)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.screwdriver_name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {getActionDetails(log)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ActivityLog.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string.isRequired,
    screwdriver_name: PropTypes.string.isRequired,
    attribute_name: PropTypes.string,
    previous_value: PropTypes.string,
    new_value: PropTypes.string
  })).isRequired,
  loading: PropTypes.bool.isRequired
};

export default ActivityLog; 