import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { apiService, type DebtDetail } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import "./CreditDetailPage.css";

interface LocationState {
  userName?: string;
}

export function CreditDetailPage() {
  const navigate = useNavigate();
  const { debtorId } = useParams<{ debtorId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [detail, setDetail] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentValue, setPaymentValue] = useState("");

  useEffect(() => {
    if (debtorId) {
      loadDetail(parseInt(debtorId));
    }
  }, [debtorId]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMyCreditDetail(id);
      setDetail(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar detalhes"
      );
    } finally {
      setLoading(false);
    }
  };

  const generateChargeMessage = () => {
    if (!detail) return "";

    let message = `💰 *Cobrança - ${detail.user_name}*\n\n`;
    message += `Olá, ${detail.user_name}! 😊\n\n`;
    message += `Segue o detalhamento do que você me deve:\n\n`;

    detail.history.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("pt-BR");
      message += `• ${item.descript}\n`;
      message += `  Valor: *${formatCurrency(item.value)}*\n`;
      message += `  Data: ${date}\n\n`;
    });

    message += `📊 *Total devido: ${formatCurrency(detail.total_value)}*\n\n`;
    message += `Quando puder, vamos acertar isso, combinado? Obrigado! 😊\n\n`;
    message += `_Mensagem gerada pelo Racha do Mês_`;

    return message;
  };

  const handleCopyToWhatsApp = async () => {
    if (!detail) return;

    const message = generateChargeMessage();

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!detail) return;

    const message = generateChargeMessage();
    const encodedMessage = encodeURIComponent(message);

    // Tenta abrir WhatsApp Web ou app
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleOpenPaymentModal = () => {
    setPaymentValue(detail?.total_value.toString() || "");
    setShowPaymentModal(true);
    setError("");
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentValue("");
    setError("");
  };

  const handleConfirmPayment = async () => {
    if (!detail || !debtorId) return;

    const value = parseFloat(paymentValue);
    if (isNaN(value) || value <= 0) {
      setError("Informe um valor válido maior que zero");
      return;
    }

    setConfirming(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await apiService.confirmPayment(
        parseInt(debtorId),
        value
      );
      setSuccessMessage(response.message);
      setShowPaymentModal(false);
      setPaymentValue("");

      // Recarregar os detalhes após confirmação
      setTimeout(() => {
        loadDetail(parseInt(debtorId));
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao confirmar pagamento"
      );
    } finally {
      setConfirming(false);
    }
  };

  const userName = detail?.user_name || state?.userName || "Usuário";

  return (
    <div className="credit-detail-container">
      <header className="credit-detail-header">
        <button className="back-button" onClick={() => navigate("/credits")}>
          ← Voltar
        </button>
        <h1>{userName}</h1>
      </header>

      {loading && <div className="loading">Carregando...</div>}

      {error && <div className="error-message">{error}</div>}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {!loading && !error && detail && (
        <>
          <div className="total-card">
            <div className="total-label">Total devido</div>
            <div className="total-value">
              {formatCurrency(detail.total_value)}
            </div>
          </div>

          <div className="actions-section">
            <button
              className="copy-button"
              onClick={handleCopyToWhatsApp}
              disabled={copied}
            >
              {copied ? "✓ Copiado!" : "📋 Copiar Mensagem"}
            </button>
            <button className="whatsapp-button" onClick={handleOpenWhatsApp}>
              💬 Abrir WhatsApp
            </button>
          </div>

          {detail.total_value > 0 && (
            <div className="confirm-payment-section">
              <button
                className="confirm-payment-button"
                onClick={handleOpenPaymentModal}
              >
                ✓ Confirmar Pagamento
              </button>
            </div>
          )}

          {showPaymentModal && detail && (
            <div className="modal-overlay" onClick={handleClosePaymentModal}>
              <div
                className="payment-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="payment-modal-header">
                  <h2>Confirmar Pagamento</h2>
                  <button
                    className="modal-close"
                    onClick={handleClosePaymentModal}
                  >
                    ×
                  </button>
                </div>
                <div className="payment-modal-body">
                  <div className="payment-info">
                    <p>
                      <strong>Total devido:</strong>{" "}
                      {formatCurrency(detail.total_value)}
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="payment-value">
                      Valor do pagamento (R$)
                    </label>
                    <input
                      id="payment-value"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={detail.total_value * 2}
                      value={paymentValue}
                      onChange={(e) => setPaymentValue(e.target.value)}
                      placeholder={detail.total_value.toString()}
                      disabled={confirming}
                    />
                    <small className="form-hint">
                      Deixe em branco ou informe o valor. Se for maior que o
                      devido, a dívida será invertida.
                    </small>
                  </div>
                  {error && <div className="error-message">{error}</div>}
                </div>
                <div className="payment-modal-footer">
                  <button
                    className="cancel-button"
                    onClick={handleClosePaymentModal}
                    disabled={confirming}
                  >
                    Cancelar
                  </button>
                  <button
                    className="confirm-button"
                    onClick={handleConfirmPayment}
                    disabled={confirming || !paymentValue}
                  >
                    {confirming ? "Confirmando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          )}

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
