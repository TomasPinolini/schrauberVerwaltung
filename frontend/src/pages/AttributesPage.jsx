import { useEffect, useState } from 'react';
import axios from 'axios';

const validTypes = ['string', 'number', 'boolean', 'date'];

const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    data_type: '',
    validation_pattern: '',
    is_required: false
  });

  const fetchAttributes = () => {
    axios.get('/api/attributes?include_inactive=true').then(res => setAttributes(res.data));
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.data_type) return;

    if (editingId) {
      await axios.put(`/api/attributes/${editingId}`, formData);
    } else {
      await axios.post('/api/attributes', formData);
    }

    setFormData({
      name: '',
      description: '',
      data_type: '',
      validation_pattern: '',
      is_required: false
    });
    setEditingId(null);
    fetchAttributes();
  };

  const handleEdit = (attr) => {
    setEditingId(attr.id);
    setFormData({
      name: attr.name,
      description: attr.description ?? '',
      data_type: attr.data_type,
      validation_pattern: attr.validation_pattern ?? '',
      is_required: attr.is_required ?? false
    });
  };

  const handleToggleState = async (attr) => {
    await axios.put(`/api/attributes/${attr.id}`, {
      ...attr,
      state: attr.state === 'on' ? 'off' : 'on'
    });
    fetchAttributes();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{editingId ? 'Edit' : 'Add'} Attribute</h2>
      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-xl">
        <input
          className="w-full border p-2 rounded"
          placeholder="Attribute Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <select
          className="w-full border p-2 rounded"
          value={formData.data_type}
          onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
        >
          <option value="">Select Type</option>
          {validTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input
          className="w-full border p-2 rounded"
          placeholder="Validation Regex (optional)"
          value={formData.validation_pattern}
          onChange={(e) => setFormData({ ...formData, validation_pattern: e.target.value })}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_required}
            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
          />
          <span>Required?</span>
        </label>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          {editingId ? 'Update' : 'Create'}
        </button>
      </form>

      <h2 className="text-2xl font-semibold mt-10">Attributes</h2>
      <table className="min-w-full text-sm border mt-2">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Required</th>
            <th className="p-2 border">State</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attributes.map(attr => (
            <tr key={attr.id} className="bg-white border-b">
              <td className="p-2 border">{attr.name}</td>
              <td className="p-2 border">{attr.data_type}</td>
              <td className="p-2 border">{attr.is_required ? 'Yes' : 'No'}</td>
              <td className="p-2 border">
                <span className={attr.state === 'on' ? 'text-green-600' : 'text-red-600'}>
                  {attr.state}
                </span>
              </td>
              <td className="p-2 border space-x-2">
                <button onClick={() => handleEdit(attr)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                <button onClick={() => handleToggleState(attr)} className="px-2 py-1 bg-gray-600 text-white rounded">
                  {attr.state === 'on' ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttributesPage;
