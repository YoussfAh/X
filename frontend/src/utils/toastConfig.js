import { max } from 'date-fns';
import { toast } from 'react-toastify';

// Enhanced toast configuration for elegant notifications
export const toastConfig = {
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  pauseOnFocusLoss: true,
  theme: "colored",
  limit: 3,
  style: {
    maxWidth: '400px',
    minHeight: '45px',
    borderRadius: '12px',
    fontSize: '0.875rem',
    padding: '12px 16px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  toastClassName: 'elegant-toast',
  bodyClassName: 'elegant-toast-body',
  progressClassName: 'elegant-toast-progress'
};

// Export toast config as globalToastConfig for backward compatibility
export const globalToastConfig = toastConfig;

// Standard notification functions
export const showSuccessToast = (message) => toast.success(message, toastConfig);
export const showErrorToast = (message) => toast.error(message, toastConfig);
export const showInfoToast = (message) => toast.info(message, toastConfig);
export const showWarningToast = (message) => toast.warning(message, toastConfig);

// Alias exports for backward compatibility
export const successToast = showSuccessToast;
export const errorToast = showErrorToast;