import { useEffect, useState } from 'react';
import axios from 'axios';
import AttributeForm from '../components/attributes/AttributeForm';
import AttributeList from '../components/attributes/AttributeList';

const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    validation_pattern: '',
    is_required: false,
    is_parent: false
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [sortConfig, setSortConfig] = useState(null);

  const sortAttributes = (attrs, config) => {
    if (!config) return attrs;

    return [...attrs].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convert booleans to strings for consistent sorting
      if (typeof aValue === 'boolean') aValue = aValue ? '1' : '0';
      if (typeof bValue === 'boolean') bValue = bValue ? '1' : '0';

      // Convert everything to strings for consistent sorting
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const fetchAttributes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/attributes?include_inactive=true');
      const filteredAttributes = res.data.filter(attribute => {
        if (filter === 'active') return attribute.state === 'on';
        if (filter === 'inactive') return attribute.state === 'off';
        return true; // 'all' filter
      });
      const sortedAttributes = sortAttributes(filteredAttributes, sortConfig);
      setAttributes(sortedAttributes);
    } catch (err) {
      setError('Fehler beim Laden der Attribute. Bitte versuchen Sie es später erneut.');
      console.error('Error fetching attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [filter, sortConfig]); // Re-fetch when filter or sort changes

  const handleSort = (key) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const handleResetSort = () => {
    setSortConfig(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      validation_pattern: '',
      is_required: false,
      is_parent: false
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name ist erforderlich.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/attributes/${editingId}`, formData);
      } else {
        await axios.post('/api/attributes', formData);
      }
      setFormData({
        name: '',
        description: '',
        validation_pattern: '',
        is_required: false,
        is_parent: false
      });
      setEditingId(null);
      await fetchAttributes();
    } catch (err) {
      setError('Fehler beim Speichern des Attributs. Bitte versuchen Sie es später erneut.');
      console.error('Error saving attribute:', err);
    }
  };

  const handleEdit = (attribute) => {
    setEditingId(attribute.id);
    setFormData({
      name: attribute.name,
      description: attribute.description || '',
      validation_pattern: attribute.validation_pattern || '',
      is_required: attribute.is_required,
      is_parent: attribute.is_parent
    });
    setError(null);
  };

  const handleToggleState = async (attribute) => {
    try {
      console.log('Toggling attribute state:', attribute);
      
      const response = await axios.patch(`/api/attributes/${attribute.id}/toggle-state`);
      console.log('Toggle response:', response.data);
      
      await fetchAttributes();
    } catch (err) {
      console.error('Detailed toggle error:', err.response?.data || err.message);
      setError(`Fehler beim ${attribute.state === 'on' ? 'Deaktivieren' : 'Aktivieren'} des Attributs. Bitte versuchen Sie es später erneut.`);
      console.error('Error toggling attribute state:', err);
    }
  };

  if (loading && !attributes.length) {
    return <div className="text-center py-4">Wird geladen...</div>;
  }

  return (
    <div className="w-full h-full">
      <div className="container w-full mx-auto px-4 py-5 max-w-full">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8 w-full">
          {/* Form Section */}
          <div className="xl:w-[350px] flex-shrink-0">
            <h2 className="text-2xl font-semibold mb-6">
              {editingId ? 'Attribut bearbeiten' : 'Neues Attribut hinzufügen'}
            </h2>

            <AttributeForm
              formData={formData}
              onSubmit={handleSubmit}
              onChange={handleChange}
              loading={loading}
              isEditing={!!editingId}
            />

            {editingId && (
              <div className="mt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>

          {/* List Section */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold">Attribute</h2>
              
              <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap justify-end">
                <div className="flex items-center gap-2">
                  <label className="font-medium whitespace-nowrap">Filter nach Status:</label>
                  <select
                    className="border p-2 rounded"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="all">Alle</option>
                  </select>
                </div>

                <button
                  onClick={handleResetSort}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border"
                  title="Sortierung zurücksetzen"
                >
                  <span>Zurücksetzen</span>
                </button>
              </div>
            </div>

            <AttributeList
              attributes={attributes}
              onEdit={handleEdit}
              onToggleState={handleToggleState}
              onSort={handleSort}
              onResetSort={handleResetSort}
              sortConfig={sortConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributesPage;
