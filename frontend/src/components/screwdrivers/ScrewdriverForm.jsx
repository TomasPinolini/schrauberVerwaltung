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

    const inputClassName = `w-full border p-2 rounded ${error ? 'border-red-500' : ''}`;

    switch (attribute.data_type) {
      case 'boolean':
        return (
          <div className="space-y-1">
            <select
              className={inputClassName}
              value={value}
              onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
            >
              <option value="">Auswählen</option>
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
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
            />
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
          className={`w-full border p-2 rounded ${errors.name ? 'border-red-500' : ''}`}
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

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || Object.keys(errors).length > 0}
      >
        {loading ? 'Wird gespeichert...' : (isEditing ? 'Aktualisieren' : 'Erstellen')}
      </button>
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
      state: PropTypes.oneOf(['on', 'off']).isRequired
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