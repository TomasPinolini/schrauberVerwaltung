import toast from 'react-hot-toast';

/**
 * Toast service for displaying notifications throughout the application
 */
const toastService = {
  /**
   * Show a success toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional options for the toast
   */
  success: (message, options = {}) => {
    toast.success(message, options);
  },

  /**
   * Show an error toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional options for the toast
   */
  error: (message, options = {}) => {
    toast.error(message, options);
  },

  /**
   * Show a warning toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional options for the toast
   */
  warning: (message, options = {}) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          style={{
            background: '#FFF8E1',
            borderLeft: '4px solid #FF9800',
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              Schließen
            </button>
          </div>
        </div>
      ),
      options
    );
  },

  /**
   * Show an info toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional options for the toast
   */
  info: (message, options = {}) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          style={{
            background: '#E3F2FD',
            borderLeft: '4px solid #2196F3',
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              Schließen
            </button>
          </div>
        </div>
      ),
      options
    );
  },

  /**
   * Dismiss all toast notifications
   */
  dismissAll: () => {
    toast.dismiss();
  }
};

export default toastService;
