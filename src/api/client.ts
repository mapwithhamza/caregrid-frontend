import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class CareGridApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "CareGridApiError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const timeoutMessage = "The backend request timed out. Please try again.";
      const detail =
        (error.response?.data as Record<string, unknown> | undefined)?.detail ??
        error.message;
      const message =
        error.code === "ECONNABORTED"
          ? timeoutMessage
          : String(detail ?? "CareGrid API request failed.");

      return Promise.reject(
        new CareGridApiError(message, {
          status: error.response?.status,
          code: error.code,
          details: error.response?.data
        })
      );
    }

    return Promise.reject(error);
  }
);

export { API_BASE_URL };
