const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Auswählen',
  error,
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow';
  const errorStyles = error ? 'border-red-500' : 'border-gray-300';

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={onChange}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={option.value || index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select; 