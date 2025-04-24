import React, { useState, useEffect } from 'react';
import AttributeList from '../components/attributes/AttributeList';
import AttributeForm from '../components/attributes/AttributeForm';
import AttributeValueList from '../components/attributes/AttributeValueList';

const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [attributeValues, setAttributeValues] = useState([]);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attributes');
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const data = await response.json();
      setAttributes(data);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setErrors(prev => ({ ...prev, fetch: 'Failed to load attributes' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributeValues = async (attributeId) => {
    setValuesLoading(true);
    try {
      const response = await fetch(`/api/parent/${attributeId}/values`);
      if (!response.ok) throw new Error('Failed to fetch attribute values');
      const data = await response.json();
      setAttributeValues(data);
    } catch (error) {
      console.error('Error fetching attribute values:', error);
      setErrors(prev => ({ ...prev, values: 'Failed to load attribute values' }));
    } finally {
      setValuesLoading(false);
    }
  };

  const handleAddAttribute = async (newAttribute) => {
    try {
      const response = await fetch('/api/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttribute)
      });
      if (!response.ok) throw new Error('Failed to add attribute');
      await fetchAttributes();
      setShowForm(false);
    } catch (error) {
      console.error('Error adding attribute:', error);
      setErrors(prev => ({ ...prev, add: 'Failed to add attribute' }));
    }
  };

  const handleUpdateAttribute = async (id, updatedAttribute) => {
    try {
      const response = await fetch(`/api/attributes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAttribute)
      });
      if (!response.ok) throw new Error('Failed to update attribute');
      await fetchAttributes();
    } catch (error) {
      console.error('Error updating attribute:', error);
      setErrors(prev => ({ ...prev, update: 'Failed to update attribute' }));
    }
  };

  const handleDeleteAttribute = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Attribut löschen möchten?')) return;
    
    try {
      const response = await fetch(`/api/attributes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete attribute');
      await fetchAttributes();
      if (selectedAttribute?.id === id) {
        setSelectedAttribute(null);
        setAttributeValues([]);
      }
    } catch (error) {
      console.error('Error deleting attribute:', error);
      setErrors(prev => ({ ...prev, delete: 'Failed to delete attribute' }));
    }
  };

  const handleAddValue = async (newValue) => {
    if (!selectedAttribute) return;
    setValuesLoading(true);
    try {
      const response = await fetch(`/api/parent/${selectedAttribute.id}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newValue)
      });
      if (!response.ok) throw new Error('Failed to add attribute value');
      await fetchAttributeValues(selectedAttribute.id);
    } catch (error) {
      console.error('Error adding attribute value:', error);
      setErrors(prev => ({ ...prev, values: 'Failed to add attribute value' }));
    } finally {
      setValuesLoading(false);
    }
  };

  const handleUpdateValue = async (valueId, updatedValue) => {
    if (!selectedAttribute) return;
    setValuesLoading(true);
    try {
      const response = await fetch(`/api/parent/${selectedAttribute.id}/values/${valueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedValue)
      });
      if (!response.ok) throw new Error('Failed to update attribute value');
      await fetchAttributeValues(selectedAttribute.id);
    } catch (error) {
      console.error('Error updating attribute value:', error);
      setErrors(prev => ({ ...prev, values: 'Failed to update attribute value' }));
    } finally {
      setValuesLoading(false);
    }
  };

  const handleDeleteValue = async (valueId) => {
    if (!selectedAttribute) return;
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Wert löschen möchten?')) return;
    
    setValuesLoading(true);
    try {
      const response = await fetch(`/api/parent/${selectedAttribute.id}/values/${valueId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete attribute value');
      await fetchAttributeValues(selectedAttribute.id);
    } catch (error) {
      console.error('Error deleting attribute value:', error);
      setErrors(prev => ({ ...prev, values: 'Failed to delete attribute value' }));
    } finally {
      setValuesLoading(false);
    }
  };

  const handleAttributeSelect = (attribute) => {
    setSelectedAttribute(attribute);
    if (attribute && attribute.is_parent) {
      fetchAttributeValues(attribute.id);
    } else {
      setAttributeValues([]);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Attribute verwalten</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Neues Attribut
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <AttributeForm
            onSubmit={handleAddAttribute}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {errors.fetch && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.fetch}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <AttributeList
            attributes={attributes}
            loading={loading}
            onSelect={handleAttributeSelect}
            onUpdate={handleUpdateAttribute}
            onDelete={handleDeleteAttribute}
            selectedAttribute={selectedAttribute}
          />
        </div>

        {selectedAttribute && selectedAttribute.is_parent && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Werte für Attribut: {selectedAttribute.name}
            </h2>
            <AttributeValueList
              attributeId={selectedAttribute.id}
              values={attributeValues}
              onAddValue={handleAddValue}
              onUpdateValue={handleUpdateValue}
              onDeleteValue={handleDeleteValue}
              loading={valuesLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributesPage;
