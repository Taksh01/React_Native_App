/**
 * DBS-specific API helpers (moved out of api.js for clarity)
 */
import {
  mockSignalArrival,
  mockGetPre,
  mockStartDecant,
  mockEndDecant,
  mockGetEnd,
  mockConfirmDelivery,
} from "../api/mock";
import { CONFIG } from "../config";

export const USE_MOCK_API = CONFIG.MOCK_MODE === true;

// DBS - Token-based operations
export async function apiSignalArrival(token) {
  if (USE_MOCK_API) return mockSignalArrival(token);

  const response = await fetch(`${CONFIG.API_BASE_URL}/dbs/decant/arrive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to signal arrival");
  }
  return data;
}

export async function apiGetPre(token) {
  if (USE_MOCK_API) return mockGetPre(token);

  const response = await fetch(`${CONFIG.API_BASE_URL}/dbs/decant/pre`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get pre-decant data");
  }
  return data;
}

export async function apiStartDecant(token) {
  if (USE_MOCK_API) return mockStartDecant(token);

  const response = await fetch(`${CONFIG.API_BASE_URL}/dbs/decant/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to start decant");
  }
  return data;
}

export async function apiEndDecant(token) {
  if (USE_MOCK_API) return mockEndDecant(token);

  const response = await fetch(`${CONFIG.API_BASE_URL}/dbs/decant/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to end decant");
  }
  return data;
}

export async function apiGetEnd(token) {
  if (USE_MOCK_API) return mockGetEnd(token);

  // For token-based system, post-decant data is returned in apiEndDecant
  // This function can be used to re-fetch if needed
  const response = await fetch(`${CONFIG.API_BASE_URL}/dbs/decant/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get end data");
  }
  return data;
}

export async function apiConfirmDelivery(token, payload) {
  if (USE_MOCK_API) return mockConfirmDelivery(token, payload);

  const response = await fetch(`${CONFIG.API_BASE_URL}/dbs/decant/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, ...payload }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to confirm delivery");
  }
  return data;
}

// DBS Notification registration
// DBS notification registration moved to src/lib/api.js (common)

// Driver token helper for DBS (like msApi.getDriverToken)
export async function getDriverToken(driverId) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/driver/${driverId}/token`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get driver token");
  }
  return data;
}
