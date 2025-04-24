const Button = ({ 
  children, 
  type = 'button',
  variant = 'primary', // primary, secondary, danger, success
  disabled = false,
  className = '',
  onClick
}) => {
  const baseStyles = 'px-4 py-2 rounded font-medium focus:outline-none transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
