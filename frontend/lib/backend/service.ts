const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface BackendError {
  message: string;
  statusCode: number;
  error?: string;
}

const normalizeBackendMessage = (message: unknown): string => {
  if (typeof message === "string") return message;

  if (Array.isArray(message)) {
    const parts = message.filter(
      (item): item is string => typeof item === "string",
    );
    if (parts.length > 0) return parts.join(", ");
  }

  if (message && typeof message === "object") {
    const record = message as Record<string, unknown>;
    const nestedMessage = record.message;
    if (typeof nestedMessage === "string") return nestedMessage;
    if (Array.isArray(nestedMessage)) {
      const parts = nestedMessage.filter(
        (item): item is string => typeof item === "string",
      );
      if (parts.length > 0) return parts.join(", ");
    }
  }

  return "An error occurred";
};

class BackendService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data?: T; error?: BackendError; status: number }> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      let data: unknown = undefined;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        const record =
          data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : {};
        const message =
          data !== undefined
            ? normalizeBackendMessage(record.message ?? data)
            : response.statusText || "An error occurred";
        const errorCode =
          typeof record.error === "string" ? record.error : undefined;

        return {
          error: {
            message,
            statusCode:
              typeof record.statusCode === "number"
                ? record.statusCode
                : response.status,
            error: errorCode,
          },
          status: response.status,
        };
      }

      return { data: data as T, status: response.status };
    } catch (error) {
      return {
        error: {
          message: "Network error. Unable to reach backend server.",
          statusCode: 503,
        },
        status: 503,
      };
    }
  }
}

export const backendService = new BackendService(BACKEND_URL);
