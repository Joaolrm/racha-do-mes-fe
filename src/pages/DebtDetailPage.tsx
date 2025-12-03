import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { apiService, type DebtDetail } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import "./DebtDetailPage.css";

interface LocationState {
  userName?: string;
}

export function DebtDetailPage() {
  const navigate = useNavigate();
  const { creditorId } = useParams<{ creditorId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [detail, setDetail] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (creditorId) {
      loadDetail(parseInt(creditorId));
    }
  }, [creditorId]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMyDebtDetail(id);
      setDetail(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar detalhes"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = () => {
    // Por enquanto, vamos navegar para a página de pagamentos
    // O usuário pode selecionar a conta relacionada e pagar
    navigate("/payment");
  };

  const userName = detail?.user_name || state?.userName || "Usuário";

  return (
    <div className="debt-detail-container">
      <header className="debt-detail-header">
        <button className="back-button" onClick={() => navigate("/debts")}>
          ← Voltar
        </button>
        <h1>{userName}</h1>
      </header>

      {loading && <div className="loading">Carregando...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && detail && (
        <>
          <div className="total-card">
            <div className="total-label">Total devido</div>
            <div className="total-value">
              {formatCurrency(detail.total_value)}
            </div>
          </div>

          <div className="info-banner">
            <p>
              💡 Para pagar esta dívida, acesse a página de pagamentos e
              selecione a conta relacionada.
            </p>
          </div>

          <div className="history-section">
            <h2>Histórico</h2>
            {detail.history.length === 0 ? (
              <div className="empty-history">
                <p>Nenhum histórico disponível</p>
              </div>
            ) : (
              <div className="history-list">
                {detail.history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-main">
                      <div className="history-description">{item.descript}</div>
                      <div className="history-value">
                        {formatCurrency(item.value)}
                      </div>
                    </div>
                    <div className="history-date">
                      {formatDate(item.created_at.toString())}
                    </div>
                    {item.bill_id && (
                      <button
                        className="pay-item-button"
                        onClick={() =>
                          navigate("/payment", {
                            state: { billId: item.bill_id },
                          })
                        }
                      >
                        Pagar esta conta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
