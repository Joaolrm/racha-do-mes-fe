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

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
}

export interface ParticipantDto {
  user_id: number;
  share_percentage: number;
}

export interface CreateBillDto {
  descript: string;
  type: "recorrente" | "parcelada";
  due_day: number;
  total_value?: number;
  installments?: number;
  start_month?: number;
  start_year?: number;
  current_month_value?: number;
  participants: ParticipantDto[];
}

export interface PendingInvite {
  bill_id: number;
  descript: string;
  type: "recorrente" | "parcelada";
  due_day: number;
  owner_name: string;
  share_percentage: number;
  created_at: string;
}

export interface AcceptInviteDto {
  status: "accepted" | "rejected";
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

  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/users");
  }

  async createBill(data: CreateBillDto): Promise<void> {
    return this.request<void>("/bills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPendingInvites(): Promise<PendingInvite[]> {
    return this.request<PendingInvite[]>("/bills/invites/pending");
  }

  async respondToInvite(
    billId: number,
    status: "accepted" | "rejected"
  ): Promise<void> {
    return this.request<void>(`/bills/${billId}/invite`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}

export const apiService = new ApiService();
