import { useNavigate } from "react-router-dom";
import { type MonthlyBill } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import "./BillCard.css";

interface BillCardProps {
  bill: MonthlyBill;
  month: number;
  year: number;
}

export function BillCard({ bill, month, year }: BillCardProps) {
  const navigate = useNavigate();

  const handlePay = () => {
    navigate("/payments", {
      state: {
        billId: bill.bill_id,
        month,
        year,
      },
    });
  };

  return (
    <div className={`bill-card ${bill.is_paid ? "paid" : "unpaid"}`}>
      <div className="bill-header">
        <h3 className="bill-description">{bill.descript}</h3>
        <span className={`bill-status ${bill.is_paid ? "paid" : "unpaid"}`}>
          {bill.is_paid ? "✓ Pago" : "Pendente"}
        </span>
      </div>

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
          {!bill.is_paid && (
            <button onClick={handlePay} className="pay-button">
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
        </div>
      </div>
    </div>
  );
}
