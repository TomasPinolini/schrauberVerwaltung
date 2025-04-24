import PropTypes from 'prop-types';
import { FaEdit, FaToggleOn, FaToggleOff, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import React from 'react';

const AttributeList = ({
  attributes,
  loading,
  onSelect,
  onUpdate,
  onDelete,
  selectedAttribute
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!attributes.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Keine Attribute vorhanden</p>
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
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Typ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attributes.map((attribute) => (
              <tr
                key={attribute.id}
                onClick={() => onSelect(attribute)}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedAttribute?.id === attribute.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {attribute.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {attribute.data_type}
                    {attribute.is_parent && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Parent
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    attribute.state === 'on'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {attribute.state === 'on' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(attribute.id, {
                        ...attribute,
                        state: attribute.state === 'on' ? 'off' : 'on'
                      });
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    {attribute.state === 'on' ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(attribute.id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Löschen
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
      data_type: PropTypes.oneOf(['string', 'number', 'boolean', 'date']).isRequired,
      validation_pattern: PropTypes.string,
      is_required: PropTypes.bool.isRequired,
      is_parent: PropTypes.bool.isRequired,
      state: PropTypes.oneOf(['on', 'off']).isRequired,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  selectedAttribute: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }),
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  })
};

export default AttributeList; 