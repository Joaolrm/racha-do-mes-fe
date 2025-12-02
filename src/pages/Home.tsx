import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService, type MonthlyBill } from "../services/api";
import { MonthSelector } from "../components/MonthSelector";
import { BillCard } from "../components/BillCard";
import { SummaryCard } from "../components/SummaryCard";
import { InvitesDropdown } from "../components/InvitesDropdown";
import { formatCurrency } from "../utils/formatters";
import "./Home.css";

export function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const loadBills = useCallback(async () => {
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
  }, [month, year]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const totalValue = bills.reduce((sum, bill) => sum + bill.user_value, 0);
  const paidCount = bills.filter((bill) => bill.is_paid).length;
  const unpaidCount = bills.length - paidCount;

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="user-info">
          <h2>Olá, {user?.name}</h2>
          <div className="header-actions">
            <InvitesDropdown onInviteAccepted={loadBills} />
            <button
              onClick={() => navigate("/create-bill")}
              className="create-bill-button"
            >
              + Nova Conta
            </button>
            <button onClick={logout} className="logout-button">
              Sair
            </button>
          </div>
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
        <SummaryCard label="Total do Mês" value={formatCurrency(totalValue)} />
        <SummaryCard label="Pendentes" value={unpaidCount} variant="unpaid" />
        <SummaryCard label="Pagas" value={paidCount} variant="paid" />
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
              <BillCard
                key={bill.bill_id}
                bill={bill}
                month={month}
                year={year}
                onBillDeleted={loadBills}
                onPaymentSuccess={loadBills}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
