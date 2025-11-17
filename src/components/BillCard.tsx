import { type MonthlyBill } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import "./BillCard.css";

interface BillCardProps {
  bill: MonthlyBill;
}

export function BillCard({ bill }: BillCardProps) {
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
        <div className="bill-type">{bill.type}</div>
      </div>
    </div>
  );
}
