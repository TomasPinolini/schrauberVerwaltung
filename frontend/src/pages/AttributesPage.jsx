import { useEffect, useState, useReducer } from 'react';
import axios from 'axios';
import AttributeForm from '../components/attributes/AttributeForm';
import AttributeList from '../components/attributes/AttributeList';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import toastService from '../utils/toastService.jsx';

// Initial state for the form reducer
const initialFormState = {
  formData: {
    name: '',
    description: '',
    validation_pattern: '',
    is_required: false,
    is_parent: false,
    unique: false
  },
  editingId: null,
  formLoading: false,
  formErrors: {}
};

// Form reducer function to handle all form-related state changes
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      // Create new errors object without the error for this field
      const fieldErrors = { ...state.formErrors };
      delete fieldErrors[action.field];
      
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value
        },
        formErrors: fieldErrors
      };
      
    case 'START_SUBMIT':
      return {
        ...state,
        formLoading: true,
        formErrors: {}
      };
      
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        formData: initialFormState.formData,
        editingId: null,
        formLoading: false,
        formErrors: {}
      };
      
    case 'SUBMIT_ERROR':
      return {
        ...state,
        formLoading: false,
        formErrors: action.errors
      };
      
    case 'LOAD_FOR_EDIT':
      return {
        ...state,
        formData: action.formData,
        editingId: action.id
      };
      
    case 'CANCEL_EDIT':
      return {
        ...state,
        formData: initialFormState.formData,
        editingId: null,
        formErrors: {}
      };
      
    default:
      return state;
  }
};

const AttributesPage = () => {
  // Main data state
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading state
  const [error, setError] = useState(null);
  
  // Form state using useReducer
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  
  // Destructure form state for easier access
  const { formData, editingId, formLoading, formErrors } = formState;
  
  const [filter, setFilter] = useState('active');
  const [sortConfig, setSortConfig] = useState(null);
  const [attributeListFilterText, setAttributeListFilterText] = useState('');

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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name ist erforderlich';
    }
    
    // Add more validation as needed
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleChange = (field, value) => {
    dispatch({
      type: 'SET_FIELD',
      field,
      value
    });
  };

  const handleCancel = () => {
    dispatch({ type: 'CANCEL_EDIT' });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      dispatch({
        type: 'SUBMIT_ERROR',
        errors: validation.errors
      });
      return;
    }
    
    dispatch({ type: 'START_SUBMIT' });
    
    try {
      if (editingId) {
        await axios.put(`/api/attributes/${editingId}`, formData);
        toastService.success('Attribut erfolgreich aktualisiert');
      } else {
        await axios.post('/api/attributes', formData);
        toastService.success('Attribut erfolgreich erstellt');
      }
      
      dispatch({ type: 'SUBMIT_SUCCESS' });
      await fetchAttributes();
    } catch (err) {
      const errorMessage = 'Fehler beim Speichern des Attributs. Bitte versuchen Sie es später erneut.';
      toastService.error(errorMessage);
      console.error('Error saving attribute:', err);
      
      dispatch({
        type: 'SUBMIT_ERROR',
        errors: { general: errorMessage }
      });
    }
  };

  const handleEdit = (attribute) => {
    dispatch({
      type: 'LOAD_FOR_EDIT',
      id: attribute.id,
      formData: {
        name: attribute.name,
        description: attribute.description || '',
        validation_pattern: attribute.validation_pattern || '',
        is_required: attribute.is_required,
        is_parent: attribute.is_parent,
        unique: attribute.unique || false
      }
    });
    setError(null);
  };

  const handleToggleState = async (attribute) => {
    try {
      const response = await axios.patch(`/api/attributes/${attribute.id}/toggle-state`);
      const action = attribute.state === 'on' ? 'deaktiviert' : 'aktiviert';
      toastService.success(`Attribut erfolgreich ${action}`);
      await fetchAttributes();
    } catch (err) {
      const errorMessage = `Fehler beim ${attribute.state === 'on' ? 'Deaktivieren' : 'Aktivieren'} des Attributs.`;
      toastService.error(errorMessage);
      console.error('Error toggling attribute state:', err);
    }
  };

  const handleResetFilters = () => {
    setFilter('active');
    setSortConfig(null);
    setAttributeListFilterText('');
  };
  
  if (loading && !attributes.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="container w-full mx-auto px-4 py-5 max-w-full">
        {error && <ErrorMessage message={error} />}

        <div className="flex flex-col xl:flex-row gap-8 w-full">
          {/* Form Section */}
          <div className="xl:w-[350px] flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-6">
                {editingId ? 'Attribut bearbeiten' : 'Neues Attribut hinzufügen'}
              </h2>

              <AttributeForm
                formData={formData}
                onSubmit={handleSubmit}
                onChange={handleChange}
                loading={formLoading}
                isEditing={!!editingId}
                errors={formErrors}
              />

              {editingId && (
                <div className="mt-4">
                  <Button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    disabled={formLoading}
                  >
                    Abbrechen
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className="flex-1 min-w-0">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold">Attribute</h2>
                
                <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap justify-end">
                  <div className="flex items-center gap-2">
                    <label className="font-medium whitespace-nowrap">Filter nach Status:</label>
                    <Select
                      className="border p-2 rounded"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      options={[
                        { value: 'active', label: 'Aktiv' },
                        { value: 'inactive', label: 'Inaktiv' },
                      ]}
                    />
                    <Button
                      onClick={handleResetFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 ml-2"
                      title="Filter zurücksetzen"
                      type="button"
                    >
                      Zurücksetzen
                    </Button>
                  </div>
                </div>
              </div>

              {loading ? (
                <SkeletonLoader count={5} height="40px" className="mb-2" />
              ) : attributes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-lg">Keine Attribute gefunden</p>
                  <p className="text-sm mt-2">Versuchen Sie andere Filtereinstellungen oder erstellen Sie ein neues Attribut</p>
                  <button 
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              ) : (
                <AttributeList
                  attributes={attributes}
                  onEdit={handleEdit}
                  onToggleState={handleToggleState}
                  onSort={handleSort}
                  onResetSort={handleResetSort}
                  sortConfig={sortConfig}
                  filterText={attributeListFilterText}
                  setFilterText={setAttributeListFilterText}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributesPage;
