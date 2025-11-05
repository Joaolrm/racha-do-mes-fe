const API_BASE_URL = "http://localhost:3000";

export interface LoginDto {
  emailOrPhone: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email?: string;
  phone_number?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
}

export interface MonthlyBill {
  bill_id: number;
  descript: string;
  type: "recorrente" | "parcelada";
  installment_number: number | null;
  total_installments: number | null;
  installment_info: string | null;
  due_date: string;
  value: string;
  is_paid: boolean;
  share_percentage: string;
  user_value: number;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Erro desconhecido" }));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  async login(credentials: LoginDto): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMonthlyBills(month: number, year: number): Promise<MonthlyBill[]> {
    return this.request<MonthlyBill[]>(
      `/bills/my-bills/monthly?month=${month}&year=${year}`
    );
  }
}

export const apiService = new ApiService();
