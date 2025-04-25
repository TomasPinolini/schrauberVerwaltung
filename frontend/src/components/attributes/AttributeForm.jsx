import PropTypes from 'prop-types';
import Input from '../ui/input';

const AttributeForm = ({
  formData,
  onSubmit,
  onChange,
  errors = {},
  loading,
  isEditing
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-2xl">
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
          placeholder="Name des Attributs"
          error={errors.name}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <Input
          type="text"
          className="w-full border p-2 rounded"
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Beschreibung (optional)"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Validierungsmuster
        </label>
        <Input
          type="text"
          className="w-full border p-2 rounded"
          value={formData.validation_pattern || ''}
          onChange={(e) => onChange('validation_pattern', e.target.value)}
          placeholder="Validierungsmuster (optional)"
        />
        {errors.validation_pattern && (
          <p className="text-red-500 text-sm">{errors.validation_pattern}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_required || false}
            onChange={(e) => onChange('is_required', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Pflichtfeld</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_parent || false}
            onChange={(e) => onChange('is_parent', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Elternattribut</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.unique || false}
            onChange={(e) => onChange('unique', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Eindeutig (Unique)</span>
        </label>
      </div>

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

AttributeForm.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    validation_pattern: PropTypes.string,
    is_required: PropTypes.bool,
    is_parent: PropTypes.bool,
    unique: PropTypes.bool,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
};

export default AttributeForm;