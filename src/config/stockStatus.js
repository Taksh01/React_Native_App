/**
 * Standardized Stock Statuses and Colors
 * 
 * This file defines the single source of truth for stock transfer statuses
 * and their associated visual properties across the application.
 */

export const STOCK_STATUS = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  APPROVED: 'APPROVED',
  ASSIGNING: 'ASSIGNING',
  ASSIGNED: 'ASSIGNED',
  COMPLETED: 'COMPLETED',
};

export const STOCK_STATUS_CONFIG = {
  [STOCK_STATUS.PENDING]: {
    label: 'Pending',
    color: '#ffffff',
    bgColor: '#f59e0b', // Yellow
  },
  [STOCK_STATUS.QUEUED]: {
    label: 'Queued',
    color: '#ffffff',
    bgColor: '#8b5cf6', // Purple
  },
  [STOCK_STATUS.REJECTED]: {
    label: 'Rejected',
    color: '#ffffff',
    bgColor: '#ef4444', // Red
  },
  [STOCK_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: '#ffffff',
    bgColor: '#6b7280', // Grey
  },
  [STOCK_STATUS.APPROVED]: {
    label: 'Approved',
    color: '#ffffff',
    bgColor: '#10b981', // Green
  },
  [STOCK_STATUS.ASSIGNING]: {
    label: 'Assigning Driver',
    color: '#ffffff',
    bgColor: '#3b82f6', // Blue
  },
  [STOCK_STATUS.ASSIGNED]: {
    label: 'Driver Assigned',
    color: '#ffffff',
    bgColor: '#0ea5e9', // Sky Blue
  },
  [STOCK_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#ffffff',
    bgColor: '#059669', // Darker Green
  },
};

/**
 * Normalizes a status string to match one of the standard keys.
 * Handles case insensitivity and ensures a valid fallback.
 * 
 * @param {string} status - The status string to normalize
 * @returns {string} - The normalized status key (e.g., 'PENDING')
 */
export const normalizeStockStatus = (status) => {
  if (!status) return STOCK_STATUS.PENDING;
  
  const upperStatus = String(status).toUpperCase().trim();
  
  // Direct match check
  if (STOCK_STATUS[upperStatus]) {
    return upperStatus;
  }

  // Fallback or specific mapping if needed in future
  return STOCK_STATUS.PENDING;
};

/**
 * Gets the configuration object for a given status.
 * 
 * @param {string} status - The status string
 * @returns {object} - The config object { label, color, bgColor }
 */
export const getStockStatusConfig = (status) => {
  const normalized = normalizeStockStatus(status);
  return STOCK_STATUS_CONFIG[normalized] || STOCK_STATUS_CONFIG.PENDING;
};

/**
 * Helper to get just the background color for a status.
 * 
 * @param {string} status 
 * @returns {string} Hex color code
 */
export const getStockStatusColor = (status) => {
  return getStockStatusConfig(status).bgColor;
};

/**
 * Helper to get the display label for a status.
 * 
 * @param {string} status 
 * @returns {string} Display label
 */
export const getStockStatusLabel = (status) => {
  return getStockStatusConfig(status).label;
};
