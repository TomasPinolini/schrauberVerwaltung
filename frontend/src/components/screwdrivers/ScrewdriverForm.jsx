import PropTypes from 'prop-types';
import Input from '../ui/input';

const ScrewdriverForm = ({
  formData,
  attributes,
  onSubmit,
  onChange,
  onAttributeChange,
  errors = {},
  loading,
  isEditing
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  // Filter only active attributes
  const activeAttributes = attributes.filter(attr => attr.state === 'on');

  const renderAttributeInput = (attribute) => {
    const value = formData.attributes?.find(a => a.attributeId === attribute.id)?.value || '';
    const error = errors[`attribute_${attribute.id}`];

    const inputClassName = `w-full border p-2 rounded ${error ? 'border-red-500' : 'border-gray-300'}`;

    // Add helper text for unique attributes or those with validation patterns
    const getHelperText = () => {
      const texts = [];
      if (attribute.unique) texts.push('Muss eindeutig sein');
      if (attribute.validation_pattern && attribute.data_type === 'string') {
        texts.push(`Format: ${attribute.validation_pattern}`);
      }
      return texts.length > 0 ? texts.join(' • ') : null;
    };
    
    const helperText = getHelperText();

    switch (attribute.data_type) {
      case 'boolean':
        return (
          <div className="space-y-1">
            <select
              className={inputClassName}
              value={value}
              onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
            >
              <option value="">Bitte wählen</option>
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
            {helperText && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );
      case 'number':
        return (
          <div className="space-y-1">
            <input
              type="number"
              className={inputClassName}
              value={value}
              onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
              step={attribute.validation_pattern || "any"}
              placeholder={attribute.name}
            />
            {helperText && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-1">
            <input
              type="date"
              className={inputClassName}
              value={value}
              onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
            />
            {helperText && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );
      default: // string
        return (
          <div className="space-y-1">
            <Input
              type="text"
              className={inputClassName}
              value={value}
              onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
              pattern={attribute.validation_pattern}
              placeholder={attribute.name}
              error={error}
            />
            {helperText && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded shadow">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <Input
          type="text"
          className={`w-full border p-2 rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Name des Schraubendrehers"
          error={errors.name}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name}</p>
        )}
      </div>

      {activeAttributes.map(attribute => (
        <div key={attribute.id} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {attribute.name}
            {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
            {attribute.description && (
              <span className="text-gray-500 text-xs ml-2">({attribute.description})</span>
            )}
          </label>
          {renderAttributeInput(attribute)}
        </div>
      ))}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => window.history.back()}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || Object.keys(errors).length > 0}
        >
          {loading ? 'Wird gespeichert...' : (isEditing ? 'Aktualisieren' : 'Erstellen')}
        </button>
      </div>
    </form>
  );
};

ScrewdriverForm.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    attributes: PropTypes.arrayOf(
      PropTypes.shape({
        attributeId: PropTypes.number.isRequired,
        value: PropTypes.string
      })
    )
  }).isRequired,
  attributes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      validation_pattern: PropTypes.string,
      is_required: PropTypes.bool.isRequired,
      state: PropTypes.oneOf(['on', 'off']).isRequired,
      unique: PropTypes.bool,
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onAttributeChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
};

export default ScrewdriverForm; 