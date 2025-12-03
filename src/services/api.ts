import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  value: number;
  is_paid: boolean;
  share_percentage: number;
  user_value: number;
  bill_value_id?: number;
}

export interface BillValue {
  id: number;
  bill_id: number;
  month: number;
  year: number;
  value: number;
}

export interface UpdateBillValueDto {
  value: number;
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

export interface CreatePaymentDto {
  bill_value_id?: number;
  bill_id?: number;
  month?: number;
  year?: number;
  payment_value: number;
  payed_at: string;
  receipt_photo?: File;
}

export interface Payment {
  id: number;
  bill_id: number;
  user_id: number;
  payment_value: number;
  payed_at: string;
  receipt_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface DebtSummary {
  user_id: number;
  user_name: string;
  total_value: number;
}

export interface CreditSummary {
  user_id: number;
  user_name: string;
  total_value: number;
}

export interface DebtDetailItem {
  id: number;
  bill_id: number | null;
  descript: string;
  value: number;
  created_at: Date;
}

export interface DebtDetail {
  user_id: number;
  user_name: string;
  total_value: number;
  history: DebtDetailItem[];
}

export interface ChargeMessageResponse {
  message: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Interceptor para adicionar o token em todas as requisições
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Interceptor para tratar erros
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<{ message?: string }>) => {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          `Erro ${error.response?.status || "desconhecido"}`;
        throw new Error(errorMessage);
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const response = await this.axiosInstance.request<T>({
      url: endpoint,
      ...config,
    });
    return response.data;
  }

  async login(credentials: LoginDto): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      data: credentials,
    });
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      data: data,
    });
  }

  async getMonthlyBills(month: number, year: number): Promise<MonthlyBill[]> {
    const data = await this.request<MonthlyBill[]>(
      `/bills/my-bills/monthly?month=${month}&year=${year}`
    );
    // Normaliza is_paid para garantir que seja sempre boolean
    return data.map((bill) => ({
      ...bill,
      is_paid:
        typeof bill.is_paid === "boolean"
          ? bill.is_paid
          : bill.is_paid === "true" ||
            bill.is_paid === "1" ||
            bill.is_paid === 1 ||
            bill.is_paid === true,
    }));
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/users");
  }

  async createBill(data: CreateBillDto): Promise<void> {
    return this.request<void>("/bills", {
      method: "POST",
      data: data,
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
      data: { status },
    });
  }

  async getBillValues(
    billId: number,
    month?: number,
    year?: number
  ): Promise<BillValue[]> {
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());

    const query = params.toString();
    return this.request<BillValue[]>(
      `/bills/${billId}/values${query ? `?${query}` : ""}`
    );
  }

  async updateBillValue(
    billId: number,
    month: number,
    year: number,
    data: UpdateBillValueDto
  ): Promise<void> {
    return this.request<void>(`/bills/${billId}/values/${month}/${year}`, {
      method: "PATCH",
      data,
    });
  }

  async createPayment(data: CreatePaymentDto): Promise<void> {
    const formData = new FormData();

    if (data.bill_value_id) {
      formData.append("bill_value_id", data.bill_value_id.toString());
    } else if (data.bill_id && data.month && data.year) {
      formData.append("bill_id", data.bill_id.toString());
      formData.append("month", data.month.toString());
      formData.append("year", data.year.toString());
    } else {
      throw new Error(
        "É necessário fornecer bill_value_id ou (bill_id, month e year)"
      );
    }

    formData.append("payment_value", data.payment_value.toString());
    formData.append("payed_at", data.payed_at);

    if (data.receipt_photo) {
      formData.append("receipt_photo", data.receipt_photo);
    }

    // Para FormData, o axios define o Content-Type automaticamente com o boundary correto
    const response = await this.axiosInstance.post<void>("/payments", formData);
    return response.data;
  }

  async getPayments(billId?: number, userId?: number): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (billId) params.append("billId", billId.toString());
    if (userId) params.append("userId", userId.toString());

    const query = params.toString();
    return this.request<Payment[]>(`/payments${query ? `?${query}` : ""}`);
  }

  async deleteBill(billId: number): Promise<void> {
    return this.request<void>(`/bills/${billId}`, {
      method: "DELETE",
    });
  }

  // Balance endpoints
  async getMyCredits(): Promise<CreditSummary[]> {
    return this.request<CreditSummary[]>("/balance/me/credits");
  }

  async getMyCreditDetail(debtorId: number): Promise<DebtDetail> {
    return this.request<DebtDetail>(`/balance/me/credits/${debtorId}`);
  }

  async getMyDebts(): Promise<DebtSummary[]> {
    return this.request<DebtSummary[]>("/balance/me/debts");
  }

  async getMyDebtDetail(creditorId: number): Promise<DebtDetail> {
    return this.request<DebtDetail>(`/balance/me/debts/${creditorId}`);
  }

  async getChargeMessage(userId?: number): Promise<ChargeMessageResponse> {
    const endpoint = userId
      ? `/balance/charge-message/${userId}`
      : "/balance/charge-message/me";
    return this.request<ChargeMessageResponse>(endpoint);
  }

  async confirmPayment(
    debtorId: number,
    paymentValue?: number
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/balance/me/credits/${debtorId}/confirm-payment`,
      {
        method: "POST",
        data: paymentValue ? { payment_value: paymentValue } : {},
      }
    );
  }
}

export const apiService = new ApiService();
