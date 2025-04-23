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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttributes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/attributes?include_inactive=true');
      setAttributes(res.data);
    } catch (err) {
      setError('Fehler beim Laden der Attribute. Bitte versuchen Sie es später erneut.');
      console.error('Error fetching attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.data_type) {
      setError('Name und Datentyp sind erforderlich.');
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
        data_type: '',
        validation_pattern: '',
        is_required: false
      });
      setEditingId(null);
      await fetchAttributes();
    } catch (err) {
      setError('Fehler beim Speichern des Attributs. Bitte versuchen Sie es später erneut.');
      console.error('Error saving attribute:', err);
    }
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
    setError(null);
  };

  const handleToggleState = async (attr) => {
    try {
      await axios.put(`/api/attributes/${attr.id}`, {
        ...attr,
        state: attr.state === 'on' ? 'off' : 'on'
      });
      await fetchAttributes();
    } catch (err) {
      setError(`Fehler beim ${attr.state === 'on' ? 'Deaktivieren' : 'Aktivieren'} des Attributs. Bitte versuchen Sie es später erneut.`);
      console.error('Error toggling attribute state:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <h2 className="text-2xl font-semibold">{editingId ? 'Attribut bearbeiten' : 'Neues Attribut hinzufügen'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-2xl">
        <input
          className="w-full border p-2 rounded"
          placeholder="Name des Attributs"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Beschreibung"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <select
          className="w-full border p-2 rounded"
          value={formData.data_type}
          onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
        >
          <option value="">Datentyp auswählen</option>
          {validTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input
          className="w-full border p-2 rounded"
          placeholder="Validierungsmuster (optional)"
          value={formData.validation_pattern}
          onChange={(e) => setFormData({ ...formData, validation_pattern: e.target.value })}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_required}
            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
          />
          <span>Erforderlich?</span>
        </label>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Wird gespeichert...' : (editingId ? 'Aktualisieren' : 'Erstellen')}
        </button>
      </form>

      <h2 className="text-2xl font-semibold mt-10">Attribute</h2>
      {loading ? (
        <div className="text-center py-4">Wird geladen...</div>
      ) : (
        <table className="min-w-full text-sm border mt-2">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Typ</th>
              <th className="p-2 border">Erforderlich</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map(attr => (
              <tr key={attr.id} className="bg-white border-b">
                <td className="p-2 border">{attr.name}</td>
                <td className="p-2 border">{attr.data_type}</td>
                <td className="p-2 border">{attr.is_required ? 'Ja' : 'Nein'}</td>
                <td className="p-2 border">
                  <span className={attr.state === 'on' ? 'text-green-600' : 'text-red-600'}>
                    {attr.state === 'on' ? '🟢 Aktiv' : '🔴 Inaktiv'}
                  </span>
                </td>
                <td className="p-2 border space-x-2">
                  <button 
                    onClick={() => handleEdit(attr)} 
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleToggleState(attr)} 
                    className={`px-2 py-1 rounded ${
                      attr.state === 'on' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {attr.state === 'on' ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttributesPage;
