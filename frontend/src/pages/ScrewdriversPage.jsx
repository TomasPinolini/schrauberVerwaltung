import { useEffect, useState, useReducer } from 'react';
import axios from 'axios';
import ScrewdriverForm from '../components/screwdrivers/ScrewdriverForm';
import ScrewdriverList from '../components/screwdrivers/ScrewdriverList';
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
    attributes: []
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
      
    case 'SET_ATTRIBUTE':
      const attributeIndex = state.formData.attributes.findIndex(
        attr => attr.attributeId === action.attributeId
      );
      
      let newAttributes = [...state.formData.attributes];
      
      if (attributeIndex >= 0) {
        newAttributes[attributeIndex] = {
          ...newAttributes[attributeIndex],
          value: action.value
        };
      } else {
        newAttributes.push({
          attributeId: action.attributeId,
          value: action.value
        });
      }
      
      // Create new errors object without the error for this attribute
      const attrErrors = { ...state.formErrors };
      delete attrErrors[`attribute_${action.attributeId}`];
      
      return {
        ...state,
        formData: {
          ...state.formData,
          attributes: newAttributes
        },
        formErrors: attrErrors
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

const ScrewdriversPage = () => {
  // Main data state
  const [screwdrivers, setScrewdrivers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading state
  const [error, setError] = useState(null);
  
  // Form state using useReducer
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  
  // Destructure form state for easier access
  const { formData, editingId, formLoading, formErrors } = formState;
  
  const [filter, setFilter] = useState('active');
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [screwdriverListFilterText, setScrewdriverListFilterText] = useState('');

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
      const errorKey = `attribute_${attr.id}`;
      
      // Required validation
      if (attr.is_required && (!attributeValue || attributeValue.trim() === '')) {
        errors[errorKey] = `${attr.name} ist erforderlich`;
        // Don't return here - continue with other validations for other attributes
      } else {
        // Only proceed with other validations if we have a value
        if (attributeValue && attributeValue.trim() !== '') {
          // Unique validation
          if (attr.unique) {
            // Check if value already exists in another screwdriver (excluding the one being edited)
            const duplicate = screwdrivers.some(screwdriver => {
              if (editingId && screwdriver.id === editingId) return false;
              const found = screwdriver.Attributes?.find(a => a.id === attr.id);
              return found && found.ScrewdriverAttribute?.value === attributeValue;
            });
            if (duplicate) {
              errors[errorKey] = `${attr.name} muss eindeutig sein (bereits vergeben)`;
            }
          }

          // Type-specific validation
          switch (attr.data_type) {
            case 'number':
              if (attr.validation_pattern) {
                const step = parseFloat(attr.validation_pattern);
                const value = parseFloat(attributeValue);
                if (isNaN(value)) {
                  errors[errorKey] = `${attr.name} muss eine gültige Zahl sein`;
                } else if (step && value % step !== 0) {
                  errors[errorKey] = `${attr.name} muss ein Vielfaches von ${step} sein`;
                }
              }
              break;
              
            case 'string':
              if (attr.validation_pattern) {
                try {
                  const pattern = new RegExp(attr.validation_pattern);
                  if (!pattern.test(attributeValue)) {
                    errors[errorKey] = `${attr.name} entspricht nicht dem erforderlichen Format`;
                  }
                } catch (e) {
                  console.error(`Invalid regex pattern for ${attr.name}:`, e);
                }
              }
              break;
              
            case 'boolean':
              if (!['true', 'false'].includes(attributeValue)) {
                errors[errorKey] = `${attr.name} muss Ja oder Nein sein`;
              }
              break;
              
            case 'date':
              if (isNaN(Date.parse(attributeValue))) {
                errors[errorKey] = `${attr.name} muss ein gültiges Datum sein`;
              }
              break;
          }
        }
      }
    });

    // Return errors object instead of setting state directly
    return errors;
  };

  const fetchAttributes = async () => {
    try {
      const response = await axios.get('/api/attributes');
      setAttributes(response.data);
      return true; // Success
    } catch (err) {
      console.error('Error fetching attributes:', err);
      const errorMessage = `Fehler beim Laden der Attribute: ${err.message}`;
      toastService.error(errorMessage);
      setError(errorMessage); // Keep the error state for accessibility
      return false; // Failed
    }
  };

  const fetchScrewdrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/screwdrivers?include_inactive=true');
      setScrewdrivers(res.data);
      return true; // Success
    } catch (err) {
      console.error('Error fetching screwdrivers:', err);
      const errorMessage = `Fehler beim Laden der Schraubendreher: ${err.message}`;
      toastService.error(errorMessage);
      setError(errorMessage); // Keep the error state for accessibility
      return false; // Failed
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
    // Dispatch action to update field value
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const handleAttributeChange = (attributeId, value) => {
    // Dispatch action to update attribute value
    dispatch({ type: 'SET_ATTRIBUTE', attributeId, value });
  };

  const handleCancel = () => {
    // Dispatch action to cancel editing and reset form
    dispatch({ type: 'CANCEL_EDIT' });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form and get any errors
    const errors = validateForm();

    // If there are validation errors, update form state and return
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SUBMIT_ERROR', errors });
      return;
    }

    // Start submission - sets loading state
    dispatch({ type: 'START_SUBMIT' });
    setError(null);

    try {
      if (editingId) {
        await axios.put(`/api/screwdrivers/${editingId}`, formData);
        toastService.success(`Schraubendreher "${formData.name}" wurde erfolgreich aktualisiert.`);
      } else {
        await axios.post('/api/screwdrivers', formData);
        toastService.success(`Schraubendreher "${formData.name}" wurde erfolgreich erstellt.`);
      }
      
      // On success, reset the form
      dispatch({ type: 'SUBMIT_SUCCESS' });
      await fetchScrewdrivers();
    } catch (err) {
      console.error('Error saving screwdriver:', err);
      const errorMessage = `Fehler beim Speichern des Schraubendrehers: ${err.message}`;
      toastService.error(errorMessage);
      setError(errorMessage); // Keep the error state for accessibility
      dispatch({ 
        type: 'SUBMIT_ERROR', 
        errors: { form: `Fehler: ${err.message}` }
      });
    }
  };

  const handleEdit = (screwdriver) => {
    // Dispatch action to load screwdriver data for editing
    dispatch({ 
      type: 'LOAD_FOR_EDIT', 
      id: screwdriver.id,
      formData: {
        name: screwdriver.name,
        attributes: screwdriver.Attributes?.map(attr => ({
          attributeId: attr.id,
          value: attr.ScrewdriverAttribute.value
        })) || []
      }
    });
    setError(null);
  };

  const handleToggleState = async (screwdriver) => {
    try {
      const newState = screwdriver.state === 'on' ? 'off' : 'on';
      const action = newState === 'on' ? 'aktiviert' : 'deaktiviert';
      
      await axios.put(`/api/screwdrivers/${screwdriver.id}`, {
        ...screwdriver,
        state: newState
      });
      
      toastService.success(`Schraubendreher "${screwdriver.name}" wurde erfolgreich ${action}.`);
      await fetchScrewdrivers();
    } catch (err) {
      const errorMessage = `Fehler beim ${screwdriver.state === 'on' ? 'Deaktivieren' : 'Aktivieren'} des Schraubendrehers. Bitte versuchen Sie es später erneut.`;
      toastService.error(errorMessage);
      setError(errorMessage); // Keep the error state for accessibility
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
      if (!filter) return true; // Show all if no filter selected
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
    setFilter('');
    setSelectedParent('');
    setSelectedChild('');
    setScrewdriverListFilterText('');
    setSortConfig(null);
  };

  if (loading && !screwdrivers.length) {
    return <div className="text-center py-4">Wird geladen...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Page header with title and description */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Schraubendreher Verwaltung</h1>
        <p className="text-gray-600">Verwalten Sie Ihre Schraubendreher und deren Attribute</p>
      </div>

      {error && (
        <ErrorMessage 
          message={error}
          onRetry={() => {
            fetchAttributes();
            fetchScrewdrivers();
          }}
        />
      )}

      {loading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <LoadingSpinner message="Daten werden geladen..." />
          <div className="mt-6">
            <SkeletonLoader rows={5} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Form section */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 h-full relative">
            {formLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <LoadingSpinner size="small" message="Wird gespeichert..." />
              </div>
            )}
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              {editingId ? 'Schraubendreher bearbeiten' : 'Neuer Schraubendreher'}
            </h2>
            
            <ScrewdriverForm
              formData={formData}
              attributes={attributes}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onAttributeChange={handleAttributeChange}
              errors={formErrors}
              loading={formLoading}
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
        </div>

        {/* List section */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col relative">
            {/* Show a subtle loading indicator when filtering/sorting but data is already loaded */}
            {!loading && screwdrivers.length > 0 && (
              <div className="absolute top-2 right-2">
                <div className={`transition-opacity duration-300 ${screwdrivers.length !== displayedScrewdrivers.length ? 'opacity-100' : 'opacity-0'}`}>
                  <LoadingSpinner size="small" message="" />
                </div>
              </div>
            )}
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Schraubendreher Liste</h2>
            
            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Filter & Sortierung</h3>
                <Button
                  onClick={handleResetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  title="Alle Filter zurücksetzen"
                  type="button"
                >
                  Alle Filter zurücksetzen
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select
                    className="w-full border p-2 rounded"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    options={[
                      { value: 'active', label: 'Aktiv' },
                      { value: 'inactive', label: 'Inaktiv' }
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Elternattribut</label>
                  <Select
                    className="w-full border p-2 rounded"
                    value={selectedParent}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSelectedParent(newValue);
                      // Clear child selection when parent changes
                      setSelectedChild('');
                    }}
                    options={parentAttributes.map(attr => ({ value: attr.id, label: attr.name }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kindwert</label>
                  <Select
                    className={`w-full border p-2 rounded ${!selectedParent ? 'opacity-50' : ''}`}
                    value={selectedChild}
                    onChange={e => setSelectedChild(e.target.value)}
                    options={childOptions.map(val => ({ value: val, label: val }))}
                    disabled={!selectedParent}
                  />
                </div>
              </div>
            </div>
            
            {/* List */}
            <div className="flex-1">
              {!loading && displayedScrewdrivers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-lg">Keine Schraubendreher gefunden</p>
                  <p className="text-sm mt-2">Versuchen Sie andere Filtereinstellungen oder erstellen Sie einen neuen Schraubendreher</p>
                  <button 
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              ) : (
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
                />
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default ScrewdriversPage;
