import React, { useState, useMemo } from 'react';
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

const getActionEntity = (log) => {
  if (log.type && log.type.startsWith('attribute_')) return 'attribute';
  return 'screwdriver';
};

const getActionDetails = (log) => {
  if (getActionEntity(log) === 'attribute') {
    if (log.type === 'attribute_create') return `Erstellt: ${log.attribute_name}`;
    if (log.type === 'attribute_update') return `Geändert: ${log.previous_value} → ${log.new_value}`;
    if (log.type === 'attribute_delete') return `Gelöscht: ${log.attribute_name}`;
    return log.attribute_name ? log.attribute_name : '';
  }
  // screwdriver actions
  if (log.type === 'screwdriver_create') return '';
  if (log.type === 'screwdriver_update') return log.attribute_name && log.previous_value != null ? `${log.attribute_name}: ${log.previous_value} → ${log.new_value}` : '';
  if (log.type === 'screwdriver_delete') return '';
  if (log.type === 'screwdriver_activate') return '';
  if (log.type === 'screwdriver_deactivate') return '';
  if (log.previous_value == null && log.new_value) return `Initialwert: ${log.new_value}`;
  if (log.attribute_name && log.previous_value != null) return `${log.attribute_name}: ${log.previous_value} → ${log.new_value}`;
  return '';
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
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination state
  const [screwPage, setScrewPage] = useState(1);
  const [attrPage, setAttrPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (search) {
      const lower = search.toLowerCase();
      filtered = logs.filter(log =>
        (log.screwdriver_name && log.screwdriver_name.toLowerCase().includes(lower)) ||
        (log.attribute_name && log.attribute_name.toLowerCase().includes(lower)) ||
        (log.type && log.type.toLowerCase().includes(lower)) ||
        (log.new_value && log.new_value.toLowerCase().includes(lower))
      );
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'created_at') {
        return sortDir === 'desc'
          ? new Date(b.created_at) - new Date(a.created_at)
          : new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === 'screwdriver_name') {
        return sortDir === 'desc'
          ? b.screwdriver_name.localeCompare(a.screwdriver_name)
          : a.screwdriver_name.localeCompare(b.screwdriver_name);
      }
      return 0;
    });
    return filtered;
  }, [logs, search, sortBy, sortDir]);

  const screwdriverLogs = filteredLogs.filter(log => getActionEntity(log) === 'screwdriver');
  const attributeLogs = filteredLogs.filter(log => getActionEntity(log) === 'attribute');

  const paginatedScrewdriverLogs = useMemo(() => {
    const start = (screwPage - 1) * PAGE_SIZE;
    return screwdriverLogs.slice(start, start + PAGE_SIZE);
  }, [screwdriverLogs, screwPage]);

  const paginatedAttributeLogs = useMemo(() => {
    const start = (attrPage - 1) * PAGE_SIZE;
    return attributeLogs.slice(start, start + PAGE_SIZE);
  }, [attributeLogs, attrPage]);

  const screwTotalPages = Math.ceil(screwdriverLogs.length / PAGE_SIZE) || 1;
  const attrTotalPages = Math.ceil(attributeLogs.length / PAGE_SIZE) || 1;

  if (loading) {
    return <p className="text-gray-600">Protokoll wird geladen...</p>;
  }

  if (!logs.length) {
    return <p className="text-gray-600">Keine Aktivitäten gefunden.</p>;
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Schraubendreher Aktionen */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-lg font-semibold mb-2 text-blue-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6 6M8.464 6.464a5 5 0 017.072 7.072l-7.072-7.072z" /></svg>
          Schraubendreher-Aktionen
        </h3>
        <div className="overflow-x-auto rounded border border-blue-100 bg-blue-50 flex-1 min-h-0">
          <table className="min-w-full w-full table-fixed divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                    onClick={() => setSortBy('created_at')}>Zeitpunkt</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aktion</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                    onClick={() => setSortBy('screwdriver_name')}>Schraubendreher</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedScrewdriverLogs.length === 0 && (
                <tr><td colSpan={3} className="px-2 py-2 text-gray-400">Keine Schraubendreher-Aktionen gefunden.</td></tr>
              )}
              {paginatedScrewdriverLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap text-gray-500" title={log.created_at}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {(() => {
                      const tag = getActionTag(log);
                      return (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tag.color}`}>
                          {tag.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-900">
                    {log.screwdriver_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination for screwdriver logs */}
          {screwTotalPages > 1 && (
            <div className="flex justify-end gap-2 py-2">
              <button className="px-2 py-1 rounded border text-xs bg-white" disabled={screwPage === 1} onClick={() => setScrewPage(p => p - 1)}>&lt;</button>
              <span className="text-xs">Seite {screwPage} / {screwTotalPages}</span>
              <button className="px-2 py-1 rounded border text-xs bg-white" disabled={screwPage === screwTotalPages} onClick={() => setScrewPage(p => p + 1)}>&gt;</button>
            </div>
          )}
        </div>
      </div>
      {/* Attribut Aktionen */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-lg font-semibold mb-2 text-purple-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" /></svg>
          Attribut-Aktionen
        </h3>
        <div className="overflow-x-auto rounded border border-purple-100 bg-purple-50 flex-1 min-h-0">
          <table className="min-w-full w-full table-fixed divide-y divide-gray-200 text-sm">
            <thead className="bg-purple-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                    onClick={() => setSortBy('created_at')}>Zeitpunkt</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aktion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAttributeLogs.length === 0 && (
                <tr><td colSpan={2} className="px-2 py-2 text-gray-400">Keine Attribut-Aktionen gefunden.</td></tr>
              )}
              {paginatedAttributeLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap text-gray-500" title={log.created_at}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {(() => {
                      const tag = getActionTag(log);
                      return (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tag.color}`}>
                          {tag.label}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination for attribute logs */}
          {attrTotalPages > 1 && (
            <div className="flex justify-end gap-2 py-2">
              <button className="px-2 py-1 rounded border text-xs bg-white" disabled={attrPage === 1} onClick={() => setAttrPage(p => p - 1)}>&lt;</button>
              <span className="text-xs">Seite {attrPage} / {attrTotalPages}</span>
              <button className="px-2 py-1 rounded border text-xs bg-white" disabled={attrPage === attrTotalPages} onClick={() => setAttrPage(p => p + 1)}>&gt;</button>
            </div>
          )}
        </div>
      </div>
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