import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, type CreditSummary } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./CreditsPage.css";

export function CreditsPage() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState<CreditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMyCredits();
      setCredits(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar créditos"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = credits.reduce(
    (sum, credit) => sum + credit.total_value,
    0
  );

  return (
    <div className="credits-container">
      <header className="credits-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Voltar
        </button>
        <h1>Me Deve</h1>
      </header>

      {loading && <div className="loading">Carregando...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="total-card">
            <div className="total-label">Total a receber</div>
            <div className="total-value">{formatCurrency(totalCredits)}</div>
          </div>

          <div className="credits-list">
            {credits.length === 0 ? (
              <div className="empty-state">
                <p>Ninguém te deve dinheiro no momento! 🎉</p>
              </div>
            ) : (
              credits.map((credit) => (
                <div
                  key={credit.user_id}
                  className="credit-card"
                  onClick={() =>
                    navigate(`/credits/${credit.user_id}`, {
                      state: { userName: credit.user_name },
                    })
                  }
                >
                  <div className="credit-info">
                    <div className="credit-name">{credit.user_name}</div>
                    <div className="credit-value">
                      {formatCurrency(credit.total_value)}
                    </div>
                  </div>
                  <div className="credit-arrow">›</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
