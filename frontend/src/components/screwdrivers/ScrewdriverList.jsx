import PropTypes from 'prop-types';
import { FaEdit, FaToggleOn, FaToggleOff, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const ScrewdriverList = ({ screwdrivers, attributes, onEdit, onToggleState, onSort, sortConfig, onResetSort }) => {
  // Filter only active attributes
  const activeAttributes = attributes.filter(attr => attr.state === 'on');

  if (!screwdrivers.length) {
    return (
      <div className="text-center py-8 bg-white rounded shadow">
        <p className="text-gray-500">Keine Schraubendreher gefunden.</p>
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
          {screwdrivers.map((screwdriver) => (
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