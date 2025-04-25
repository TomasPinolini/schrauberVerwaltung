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
    if (log.type === 'attribute_create') return `Attribut erstellt: ${log.attribute_name}`;
    if (log.type === 'attribute_update') return `Attribut geändert: ${log.attribute_name} (${log.previous_value} → ${log.new_value})`;
    if (log.type === 'attribute_delete') return `Attribut gelöscht: ${log.attribute_name}`;
    return log.attribute_name ? `Attribut: ${log.attribute_name}` : '';
  }
  // screwdriver actions
  if (log.type === 'screwdriver_create') return `Schraubendreher erstellt: ${log.screwdriver_name}`;
  if (log.type === 'screwdriver_update') return `Schraubendreher geändert: ${log.screwdriver_name}`;
  if (log.type === 'screwdriver_delete') return `Schraubendreher gelöscht: ${log.screwdriver_name}`;
  if (log.type === 'screwdriver_activate') return `Schraubendreher aktiviert: ${log.screwdriver_name}`;
  if (log.type === 'screwdriver_deactivate') return `Schraubendreher deaktiviert: ${log.screwdriver_name}`;
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
        <input
          type="text"
          className="border rounded px-2 py-1 text-sm w-full sm:w-64"
          placeholder="Suche nach Name, Attribut oder Aktion..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className={`text-xs px-2 py-1 rounded border ${sortBy==='created_at' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
            onClick={() => setSortBy('created_at')}
          >
            Nach Zeit
          </button>
          <button
            className={`text-xs px-2 py-1 rounded border ${sortBy==='screwdriver_name' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
            onClick={() => setSortBy('screwdriver_name')}
          >
            Nach Name
          </button>
          <button
            className={`text-xs px-1 py-1 rounded border ${sortDir==='desc' ? 'bg-blue-50 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
            title="Absteigend"
            onClick={() => setSortDir('desc')}
          >↓</button>
          <button
            className={`text-xs px-1 py-1 rounded border ${sortDir==='asc' ? 'bg-blue-50 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
            title="Aufsteigend"
            onClick={() => setSortDir('asc')}
          >↑</button>
        </div>
      </div>
      {/* Schraubendreher Aktionen */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6 6M8.464 6.464a5 5 0 017.072 7.072l-7.072-7.072z" /></svg>
          Schraubendreher-Aktionen
        </h3>
        <div className="overflow-x-auto rounded border border-blue-100 bg-blue-50">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortBy('created_at')}>Zeitpunkt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortBy('screwdriver_name')}>Schraubendreher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedScrewdriverLogs.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-4 text-gray-400">Keine Schraubendreher-Aktionen gefunden.</td></tr>
              )}
              {paginatedScrewdriverLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={log.created_at}>
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
      <div>
        <h3 className="text-lg font-semibold mb-2 text-purple-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" /></svg>
          Attribut-Aktionen
        </h3>
        <div className="overflow-x-auto rounded border border-purple-100 bg-purple-50">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortBy('created_at')}>Zeitpunkt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortBy('screwdriver_name')}>Schraubendreher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAttributeLogs.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-4 text-gray-400">Keine Attribut-Aktionen gefunden.</td></tr>
              )}
              {paginatedAttributeLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={log.created_at}>
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