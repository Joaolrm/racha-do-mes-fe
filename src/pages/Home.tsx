import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  apiService,
  type MonthlyBill,
  type DebtSummary,
} from "../services/api";
import { MonthSelector } from "../components/MonthSelector";
import { BillCard } from "../components/BillCard";
import { SummaryCard } from "../components/SummaryCard";
import { InvitesDropdown } from "../components/InvitesDropdown";
import { formatCurrency } from "../utils/formatters";
import "./Home.css";

interface LocationState {
  month?: number;
  year?: number;
}

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prevLocationRef = useRef(location.pathname);

  const now = new Date();
  const locationState = location.state as LocationState | null;
  const [month, setMonth] = useState(
    locationState?.month || now.getMonth() + 1
  );
  const [year, setYear] = useState(locationState?.year || now.getFullYear());

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
    loadDebts();
  }, [loadBills]);

  const loadDebts = useCallback(async () => {
    try {
      const data = await apiService.getMyDebts();
      setDebts(data);
    } catch (err) {
      // Silenciar erro de dívidas para não interferir na experiência
      console.error("Erro ao carregar dívidas:", err);
    }
  }, []);

  // Atualiza mês/ano quando volta de outras páginas
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.month && state?.year) {
      setMonth(state.month);
      setYear(state.year);
    }
  }, [location.state]);

  // Recarrega quando volta de outras páginas
  useEffect(() => {
    if (
      prevLocationRef.current !== "/" &&
      location.pathname === "/" &&
      prevLocationRef.current !== location.pathname
    ) {
      loadBills();
    }
    prevLocationRef.current = location.pathname;
  }, [location.pathname, loadBills]);

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

      {debts.length > 0 && (
        <div className="debts-notification">
          <div className="debts-notification-content">
            <span className="debts-notification-icon">🔔</span>
            <div className="debts-notification-text">
              <strong>
                Você possui {debts.length} dívida{debts.length > 1 ? "s" : ""}{" "}
                pendente{debts.length > 1 ? "s" : ""}
              </strong>
              <span className="debts-notification-value">
                Total:{" "}
                {formatCurrency(
                  debts.reduce((sum, d) => sum + d.total_value, 0)
                )}
              </span>
            </div>
            <button
              className="debts-notification-button"
              onClick={() => navigate("/debts")}
            >
              Ver
            </button>
          </div>
        </div>
      )}

      <div className="navigation-cards">
        <div
          className="nav-card nav-card-credits"
          onClick={() => navigate("/credits")}
        >
          <div className="nav-card-icon">💰</div>
          <div className="nav-card-content">
            <div className="nav-card-title">Me Deve</div>
            <div className="nav-card-subtitle">Ver quem me deve</div>
          </div>
          <div className="nav-card-arrow">›</div>
        </div>
        <div
          className="nav-card nav-card-debts"
          onClick={() => navigate("/debts")}
        >
          <div className="nav-card-icon">📝</div>
          <div className="nav-card-content">
            <div className="nav-card-title">Eu Devo</div>
            <div className="nav-card-subtitle">
              {debts.length > 0
                ? `${debts.length} dívida${
                    debts.length > 1 ? "s" : ""
                  } pendente${debts.length > 1 ? "s" : ""}`
                : "Ver minhas dívidas"}
            </div>
          </div>
          <div className="nav-card-arrow">›</div>
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
              <BillCard
                key={bill.bill_id}
                bill={bill}
                month={month}
                year={year}
                onBillDeleted={loadBills}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
