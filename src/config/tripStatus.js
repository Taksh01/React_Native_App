/**
 * Standardized Trip Statuses and Colors
 * 
 * This file defines the single source of truth for trip statuses
 * and their associated visual properties across the application.
 */

export const TRIP_STATUS = {
  PENDING: 'PENDING',
  AT_MS: 'AT_MS',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_DBS: 'AT_DBS',
  DECANTING_CONFIRMED: 'DECANTING_CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const TRIP_STATUS_CONFIG = {
  [TRIP_STATUS.PENDING]: {
    label: 'Pending',
    color: '#ffffff',
    bgColor: '#f59e0b', // Yellow
  },
  [TRIP_STATUS.AT_MS]: {
    label: 'At MS',
    color: '#ffffff',
    bgColor: '#3b82f6', // Blue
  },
  [TRIP_STATUS.IN_TRANSIT]: {
    label: 'In Transit',
    color: '#ffffff',
    bgColor: '#8b5cf6', // Purple
  },
  [TRIP_STATUS.AT_DBS]: {
    label: 'At DBS',
    color: '#ffffff',
    bgColor: '#0ea5e9', // Sky Blue
  },
  [TRIP_STATUS.DECANTING_CONFIRMED]: {
    label: 'Decanting Confirmed',
    color: '#ffffff',
    bgColor: '#10b981', // Green
  },
  [TRIP_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#ffffff',
    bgColor: '#059669', // Darker Green
  },
  [TRIP_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: '#ffffff',
    bgColor: '#6b7280', // Grey
  },
};

/**
 * Normalizes a status string to match one of the standard keys.
 * Handles case insensitivity and ensures a valid fallback.
 * 
 * @param {string} status - The status string to normalize
 * @returns {string} - The normalized status key (e.g., 'PENDING')
 */
export const normalizeTripStatus = (status) => {
  if (!status) return TRIP_STATUS.PENDING;
  
  const upperStatus = String(status).toUpperCase().trim();
  
  // Direct match check
  if (TRIP_STATUS[upperStatus]) {
    return upperStatus;
  }

  // Common mappings/fallbacks
  if (upperStatus === 'ACCEPTED' || upperStatus === 'ASSIGNED') return TRIP_STATUS.PENDING;
  if (upperStatus === 'EN_ROUTE' || upperStatus === 'NAVIGATING') return TRIP_STATUS.IN_TRANSIT;
  if (upperStatus === 'SUCCESS') return TRIP_STATUS.COMPLETED;
  if (upperStatus === 'FAILED') return TRIP_STATUS.CANCELLED;

  return TRIP_STATUS.PENDING;
};

/**
 * Gets the configuration object for a given status.
 * 
 * @param {string} status - The status string
 * @returns {object} - The config object { label, color, bgColor }
 */
export const getTripStatusConfig = (status) => {
  const normalized = normalizeTripStatus(status);
  return TRIP_STATUS_CONFIG[normalized] || TRIP_STATUS_CONFIG.PENDING;
};

/**
 * Helper to get just the background color for a status.
 * 
 * @param {string} status 
 * @returns {string} Hex color code
 */
export const getTripStatusColor = (status) => {
  return getTripStatusConfig(status).bgColor;
};

/**
 * Helper to get the display label for a status.
 * 
 * @param {string} status 
 * @returns {string} Display label
 */
export const getTripStatusLabel = (status) => {
  return getTripStatusConfig(status).label;
};
