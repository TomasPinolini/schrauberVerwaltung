import { useEffect, useState } from 'react';
import axios from 'axios';

const ScrewdriversPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [screwdrivers, setScrewdrivers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', attributes: [] });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const res = await axios.get('/api/attributes/active');
        setAttributes(res.data);
      } catch (err) {
        setError('Fehler beim Laden der Attribute. Bitte versuchen Sie es später erneut.');
        console.error('Error fetching attributes:', err);
      }
    };
    fetchAttributes();
  }, []);

  const fetchScrewdrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/screwdrivers/with-values/all';

      if (filter === 'all') {
        url += '?include_inactive=true';
      } else if (filter === 'inactive') {
        url += '?include_inactive=true';
      }

      const res = await axios.get(url);
      const filtered = filter === 'inactive'
        ? res.data.filter(s => s.state === 'off')
        : filter === 'active'
        ? res.data.filter(s => s.state === 'on')
        : res.data;
      setScrewdrivers(filtered);
    } catch (err) {
      setError('Fehler beim Laden der Schrauber. Bitte versuchen Sie es später erneut.');
      console.error('Error fetching screwdrivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrewdrivers();
  }, [filter]);

  const handleAttrChange = (id, value) => {
    setFormData(prev => {
      const updated = [...prev.attributes.filter(a => a.attributeId !== id), { attributeId: id, value }];
      return { ...prev, attributes: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    const newErrors = {};
    const data = formData;

    for (const attr of attributes) {
      const input = data.attributes.find(a => a.attributeId === attr.id);
      const val = input?.value?.toString() ?? '';
      if (attr.is_required && !val.trim()) {
        newErrors[attr.id] = 'Dieses Feld ist erforderlich';
        continue;
      }
      if (attr.validation_pattern && val.trim()) {
        const regex = new RegExp(attr.validation_pattern);
        if (!regex.test(val.trim())) {
          newErrors[attr.id] = `Ungültiges Format. Muss übereinstimmen mit: ${attr.validation_pattern}`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/screwdrivers/${editingId}`, data);
      } else {
        await axios.post('/api/screwdrivers', data);
      }
      setFormData({ name: '', description: '', attributes: [] });
      setEditingId(null);
      await fetchScrewdrivers();
    } catch (err) {
      setError('Fehler beim Speichern des Schraubers. Bitte versuchen Sie es später erneut.');
      console.error('Error saving screwdriver:', err);
    }
  };

  const handleEdit = (screw) => {
    setEditingId(screw.id);
    setFormData({
      name: screw.name,
      description: screw.description || '',
      attributes: screw.attributes.map(attr => ({
        attributeId: attr.id,
        value: attr.value
      }))
    });
    setErrors({});
    setError(null);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Sind Sie sicher, dass Sie diesen Schrauber deaktivieren möchten?");
    if (!confirm) return;

    try {
      await axios.delete(`/api/screwdrivers/${id}`);
      await fetchScrewdrivers();
    } catch (err) {
      setError("Fehler beim Deaktivieren des Schraubers. Bitte versuchen Sie es später erneut.");
      console.error('Error deactivating screwdriver:', err);
    }
  };

  const handleToggleState = async (screw) => {
    try {
      const newState = screw.state === 'on' ? 'off' : 'on';
      await axios.put(`/api/screwdrivers/${screw.id}`, {
        state: newState
      });
      await fetchScrewdrivers();
    } catch (err) {
      setError(`Fehler beim ${screw.state === 'on' ? 'Deaktivieren' : 'Aktivieren'} des Schraubers. Bitte versuchen Sie es später erneut.`);
      console.error('Error toggling screwdriver state:', err);
    }
  };

  const filteredScrewdrivers = screwdrivers.filter(s => {
    if (filter === 'active') return s.state === 'on';
    if (filter === 'inactive') return s.state === 'off';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <h2 className="text-2xl font-semibold">{editingId ? 'Schrauber bearbeiten' : 'Neuen Schrauber hinzufügen'}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-2xl">
        <input
          className="w-full border p-2 rounded"
          placeholder="Name des Schraubers"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Beschreibung"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        {attributes.map(attr => {
          const existing = formData.attributes.find(a => a.attributeId === attr.id)?.value || '';
          const error = errors[attr.id];

          return (
            <div key={attr.id}>
              <label className="block font-medium">{attr.name}</label>
              {attr.data_type === 'boolean' ? (
                <select
                  className="w-full border p-2 rounded"
                  value={existing}
                  onChange={e => handleAttrChange(attr.id, e.target.value)}
                >
                  <option value="">Auswählen</option>
                  <option value="true">Ja</option>
                  <option value="false">Nein</option>
                </select>
              ) : (
                <input
                  className="w-full border p-2 rounded"
                  type={attr.data_type === 'number' ? 'number' : 'text'}
                  value={existing}
                  onChange={e => handleAttrChange(attr.id, e.target.value)}
                />
              )}
              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>
          );
        })}
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Wird gespeichert...' : (editingId ? 'Aktualisieren' : 'Erstellen')}
        </button>
      </form>

      <h2 className="text-2xl font-semibold mt-10">Schrauber</h2>

      <div className="flex items-center gap-2">
        <label className="font-medium">Filter nach Status:</label>
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

      {loading ? (
        <div className="text-center py-4">Wird geladen...</div>
      ) : (
        <table className="min-w-full text-sm border mt-2">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Beschreibung</th>
              {attributes.map(attr => (
                <th key={attr.id} className="p-2 border">{attr.name}</th>
              ))}
              <th className="p-2 border">Bearbeiten</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredScrewdrivers.map(screw => (
              <tr key={screw.id} className="bg-white border-b">
                <td className="p-2 border">{screw.name}</td>
                <td className="p-2 border">{screw.description}</td>
                {attributes.map(attr => {
                  const match = (screw.attributes || []).find(a => a.id === attr.id);
                  return <td key={attr.id} className="p-2 border">{match?.value ?? '-'}</td>;
                })}
                <td className="p-2 border">
                  <button 
                    onClick={() => handleEdit(screw)} 
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Bearbeiten
                  </button>
                </td>
                <td className="p-2 border">
                  <span className={screw.state === 'on' ? 'text-green-600' : 'text-red-600'}>
                    {screw.state === 'on' ? '🟢 Aktiv' : '🔴 Inaktiv'}
                  </span>
                  <button
                    onClick={() => handleToggleState(screw)}
                    className={`ml-2 px-2 py-1 rounded ${
                      screw.state === 'on' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {screw.state === 'on' ? 'Deaktivieren' : 'Aktivieren'}
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

export default ScrewdriversPage;
