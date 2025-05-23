const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow';
  const errorStyles = error ? 'border-red-500' : 'border-gray-300';

  return (
    <div className="space-y-1">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
