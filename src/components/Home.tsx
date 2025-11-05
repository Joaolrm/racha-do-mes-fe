import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService, type MonthlyBill } from "../services/api";
import { MonthSelector } from "./MonthSelector";
import "./Home.css";

export function Home() {
  const { user, logout } = useAuth();
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    loadBills();
  }, [month, year]);

  const loadBills = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiService.getMonthlyBills(month, year);
      setBills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const totalValue = bills.reduce((sum, bill) => sum + bill.user_value, 0);
  const paidCount = bills.filter((bill) => bill.is_paid).length;
  const unpaidCount = bills.length - paidCount;

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="user-info">
          <h2>Olá, {user?.name}</h2>
          <button onClick={logout} className="logout-button">
            Sair
          </button>
        </div>
      </header>

      <MonthSelector
        month={month}
        year={year}
        onMonthChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total do Mês</div>
          <div className="summary-value">{formatCurrency(totalValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Pendentes</div>
          <div className="summary-value unpaid">{unpaidCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Pagas</div>
          <div className="summary-value paid">{paidCount}</div>
        </div>
      </div>

      {loading && <div className="loading">Carregando contas...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="bills-list">
          {bills.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma conta encontrada para este mês</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.bill_id}
                className={`bill-card ${bill.is_paid ? "paid" : "unpaid"}`}
              >
                <div className="bill-header">
                  <h3 className="bill-description">{bill.descript}</h3>
                  <span
                    className={`bill-status ${
                      bill.is_paid ? "paid" : "unpaid"
                    }`}
                  >
                    {bill.is_paid ? "✓ Pago" : "Pendente"}
                  </span>
                </div>

                <div className="bill-info">
                  <div className="bill-detail">
                    <span className="bill-label">Vencimento:</span>
                    <span className="bill-value">
                      {formatDate(bill.due_date)}
                    </span>
                  </div>

                  {bill.installment_info && (
                    <div className="bill-detail">
                      <span className="bill-label">Parcela:</span>
                      <span className="bill-value">
                        {bill.installment_info}
                      </span>
                    </div>
                  )}

                  <div className="bill-detail">
                    <span className="bill-label">Sua parte:</span>
                    <span className="bill-value">{bill.share_percentage}%</span>
                  </div>
                </div>

                <div className="bill-footer">
                  <div className="bill-amount">
                    {formatCurrency(bill.user_value)}
                  </div>
                  <div className="bill-type">{bill.type}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
