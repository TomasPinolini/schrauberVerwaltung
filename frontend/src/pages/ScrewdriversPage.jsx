import { useEffect, useState } from 'react';
import axios from 'axios';

const ScrewdriversPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [screwdrivers, setScrewdrivers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', attributes: [] });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('active'); // ✅ filter state added

  useEffect(() => {
    axios.get('/api/attributes/active').then(res => setAttributes(res.data));
  }, []);

  const fetchScrewdrivers = () => {
    let url = '/api/screwdrivers/with-values/all';

    if (filter === 'all') {
      url += '?include_inactive=true';
    } else if (filter === 'inactive') {
      url += '?include_inactive=true'; // fetch all, filter manually
    }

    axios.get(url).then(res => {
      const filtered = filter === 'inactive'
        ? res.data.filter(s => s.state === 'off')
        : filter === 'active'
        ? res.data.filter(s => s.state === 'on')
        : res.data;
      setScrewdrivers(filtered);
    });
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
    const newErrors = {};
    const data = formData;

    for (const attr of attributes) {
      const input = data.attributes.find(a => a.attributeId === attr.id);
      const val = input?.value?.toString() ?? '';
      if (attr.is_required && !val.trim()) {
        newErrors[attr.id] = 'This field is required';
        continue;
      }
      if (attr.validation_pattern && val.trim()) {
        const regex = new RegExp(attr.validation_pattern);
        if (!regex.test(val.trim())) {
          newErrors[attr.id] = `Invalid format. Must match: ${attr.validation_pattern}`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      await axios.put(`/api/screwdrivers/${editingId}`, data);
    } else {
      await axios.post('/api/screwdrivers', data);
    }

    setFormData({ name: '', description: '', attributes: [] });
    setEditingId(null);
    fetchScrewdrivers();
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
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to deactivate this screwdriver?");
    if (!confirm) return;

    try {
      await axios.delete(`/api/screwdrivers/${id}`);
      fetchScrewdrivers();
    } catch (err) {
      alert("Failed to deactivate screwdriver.");
      console.error(err);
    }
  };

  const filteredScrewdrivers = screwdrivers.filter(s => {
    if (filter === 'active') return s.state === 'on';
    if (filter === 'inactive') return s.state === 'off';
    return true; // all
  });


  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <h2 className="text-2xl font-semibold">{editingId ? 'Edit' : 'Add'} Screwdriver</h2>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-2xl">
        <input
          className="w-full border p-2 rounded"
          placeholder="Screwdriver Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Description"
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
                  <option value="">Select</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
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
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          {editingId ? 'Update' : 'Create'}
        </button>
      </form>

      <h2 className="text-2xl font-semibold mt-10">Screwdrivers</h2>

      <div className="flex items-center gap-2">
        <label className="font-medium">Filter by State:</label>
        <select
          className="border p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>
      <table className="min-w-full text-sm border mt-2">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Description</th>
            {attributes.map(attr => (
              <th key={attr.id} className="p-2 border">{attr.name}</th>
            ))}
            <th className="p-2 border">Edit</th>
            <th className="p-2 border">State</th>
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
                console.log('Rendering screwdriver:', screw.name, screw.state);

              })}
                <td className="p-2 border">
                  <button onClick={() => handleEdit(screw)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                </td>
                <td className="p-2 border">
                  <span className={screw.state === 'on' ? 'text-green-600' : 'text-red-600'}>
                    {screw.state === 'on' ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggleState(screw)}
                    className={`ml-2 px-2 py-1 rounded ${screw.state === 'on' ? 'bg-red-600' : 'bg-green-600'} text-white`}
                  >
                    {screw.state === 'on' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScrewdriversPage;
