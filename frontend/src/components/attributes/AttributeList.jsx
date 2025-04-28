import PropTypes from 'prop-types';
import { FaEdit, FaToggleOn, FaToggleOff, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useState } from 'react';

const AttributeList = ({ 
  attributes, 
  onEdit, 
  onToggleState, 
  onSort, 
  sortConfig, 
  onResetSort, 
  filterText: propsFilterText, 
  setFilterText: propsSetFilterText 
}) => {
  const [filterText, setFilterText] = useState(propsFilterText !== undefined ? propsFilterText : '');
  const [internalFilterText, internalSetFilterText] = useState('');

  const handleResetFilter = () => {
    if (propsSetFilterText !== undefined) {
      propsSetFilterText('');
    } else {
      internalSetFilterText('');
    }
  };

  const filteredAttributes = attributes.filter(attr => 
    attr.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (attr.description && attr.description.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleToggleClick = (attribute) => {
    console.log('Toggle button clicked for attribute:', attribute);
    onToggleState(attribute);
  };

  if (!filteredAttributes.length) {
    return (
      <div className="p-4">
        <input
          type="text"
          placeholder="Filter attributes..."
          className="px-3 py-2 border rounded w-64 mb-4"
          value={filterText}
          onChange={e => {
            if (propsSetFilterText !== undefined) {
              propsSetFilterText(e.target.value);
            } else {
              internalSetFilterText(e.target.value);
            }
          }}
        />

        <div className="text-gray-500">Keine Attribute gefunden.</div>
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
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 whitespace-nowrap"
      onClick={() => onSort(columnName)}
    >
      <div className="flex items-center">
        {displayName}
        {getSortIcon(columnName)}
      </div>
    </th>
  );

  return (
    <div className="mb-4 w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="Filter attributes..."
          className="px-2 py-1 border rounded w-64 text-sm"
          value={filterText}
          onChange={e => {
            if (propsSetFilterText !== undefined) {
              propsSetFilterText(e.target.value);
            } else {
              internalSetFilterText(e.target.value);
            }
          }}
        />
      </div>
      <div className="overflow-x-auto bg-white rounded shadow flex-1 min-h-0">
        <table className="min-w-full w-full table-fixed text-sm">
          <colgroup>
            <col style={{width: '10%'}} />
            <col style={{width: '20%'}} />
            <col style={{width: '24%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '8%'}} />
            <col style={{width: '8%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '9%'}} />
          </colgroup>
          <thead className="bg-gray-100">
            <tr>
              {renderSortableHeader('name', 'Name')}
              {renderSortableHeader('description', 'Beschreibung')}
              {renderSortableHeader('validation_pattern', 'Validierung')}
              {renderSortableHeader('is_required', 'Erforderlich')}
              {renderSortableHeader('is_parent', 'Eltern')}
              {renderSortableHeader('unique', 'Eindeutig')}
              {renderSortableHeader('state', 'Status')}
              <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAttributes.map((attribute) => (
              <tr key={attribute.id} className={attribute.state === 'off' ? 'bg-gray-50' : ''}>
                <td className="px-2 py-2 whitespace-nowrap">{attribute.name}</td>
                <td className="px-2 py-2 whitespace-nowrap">{attribute.description || '-'}</td>
                <td className="px-2 py-2 whitespace-nowrap">{attribute.validation_pattern || '-'}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center">{attribute.is_required ? <span className="text-green-600 text-lg" title="Ja">✔️</span> : <span className="text-red-600 text-lg" title="Nein">❌</span>}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center">{attribute.is_parent ? <span className="text-green-600 text-lg" title="Ja">✔️</span> : <span className="text-red-600 text-lg" title="Nein">❌</span>}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center">{Boolean(attribute.unique) ? <span className="text-green-600 text-lg" title="Ja">✔️</span> : <span className="text-red-600 text-lg" title="Nein">❌</span>}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleToggleClick(attribute)}
                      className="text-xl mr-2"
                      title={attribute.state === 'on' ? 'Aktiv (Klicken zum Deaktivieren)' : 'Inaktiv (Klicken zum Aktivieren)'}
                    >
                      {attribute.state === 'on' ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-red-500" />
                      )}
                    </button>
                    <span className={`text-xs ${attribute.state === 'on' ? 'text-green-600' : 'text-red-600'}`}>
                      {attribute.state === 'on' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(attribute)}
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

AttributeList.propTypes = {
  attributes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      validation_pattern: PropTypes.string,
      is_required: PropTypes.bool.isRequired,
      is_parent: PropTypes.bool.isRequired,
      unique: PropTypes.bool,
      state: PropTypes.oneOf(['on', 'off']).isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggleState: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  onResetSort: PropTypes.func.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  }),
  filterText: PropTypes.string,
  setFilterText: PropTypes.func
};

export default AttributeList; 