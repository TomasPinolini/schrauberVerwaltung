import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FaEdit, FaToggleOn, FaToggleOff, FaSort, FaSortUp, FaSortDown, FaDownload, FaSearch, FaTimes } from 'react-icons/fa';

const ScrewdriverList = ({ screwdrivers, attributes, onEdit, onToggleState, onSort, sortConfig, onResetSort, filterText, setFilterText }) => {
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Reset selected rows when screwdrivers change
  useEffect(() => {
    setSelectedRows([]);
  }, [screwdrivers]);

  const handleResetFilter = () => {
    setFilterText('');
    setAdvancedFilters({});
  };

  // Filter only active attributes
  const activeAttributes = attributes.filter(attr => attr.state === 'on');

  // Apply all filters
  const filteredScrewdrivers = screwdrivers.filter(screwdriver => {
    // Basic text filter
    const basicFilterPassed = !filterText || [
      screwdriver.name,
      ...activeAttributes.map(attr => 
        screwdriver.Attributes?.find(a => a.id === attr.id)?.ScrewdriverAttribute?.value || ''
      )
    ].some(value => value.toLowerCase().includes(filterText.toLowerCase()));
    
    // Advanced attribute filters
    const advancedFilterPassed = Object.entries(advancedFilters).every(([attrId, filterValue]) => {
      if (!filterValue) return true;
      const attrValue = screwdriver.Attributes?.find(a => a.id === parseInt(attrId))?.ScrewdriverAttribute?.value || '';
      return attrValue.toLowerCase().includes(filterValue.toLowerCase());
    });
    
    return basicFilterPassed && advancedFilterPassed;
  });

  // Export selected screwdrivers to CSV
  const exportToCSV = () => {
    const rowsToExport = selectedRows.length > 0 
      ? filteredScrewdrivers.filter(s => selectedRows.includes(s.id))
      : filteredScrewdrivers;
      
    if (rowsToExport.length === 0) return;
    
    // Create headers
    const headers = [
      'ID', 'Name', 'Status', 
      ...activeAttributes.map(attr => attr.name)
    ];
    
    // Create rows
    const rows = rowsToExport.map(screwdriver => [
      screwdriver.id,
      screwdriver.name,
      screwdriver.state === 'on' ? 'Aktiv' : 'Inaktiv',
      ...activeAttributes.map(attr => {
        return screwdriver.Attributes?.find(a => a.id === attr.id)?.ScrewdriverAttribute?.value || '';
      })
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `schraubendreher_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Toggle selection of all rows
  const toggleSelectAll = () => {
    if (selectedRows.length === filteredScrewdrivers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredScrewdrivers.map(s => s.id));
    }
  };
  
  // Toggle selection of a single row
  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Show a message if no results but keep input visible
  if (!filteredScrewdrivers.length) {
    return (
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filter Schraubendreher..."
              className="pl-10 pr-10 py-2 border rounded w-full"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
            {filterText && (
              <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={handleResetFilter}
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <button 
            className="px-3 py-2 text-sm border rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FaSearch className="text-xs" />
            {showAdvancedFilters ? 'Einfache Suche' : 'Erweiterte Suche'}
          </button>
        </div>
        
        {showAdvancedFilters && (
          <div className="mb-4 p-3 border rounded bg-gray-50">
            <h3 className="font-medium mb-2">Nach Attributen filtern</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeAttributes.map(attr => (
                <div key={attr.id} className="flex flex-col">
                  <label className="text-sm font-medium mb-1">{attr.name}</label>
                  <input
                    type="text"
                    className="px-3 py-1 border rounded text-sm"
                    placeholder={`Filter nach ${attr.name}...`}
                    value={advancedFilters[attr.id] || ''}
                    onChange={e => setAdvancedFilters({
                      ...advancedFilters,
                      [attr.id]: e.target.value
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-gray-500 p-4 text-center border rounded bg-gray-50">
          Keine Schraubendreher gefunden. Bitte passen Sie Ihre Filterkriterien an.
        </div>
      </div>
    );
  }

  const getSortIcon = (columnName) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ml-1 text-blue-600" /> : 
      <FaSortDown className="ml-1 text-blue-600" />;
  };

  const renderSortableHeader = (columnName, displayName) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => onSort(columnName)}
    >
      <div className="flex items-center">
        {displayName}
        {getSortIcon(columnName)}
      </div>
    </th>
  );

  return (
    <div className="mb-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filter Schraubendreher..."
              className="pl-10 pr-10 py-2 border rounded w-full"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
            {filterText && (
              <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={handleResetFilter}
                title="Filter zurücksetzen"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <button 
            className="px-3 py-2 text-sm border rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FaSearch className="text-xs" />
            {showAdvancedFilters ? 'Einfache Suche' : 'Erweiterte Suche'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {selectedRows.length > 0 
              ? `${selectedRows.length} von ${filteredScrewdrivers.length} ausgewählt` 
              : `${filteredScrewdrivers.length} Einträge gefunden`}
          </span>
          <button
            onClick={exportToCSV}
            className="px-3 py-2 text-sm border rounded bg-green-50 text-green-600 hover:bg-green-100 flex items-center gap-1"
            title={selectedRows.length > 0 
              ? `${selectedRows.length} ausgewählte Einträge exportieren` 
              : 'Alle angezeigten Einträge exportieren'}
            disabled={filteredScrewdrivers.length === 0}
          >
            <FaDownload className="text-xs" />
            CSV Export
          </button>
        </div>
      </div>
      
      {showAdvancedFilters && (
        <div className="mb-4 p-3 border rounded bg-gray-50">
          <h3 className="font-medium mb-2">Nach Attributen filtern</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAttributes.map(attr => (
              <div key={attr.id} className="flex flex-col">
                <label className="text-sm font-medium mb-1">{attr.name}</label>
                <input
                  type="text"
                  className="px-3 py-1 border rounded text-sm"
                  placeholder={`Filter nach ${attr.name}...`}
                  value={advancedFilters[attr.id] || ''}
                  onChange={e => setAdvancedFilters({
                    ...advancedFilters,
                    [attr.id]: e.target.value
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto bg-white rounded shadow flex-1 min-h-0">
        <table className={`min-w-full w-full table-fixed text-sm`.trim()}>
          <colgroup>
            <col style={{width: '3%'}} /> {/* Checkbox column */}
            <col style={{width: '10%'}} /> {/* Name column */}
            {activeAttributes.map(attr =>
              ['is_required', 'is_parent', 'unique'].includes(attr.name)
                ? <col key={attr.id} style={{width: '5%'}} />
                : <col key={attr.id} style={{width: '15%'}} />
            )}
            <col style={{width: '8%'}} /> {/* Status column */}
            <col style={{width: '8%'}} /> {/* Actions column */}
          </colgroup>
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedRows.length === filteredScrewdrivers.length && filteredScrewdrivers.length > 0}
                  onChange={toggleSelectAll}
                  className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                />
              </th>
              {renderSortableHeader('name', 'Name')}
              {activeAttributes.map(attr => (
                renderSortableHeader(`attribute_${attr.id}`, attr.name)
              ))}
              <th className="px-1 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-1 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredScrewdrivers.map((screwdriver) => (
              <tr 
                key={screwdriver.id} 
                className={`${screwdriver.state === 'off' ? 'bg-gray-50' : ''} ${selectedRows.includes(screwdriver.id) ? 'bg-blue-50' : ''} hover:bg-gray-100`}
              >
                <td className="px-2 py-2 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.includes(screwdriver.id)}
                    onChange={() => toggleSelectRow(screwdriver.id)}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                  />
                </td>
                <td className="px-2 py-2 whitespace-nowrap font-medium">{screwdriver.name}</td>
                {activeAttributes.map(attr => {
                  const value = screwdriver.Attributes?.find(a => a.id === attr.id)?.ScrewdriverAttribute?.value;
                  if (["is_required", "is_parent", "unique"].includes(attr.name)) {
                    // boolean columns
                    return <td key={attr.id} className="px-2 py-2 whitespace-nowrap text-center">{value === 'true' || value === true ? <span className="text-green-600 text-lg" title="Ja">✔️</span> : <span className="text-red-600 text-lg" title="Nein">❌</span>}</td>;
                  }
                  return <td key={attr.id} className="px-2 py-2 whitespace-nowrap">{value || '-'}</td>;
                })}
                <td className="px-1 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleState(screwdriver)}
                      className="text-xl mr-2"
                      title={screwdriver.state === 'on' ? 'Aktiv (Klicken zum Deaktivieren)' : 'Inaktiv (Klicken zum Aktivieren)'}
                    >
                      {screwdriver.state === 'on' ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-red-500" />
                      )}
                    </button>
                    <span className={`text-xs ${screwdriver.state === 'on' ? 'text-green-600' : 'text-red-600'}`}>
                      {screwdriver.state === 'on' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </td>
                <td className="px-1 py-2 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(screwdriver)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                    title="Bearbeiten"
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredScrewdrivers.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {filteredScrewdrivers.length} Einträge gefunden
        </div>
      )}
    </div>
  );
};

ScrewdriverList.propTypes = {
  screwdrivers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      state: PropTypes.oneOf(['on', 'off']).isRequired,
      Attributes: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          ScrewdriverAttribute: PropTypes.shape({
            value: PropTypes.string.isRequired
          })
        })
      )
    })
  ).isRequired,
  attributes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      state: PropTypes.oneOf(['on', 'off']).isRequired
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggleState: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  onResetSort: PropTypes.func.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  })
};

export default ScrewdriverList;