import PropTypes from 'prop-types';
import { useState } from 'react';
import { FaEdit, FaToggleOn, FaToggleOff, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const ScrewdriverList = ({ screwdrivers, attributes, onEdit, onToggleState, onSort, sortConfig, onResetSort }) => {
  const [filterText, setFilterText] = useState('');

  const handleResetFilter = () => setFilterText('');

  // Filter only active attributes
  const activeAttributes = attributes.filter(attr => attr.state === 'on');

  const filteredScrewdrivers = screwdrivers.filter(screwdriver => {
    const nameMatch = screwdriver.name.toLowerCase().includes(filterText.toLowerCase());
    const attributeMatch = activeAttributes.some(attr => {
      const attrValue = screwdriver.Attributes?.find(a => a.id === attr.id)?.ScrewdriverAttribute?.value || '';
      return attrValue.toLowerCase().includes(filterText.toLowerCase());
    });
    return nameMatch || attributeMatch;
  });

  // Show a message if no results but keep input visible
  if (!filteredScrewdrivers.length) {
    return (
      <div className="p-4">
        <input
          type="text"
          placeholder="Filter Schraubendreher..."
          className="px-3 py-2 border rounded w-64 mb-4"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />

        <div className="text-gray-500">Keine Schraubendreher gefunden.</div>
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
      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="Filter Schraubendreher..."
          className="px-3 py-2 border rounded w-64"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              {renderSortableHeader('name', 'Name')}
              {activeAttributes.map(attr => (
                <th 
                  key={attr.id} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => onSort(`attribute_${attr.id}`)}
                >
                  <div className="flex items-center">
                    {attr.name}
                    {getSortIcon(`attribute_${attr.id}`)}
                  </div>
                </th>
              ))}
              {renderSortableHeader('state', 'Status')}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredScrewdrivers.map((screwdriver) => (
              <tr key={screwdriver.id} className={screwdriver.state === 'off' ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">{screwdriver.name}</td>
                {activeAttributes.map(attr => {
                  const attributeValue = screwdriver.Attributes?.find(a => a.id === attr.id)?.ScrewdriverAttribute?.value || '-';
                  return (
                    <td key={attr.id} className="px-6 py-4 whitespace-nowrap">
                      {attributeValue}
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleState(screwdriver)}
                      className="text-2xl mr-2"
                      title={screwdriver.state === 'on' ? 'Aktiv (Klicken zum Deaktivieren)' : 'Inaktiv (Klicken zum Aktivieren)'}
                    >
                      {screwdriver.state === 'on' ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-red-500" />
                      )}
                    </button>
                    <span className={`text-sm ${screwdriver.state === 'on' ? 'text-green-600' : 'text-red-600'}`}>
                      {screwdriver.state === 'on' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(screwdriver)}
                    className="text-blue-600 hover:text-blue-800"
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