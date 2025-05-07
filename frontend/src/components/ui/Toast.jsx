import { Toaster } from 'react-hot-toast';

/**
 * Toast component that provides a container for toast notifications
 * This component should be placed at the root of your application
 */
const Toast = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        className: '',
        duration: 5000,
        style: {
          background: '#fff',
          color: '#363636',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '16px',
        },
        // Custom styles for different toast types
        success: {
          style: {
            background: '#EDF7ED',
            borderLeft: '4px solid #4CAF50',
          },
          iconTheme: {
            primary: '#4CAF50',
            secondary: '#FFFFFF',
          },
        },
        error: {
          style: {
            background: '#FDEDED',
            borderLeft: '4px solid #F44336',
          },
          iconTheme: {
            primary: '#F44336',
            secondary: '#FFFFFF',
          },
          duration: 6000, // Error messages stay a bit longer
        },
        warning: {
          style: {
            background: '#FFF8E1',
            borderLeft: '4px solid #FF9800',
          },
          iconTheme: {
            primary: '#FF9800',
            secondary: '#FFFFFF',
          },
        },
        info: {
          style: {
            background: '#E3F2FD',
            borderLeft: '4px solid #2196F3',
          },
          iconTheme: {
            primary: '#2196F3',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
};

export default Toast;
