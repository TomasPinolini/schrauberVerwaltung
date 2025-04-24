import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const validTypes = ['string', 'number', 'boolean', 'date'];

const AttributeForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    data_type: 'text',
    is_parent: false,
    state: 'on'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="data_type" className="block text-sm font-medium text-gray-700">
            Datentyp
          </label>
          <select
            name="data_type"
            id="data_type"
            value={formData.data_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Nummer</option>
            <option value="boolean">Boolean</option>
            <option value="date">Datum</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_parent"
            id="is_parent"
            checked={formData.is_parent}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_parent" className="ml-2 block text-sm text-gray-900">
            Parent Attribut
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="state"
            id="state"
            checked={formData.state === 'on'}
            onChange={(e) => handleChange({
              target: {
                name: 'state',
                value: e.target.checked ? 'on' : 'off'
              }
            })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="state" className="ml-2 block text-sm text-gray-900">
            Aktiv
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {initialData ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
};

AttributeForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    data_type: PropTypes.oneOf(['text', 'number', 'boolean', 'date']).isRequired,
    is_parent: PropTypes.bool.isRequired,
    state: PropTypes.oneOf(['on', 'off']).isRequired,
  }),
  onCancel: PropTypes.func.isRequired,
};

export default AttributeForm; 