import PropTypes from 'prop-types';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { useState } from 'react';

const AttributeValueList = ({ 
  attributeId, 
  values, 
  onAddValue, 
  onUpdateValue, 
  onDeleteValue,
  loading 
}) => {
  const [editingValue, setEditingValue] = useState(null);
  const [newValue, setNewValue] = useState({ value: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitNew = (e) => {
    e.preventDefault();
    onAddValue(newValue);
    setNewValue({ value: '', description: '' });
    setShowAddForm(false);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    onUpdateValue(editingValue.id, editingValue);
    setEditingValue(null);
  };

  const handleStartEdit = (value) => {
    setEditingValue(value);
    setShowAddForm(false);
  };

  if (!values.length && !showAddForm) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-4">Keine Werte vorhanden</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          <FaPlus /> Wert hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAddForm && (
        <form onSubmit={handleSubmitNew} className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-3">Neuen Wert hinzufügen</h3>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Wert"
                value={newValue.value}
                onChange={(e) => setNewValue(prev => ({ ...prev, value: e.target.value }))}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Beschreibung (optional)"
                value={newValue.description}
                onChange={(e) => setNewValue(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Wird gespeichert...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewValue({ value: '', description: '' });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Beschreibung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {values.map((value) => (
              <tr key={value.id}>
                {editingValue?.id === value.id ? (
                  <td colSpan="3" className="px-6 py-4">
                    <form onSubmit={handleSubmitEdit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={editingValue.value}
                          onChange={(e) => setEditingValue(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full border p-2 rounded"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editingValue.description || ''}
                          onChange={(e) => setEditingValue(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full border p-2 rounded"
                          placeholder="Beschreibung (optional)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          disabled={loading}
                        >
                          {loading ? 'Wird gespeichert...' : 'Speichern'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingValue(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">{value.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{value.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(value)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Bearbeiten"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onDeleteValue(value.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Löschen"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showAddForm && values.length > 0 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Wert hinzufügen
        </button>
      )}
    </div>
  );
};

AttributeValueList.propTypes = {
  attributeId: PropTypes.number.isRequired,
  values: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      value: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  onAddValue: PropTypes.func.isRequired,
  onUpdateValue: PropTypes.func.isRequired,
  onDeleteValue: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

export default AttributeValueList; 