import { useState, useEffect } from "react";
import { type MonthlyBill, apiService } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./EditBillValueModal.css";

interface EditBillValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bill: MonthlyBill;
  month: number;
  year: number;
}

export function EditBillValueModal({
  isOpen,
  onClose,
  onSuccess,
  bill,
  month,
  year,
}: EditBillValueModalProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Converter o valor atual (que vem como string) para número
      const currentValue = parseFloat(bill.value) || 0;
      setValue(currentValue.toString());
      setError("");
      setSuccess(false);
    }
  }, [isOpen, bill.value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError("Informe um valor válido (maior ou igual a zero)");
      return;
    }

    setLoading(true);

    try {
      await apiService.updateBillValue(bill.bill_id, month, year, {
        value: numValue,
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar valor. Apenas o dono pode atualizar."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValue("");
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Valor da Conta</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="bill-summary">
          <h3>{bill.descript}</h3>
          <div className="bill-summary-info">
            <p>
              <strong>Mês/Ano:</strong>{" "}
              {new Date(year, month - 1).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <p>
              <strong>Valor atual:</strong>{" "}
              {formatCurrency(parseFloat(bill.value) || 0)}
            </p>
            {bill.installment_info && (
              <p>
                <strong>Parcela:</strong> {bill.installment_info}
              </p>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {success && (
          <div className="success-message">✓ Valor atualizado com sucesso!</div>
        )}

        <form onSubmit={handleSubmit} className="edit-value-form">
          <div className="form-group">
            <label htmlFor="value">Novo Valor *</label>
            <input
              type="number"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="0,00"
              className="form-input"
            />
            {value && (
              <p className="form-hint">
                {formatCurrency(parseFloat(value) || 0)}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Valor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
