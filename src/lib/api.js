/**
 * API Client wrapper.
 *
 * Toggle USE_MOCK_API = true to use the local mock implementation.
 * Later, flip to false and implement real HTTP calls (axios/fetch) with the same function signatures.
 */
import { mockLogin, mockChooseRole } from "../api/mock";
import { CONFIG } from "../config";

export const USE_MOCK_API = CONFIG.MOCK_MODE === true;

// AUTH
export async function apiLogin(credentials) {
  if (USE_MOCK_API) return mockLogin(credentials);

  const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

export async function apiChooseRole(role) {
  if (USE_MOCK_API) return mockChooseRole(role);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/choose-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

// NOTIFICATIONS - Driver
export async function apiRegisterDriverToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/driver/notifications/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register device token");
  }

  return response.json();
}

export async function apiUnregisterDriverToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/driver/notifications/unregister`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unregister device token");
  }

  return response.json();
}

// NOTIFICATIONS - DBS
export async function apiRegisterDBSToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/dbs/notifications/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register DBS device token");
  }

  return response.json();
}

export async function apiUnregisterDBSToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/dbs/notifications/unregister`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unregister DBS device token");
  }

  return response.json();
}

// NOTIFICATIONS - MS
export async function apiRegisterMSToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/ms/notifications/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register MS device token");
  }

  return response.json();
}

export async function apiUnregisterMSToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/ms/notifications/unregister`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unregister MS device token");
  }

  return response.json();
}

// NOTIFICATIONS - EIC
export async function apiRegisterEICToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/eic/notifications/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register EIC device token");
  }

  return response.json();
}

export async function apiUnregisterEICToken(userId, deviceToken) {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/eic/notifications/unregister`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deviceToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unregister EIC device token");
  }

  return response.json();
}
