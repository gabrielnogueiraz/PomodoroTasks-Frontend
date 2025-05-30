const API_BASE_URL = "http://localhost:8080/api";

export type ApiError = {
  status: number;
  message: string;
  data?: any;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: data.message || "Erro na requisição",
      data,
    };
    throw error;
  }

  return data as T;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("@PomodoroTasks:token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  get: async <T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> => {
    let url = `${API_BASE_URL}${endpoint}`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      } as HeadersInit,
    });

    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      } as HeadersInit,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      } as HeadersInit,
      body: JSON.stringify(data),
    });

    return handleResponse<T>(response);
  },

  patch: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      } as HeadersInit,
      body: JSON.stringify(data),
    });

    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      } as HeadersInit,
    });

    return handleResponse<T>(response);
  },
};
