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
  if (log.previous_value == null) return 'Created';
  if (log.is_current) return 'Current';
  return 'History';
};

const getActionDetails = (log) => {
  if (log.previous_value == null) return 'Initial configuration';
  return `${log.attribute_name}: ${log.previous_value} → ${log.new_value}`;
};

const getActionTag = (log) => {
  switch (log.type) {
    case 'screwdriver_create':
      return { label: 'Erstellt', color: 'bg-green-100 text-green-800' };
    case 'screwdriver_update':
      return { label: 'Bearbeitet', color: 'bg-blue-100 text-blue-800' };
    case 'screwdriver_delete':
      return { label: 'Gelöscht', color: 'bg-red-100 text-red-800' };
    case 'screwdriver_activate':
      return { label: 'Aktiviert', color: 'bg-green-100 text-green-800' };
    case 'screwdriver_deactivate':
      return { label: 'Deaktiviert', color: 'bg-red-100 text-red-800' };
    case 'attribute_create':
      return { label: 'Attribut erstellt', color: 'bg-green-100 text-green-800' };
    case 'attribute_update':
      return { label: 'Attribut bearbeitet', color: 'bg-blue-100 text-blue-800' };
    case 'attribute_delete':
      return { label: 'Attribut gelöscht', color: 'bg-red-100 text-red-800' };
    default:
      break;
  }
  const actionType = getActionType(log);
  if (actionType === 'Created') return { label: 'Erstellt', color: 'bg-green-100 text-green-800' };
  if (actionType === 'Current') return { label: 'Aktuell', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Historie', color: 'bg-gray-100 text-gray-800' };
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
                {(() => {
                  const tag = getActionTag(log);
                  return (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tag.color}`}>
                      {tag.label}
                    </span>
                  );
                })()}
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
    new_value: PropTypes.string.isRequired,
    previous_value: PropTypes.string,
    is_current: PropTypes.bool
  })).isRequired,
  loading: PropTypes.bool.isRequired
};

export default ActivityLog; 