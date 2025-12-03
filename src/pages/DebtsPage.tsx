import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, type DebtSummary } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./DebtsPage.css";

export function DebtsPage() {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMyDebts();
      setDebts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dívidas");
    } finally {
      setLoading(false);
    }
  };

  const totalDebts = debts.reduce((sum, debt) => sum + debt.total_value, 0);

  return (
    <div className="debts-container">
      <header className="debts-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Voltar
        </button>
        <h1>Eu Devo</h1>
      </header>

      {loading && <div className="loading">Carregando...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="total-card">
            <div className="total-label">Total a pagar</div>
            <div className="total-value">{formatCurrency(totalDebts)}</div>
          </div>

          <div className="debts-list">
            {debts.length === 0 ? (
              <div className="empty-state">
                <p>Você não possui dívidas pendentes! 🎉</p>
              </div>
            ) : (
              debts.map((debt) => (
                <div
                  key={debt.user_id}
                  className="debt-card"
                  onClick={() =>
                    navigate(`/debts/${debt.user_id}`, {
                      state: { userName: debt.user_name },
                    })
                  }
                >
                  <div className="debt-info">
                    <div className="debt-name">{debt.user_name}</div>
                    <div className="debt-value">
                      {formatCurrency(debt.total_value)}
                    </div>
                  </div>
                  <div className="debt-arrow">›</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
