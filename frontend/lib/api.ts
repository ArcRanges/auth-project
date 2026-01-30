export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionResponse {
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface Session {
  sessionId: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export interface CurrentSessionsResponse {
  current_session_id: string | null;
  sessions: Session[];
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `/api${endpoint}`;

    const config: RequestInit = {
      ...options,
      credentials: "include",
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
        const errorObj =
          typeof data === "object" && data !== null
            ? (data as Record<string, unknown>)
            : {};
        const message =
          typeof errorObj.message === "string"
            ? errorObj.message
            : "An error occurred";
        const errorCode =
          typeof errorObj.error === "string" ? errorObj.error : undefined;

        throw {
          message,
          statusCode: response.status,
          error: errorCode,
        } as ApiError;
      }

      return data as T;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error;
      }
      throw {
        message: "Network error. Please check your connection.",
        statusCode: 0,
      } as ApiError;
    }
  }

  async login(credentials: LoginCredentials): Promise<SessionResponse> {
    return this.request<SessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<SessionResponse> {
    return this.request<SessionResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>("/auth/refresh", {
      method: "POST",
    });
  }

  async logout(): Promise<void> {
    return this.request<void>("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request("/users/current", {
      method: "GET",
    });
  }

  async updateCurrentUser(data: {
    email?: string;
    name?: string;
    password?: string;
  }): Promise<User> {
    return this.request<User>("/users/current", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCurrentUser(): Promise<void> {
    return this.request<void>("/users/current", {
      method: "DELETE",
    });
  }

  async listCurrentSessions(): Promise<CurrentSessionsResponse> {
    return this.request<CurrentSessionsResponse>("/auth/current/sessions", {
      method: "GET",
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    return this.request<void>(
      `/auth/current/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
      },
    );
  }

  async revokeOtherSessions(): Promise<void> {
    return this.request<void>("/auth/current/sessions/revoke-others", {
      method: "POST",
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>("/users", {
      method: "GET",
    });
  }
}

export const apiClient = new ApiClient();
