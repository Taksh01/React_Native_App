/**
 * API Client - Real Backend Integration with Error Handling
 */
import { CONFIG } from "../config";
import { useAuth } from "../store/auth";

// API Error Types
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Helper function for making API calls with error handling
async function makeApiCall(url, options = {}) {
  const { token } = useAuth.getState();



  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Token ${token}`;

  } else {
    console.warn(
      "[API] No token available - request will be sent without authentication"
    );
  }

  const defaultOptions = {
    method: "GET",
    headers: defaultHeaders,
    timeout: 10000,
    ...options,
    // Merge headers properly to avoid overwriting Authorization
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {


    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      defaultOptions.timeout
    );

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);



    // Handle different HTTP status codes
    if (response.status === 404) {
      throw new ApiError("Resource not found", 404);
    }

    if (response.status === 401) {
      throw new ApiError("Invalid credentials", 401);
    }

    if (response.status === 403) {
      throw new ApiError("Access denied", 403);
    }

    if (response.status >= 500) {
      throw new ApiError(
        "Server error. Please try again later",
        response.status
      );
    }

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If can't parse error JSON, use default message
      }
      throw new ApiError(errorMessage, response.status);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return { success: true, message: "Operation completed successfully" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("Request timeout. Please check your connection", 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors
    if (error.message.includes("Network request failed")) {
      throw new ApiError(
        "Unable to connect to server. Please check your internet connection",
        0
      );
    }

    if (error.message.includes("fetch")) {
      throw new ApiError("Connection failed. Please try again", 0);
    }

    // Unknown errors

    throw new ApiError(
      "An unexpected error occurred. Please try again",
      0,
      error
    );
  }
}

// AUTH
export async function apiLogin(credentials) {
  try {
    const response = await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/auth/login/`,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );

    // Validate response structure
    if (!response || !response.user || !response.token) {
      throw new ApiError("Invalid login response format", 422);
    }

    console.log("LOGIN RESPONSE:", JSON.stringify(response, null, 2));

    return response;
 
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Login failed. Please try again", 0, error);
  }
}

export async function apiGetPermissions() {
  try {
    const response = await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/auth/permissions/`,
      {
        method: "GET",
      }
    );
    // Expecting response: { permissions: { ... } }
    if (response.permissions) {
      console.log("PERMISSIONS FETCHED:", JSON.stringify(response.permissions, null, 2));
      return response.permissions;
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.warn("Permission fetch failed silently:", error);
    return {}; // Return empty permissions on failure rather than crashing
  }
}

export async function apiChooseRole(role) {
  try {
    return await makeApiCall(`${CONFIG.API_BASE_URL}/auth/choose-role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to select role. Please try again", 0, error);
  }
}

// NOTIFICATIONS - Driver
// Note: userId param kept for backward compatibility but not sent to backend
// Backend identifies user from JWT in Authorization header
export async function apiRegisterDriverToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/register-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to register device token", 0, error);
  }
}

export async function apiUnregisterDriverToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/unregister-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to unregister device token", 0, error);
  }
}

// NOTIFICATIONS - DBS
export async function apiRegisterDBSToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/register-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to register DBS device token", 0, error);
  }
}

export async function apiUnregisterDBSToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/unregister-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to unregister DBS device token", 0, error);
  }
}

// NOTIFICATIONS - MS
export async function apiRegisterMSToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/register-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to register MS device token", 0, error);
  }
}

export async function apiUnregisterMSToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/unregister-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to unregister MS device token", 0, error);
  }
}

// NOTIFICATIONS - EIC
export async function apiRegisterEICToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/register-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to register EIC device token", 0, error);
  }
}

export async function apiUnregisterEICToken(userId, deviceToken) {
  try {
    return await makeApiCall(
      `${CONFIG.API_BASE_URL}/api/notifications/unregister-token`,
      {
        method: "POST",
        body: JSON.stringify({ deviceToken }),
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to unregister EIC device token", 0, error);
  }
}
