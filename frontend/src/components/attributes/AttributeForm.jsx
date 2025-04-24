import PropTypes from 'prop-types';

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
        <input
          className="w-full border p-2 rounded"
          placeholder="Name des Attributs"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <input
          className="w-full border p-2 rounded"
          placeholder="Beschreibung des Attributs"
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Validierungsmuster
        </label>
        <input
          className="w-full border p-2 rounded"
          placeholder="Regulärer Ausdruck für die Validierung"
          value={formData.validation_pattern || ''}
          onChange={(e) => onChange('validation_pattern', e.target.value)}
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
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
};

export default AttributeForm;