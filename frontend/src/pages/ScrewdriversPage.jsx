import { useEffect, useState } from 'react';
import axios from 'axios';
import ScrewdriverForm from '../components/screwdrivers/ScrewdriverForm';
import ScrewdriverList from '../components/screwdrivers/ScrewdriverList';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';

const ScrewdriversPage = () => {
  const [screwdrivers, setScrewdrivers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    attributes: []
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [screwdriverListFilterText, setScrewdriverListFilterText] = useState({});

  const sortScrewdrivers = (items, config) => {
    if (!config) return items;

    return [...items].sort((a, b) => {
      let aValue, bValue;

      if (config.key.startsWith('attribute_')) {
        // Extract attribute ID from the sort key
        const attributeId = parseInt(config.key.split('_')[1]);
        aValue = a.Attributes?.find(attr => attr.id === attributeId)?.ScrewdriverAttribute?.value || '';
        bValue = b.Attributes?.find(attr => attr.id === attributeId)?.ScrewdriverAttribute?.value || '';
      } else {
        aValue = a[config.key];
        bValue = b[config.key];
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

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

  const validateForm = () => {
    const errors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name ist erforderlich';
    }

    // Get active attributes
    const activeAttributes = attributes.filter(attr => attr.state === 'on');
    
    // Validate required and unique attributes
    activeAttributes.forEach(attr => {
      const attributeValue = formData.attributes?.find(a => a.attributeId === attr.id)?.value;
      if (attr.is_required) {
        if (!attributeValue || attributeValue.trim() === '') {
          errors[`attribute_${attr.id}`] = `${attr.name} ist erforderlich`;
          return;
        }
      }

      // Unique validation
      if (attr.unique) {
        if (attributeValue && attributeValue.trim() !== '') {
          // Check if value already exists in another screwdriver (excluding the one being edited)
          const duplicate = screwdrivers.some(screwdriver => {
            if (editingId && screwdriver.id === editingId) return false;
            const found = screwdriver.Attributes?.find(a => a.id === attr.id);
            return found && found.ScrewdriverAttribute?.value === attributeValue;
          });
          if (duplicate) {
            errors[`attribute_${attr.id}`] = `${attr.name} muss eindeutig sein (bereits vergeben)`;
          }
        }
      }

      // Additional type-specific validation
      if (attr.is_required && attributeValue && attributeValue.trim() !== '') {
        switch (attr.data_type) {
          case 'number':
            if (attr.validation_pattern) {
              const step = parseFloat(attr.validation_pattern);
              const value = parseFloat(attributeValue);
              if (isNaN(value) || (step && value % step !== 0)) {
                errors[`attribute_${attr.id}`] = `${attr.name} muss ein Vielfaches von ${step} sein`;
              }
            }
            break;
          case 'string':
            if (attr.validation_pattern) {
              const pattern = new RegExp(attr.validation_pattern);
              if (!pattern.test(attributeValue)) {
                errors[`attribute_${attr.id}`] = `${attr.name} entspricht nicht dem erforderlichen Format`;
              }
            }
            break;
          case 'boolean':
            if (!['true', 'false'].includes(attributeValue)) {
              errors[`attribute_${attr.id}`] = `${attr.name} muss Ja oder Nein sein`;
            }
            break;
          case 'date':
            if (isNaN(Date.parse(attributeValue))) {
              errors[`attribute_${attr.id}`] = `${attr.name} muss ein gültiges Datum sein`;
            }
            break;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAttributes = async () => {
    try {
      const res = await axios.get('/api/attributes');
      setAttributes(res.data);
    } catch (err) {
      setError('Fehler beim Laden der Attribute. Bitte versuchen Sie es später erneut.');
      console.error('Error fetching attributes:', err);
    }
  };

  const fetchScrewdrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/screwdrivers?include_inactive=true');
      const filteredScrewdrivers = res.data.filter(screwdriver => {
        if (filter === 'active') return screwdriver.state === 'on';
        if (filter === 'inactive') return screwdriver.state === 'off';
        return true;
      });
      const sortedScrewdrivers = sortScrewdrivers(filteredScrewdrivers, sortConfig);
      setScrewdrivers(sortedScrewdrivers);
    } catch (err) {
      setError('Fehler beim Laden der Schraubendreher. Bitte versuchen Sie es später erneut.');
      console.error('Error fetching screwdrivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  useEffect(() => {
    fetchScrewdrivers();
  }, [filter, sortConfig]);

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
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAttributeChange = (attributeId, value) => {
    setFormData(prev => {
      const newAttributes = [...(prev.attributes || [])];
      const existingIndex = newAttributes.findIndex(a => a.attributeId === attributeId);
      
      if (existingIndex !== -1) {
        newAttributes[existingIndex] = { ...newAttributes[existingIndex], value };
      } else {
        newAttributes.push({ attributeId, value });
      }

      return { ...prev, attributes: newAttributes };
    });

    // Clear error for this attribute if it exists
    if (formErrors[`attribute_${attributeId}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`attribute_${attributeId}`];
        return newErrors;
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      attributes: []
    });
    setError(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        await axios.put(`/api/screwdrivers/${editingId}`, formData);
      } else {
        await axios.post('/api/screwdrivers', formData);
      }
      setFormData({
        name: '',
        attributes: []
      });
      setEditingId(null);
      setFormErrors({});
      await fetchScrewdrivers();
    } catch (err) {
      setError('Fehler beim Speichern des Schraubendrehers. Bitte versuchen Sie es später erneut.');
      console.error('Error saving screwdriver:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (screwdriver) => {
    setEditingId(screwdriver.id);
    setFormData({
      name: screwdriver.name,
      attributes: screwdriver.Attributes?.map(attr => ({
        attributeId: attr.id,
        value: attr.ScrewdriverAttribute.value
      })) || []
    });
    setError(null);
    setFormErrors({});
  };

  const handleToggleState = async (screwdriver) => {
    try {
      const newState = screwdriver.state === 'on' ? 'off' : 'on';
      await axios.put(`/api/screwdrivers/${screwdriver.id}`, {
        ...screwdriver,
        state: newState
      });
      await fetchScrewdrivers();
    } catch (err) {
      setError(`Fehler beim ${screwdriver.state === 'on' ? 'Deaktivieren' : 'Aktivieren'} des Schraubendrehers. Bitte versuchen Sie es später erneut.`);
      console.error('Error toggling screwdriver state:', err);
    }
  };

  const parentAttributes = attributes.filter(attr => attr.state === 'on' && attr.is_parent);
  // derive child values from screwdrivers
  const childOptions = selectedParent
    ? Array.from(new Set(
        screwdrivers.flatMap(sd =>
          sd.Attributes
            .filter(a => a.id === Number(selectedParent))
            .map(a => a.ScrewdriverAttribute.value)
        )
      ))
    : [];
  const displayedScrewdrivers = screwdrivers
    .filter(sd => {
      if (filter === 'active') return sd.state === 'on';
      if (filter === 'inactive') return sd.state === 'off';
      return true;
    })
    .filter(sd => selectedParent ? sd.Attributes.some(a => a.id === Number(selectedParent)) : true)
    .filter(sd => selectedChild
      ? sd.Attributes.some(a => a.id === Number(selectedParent) && a.ScrewdriverAttribute.value === selectedChild)
      : true
    );

  const handleResetFilters = () => {
    setFilter('all'); 
    setSelectedParent('');
    setSelectedChild('');
  };

  if (loading && !screwdrivers.length) {
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
          <div className="xl:w-[350px] flex-shrink-0">
            <h2 className="text-2xl font-semibold mb-6">
              {editingId ? 'Schraubendreher bearbeiten' : 'Neuen Schraubendreher hinzufügen'}
            </h2>

            <ScrewdriverForm
              formData={formData}
              attributes={attributes}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onAttributeChange={handleAttributeChange}
              errors={formErrors}
              loading={loading}
              isEditing={!!editingId}
            />

            {editingId && (
              <div className="mt-4">
                <Button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Abbrechen
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold">Schraubendreher</h2>
              
              <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap justify-end">
                <div className="flex items-center gap-2">
                  <label className="font-medium whitespace-nowrap">Filter nach Status:</label>
                  <Select
                    className="border p-2 rounded"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Alle' },
                      { value: 'active', label: 'Aktiv' },
                      { value: 'inactive', label: 'Inaktiv' }
                    ]}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-medium whitespace-nowrap">Filter nach Elternattribut:</label>
                  <Select
                    className="border p-2 rounded"
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    options={[
                      { value: '', label: 'Alle' },
                      ...parentAttributes.map(attr => ({ value: attr.id, label: attr.name }))
                    ]}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-medium whitespace-nowrap">Filter nach Kindwert:</label>
                  <Select
                    className="border p-2 rounded"
                    value={selectedChild}
                    onChange={e => setSelectedChild(e.target.value)}
                    options={[
                      { value: '', label: 'Alle' },
                      ...childOptions.map(val => ({ value: val, label: val }))
                    ]}
                  />
                </div>
                <Button
                  onClick={() => {
                    setFilter('all');
                    setSelectedParent('');
                    setSelectedChild('');
                    setSortConfig(null);
                    setScrewdriverListFilterText('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border transition-colors"
                  title="Alle Filter zurücksetzen"
                  type="button"
                >
                  <span>Alle Filter zurücksetzen</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <ScrewdriverList
                screwdrivers={displayedScrewdrivers}
                attributes={attributes}
                onEdit={handleEdit}
                onToggleState={handleToggleState}
                onSort={handleSort}
                onResetSort={handleResetSort}
                sortConfig={sortConfig}
                filterText={screwdriverListFilterText}
                setFilterText={setScrewdriverListFilterText}
                tableClassName="min-w-full w-full table-fixed text-sm"
                cellClassName="px-2 py-2 whitespace-nowrap"
                headerClassName="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrewdriversPage;
