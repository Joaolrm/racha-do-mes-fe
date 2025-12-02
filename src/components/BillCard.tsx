import { useState } from "react";
import { type MonthlyBill, apiService } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { CreatePaymentModal } from "./CreatePaymentModal";
import "./BillCard.css";

interface BillCardProps {
  bill: MonthlyBill;
  month: number;
  year: number;
  onBillDeleted?: () => void;
  onPaymentSuccess?: () => void;
}

export function BillCard({
  bill,
  month,
  year,
  onBillDeleted,
  onPaymentSuccess,
}: BillCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleDelete = async () => {
    const isRecurring = bill.type === "recorrente";
    const message = isRecurring
      ? `⚠️ ATENÇÃO: Esta é uma conta RECORRENTE!\n\nAo deletar esta conta, TODA A CADEIA será removida, incluindo todas as ocorrências futuras e passadas desta conta.\n\nTem certeza que deseja deletar a conta "${bill.descript}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão removidos permanentemente.`
      : `Tem certeza que deseja deletar a conta "${bill.descript}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão removidos.`;

    if (!window.confirm(message)) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await apiService.deleteBill(bill.bill_id);
      if (onBillDeleted) {
        onBillDeleted();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao deletar conta. Apenas o dono pode deletá-la."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className={`bill-card ${bill.is_paid ? "paid" : "unpaid"}`}>
      <div className="bill-header">
        <h3 className="bill-description">{bill.descript}</h3>
        <span className={`bill-status ${bill.is_paid ? "paid" : "unpaid"}`}>
          {bill.is_paid ? "✓ Pago" : "Pendente"}
        </span>
      </div>

      {error && <div className="bill-error">{error}</div>}

      <div className="bill-info">
        <div className="bill-detail">
          <span className="bill-label">Vencimento:</span>
          <span className="bill-value">{formatDate(bill.due_date)}</span>
        </div>

        {bill.installment_info && (
          <div className="bill-detail">
            <span className="bill-label">Parcela:</span>
            <span className="bill-value">{bill.installment_info}</span>
          </div>
        )}

        <div className="bill-detail">
          <span className="bill-label">Sua parte:</span>
          <span className="bill-value">{bill.share_percentage}%</span>
        </div>
      </div>

      <div className="bill-footer">
        <div className="bill-amount">{formatCurrency(bill.user_value)}</div>
        <div className="bill-actions">
          <div className="bill-type">{bill.type}</div>
          <div className="bill-buttons">
            {!bill.is_paid && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="pay-button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Pagar
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="delete-button"
              title="Deletar conta (apenas o dono pode deletar)"
            >
              {isDeleting ? (
                "Deletando..."
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <CreatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        }}
        bill={bill}
        month={month}
        year={year}
      />
    </div>
  );
}
