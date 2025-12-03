import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { type MonthlyBill, apiService } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./EditBillValuePage.css";

interface LocationState {
  bill: MonthlyBill;
  month: number;
  year: number;
}

export function EditBillValuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!state?.bill) {
      navigate("/");
      return;
    }

    const currentValue = state.bill.value || 0;
    setValue(currentValue.toString());
  }, [state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError("Informe um valor válido (maior ou igual a zero)");
      return;
    }

    if (!state?.bill || !state.month || !state.year) {
      setError("Dados da conta não encontrados");
      return;
    }

    setLoading(true);

    try {
      await apiService.updateBillValue(
        state.bill.bill_id,
        state.month,
        state.year,
        {
          value: numValue,
        }
      );

      setSuccess(true);

      setTimeout(() => {
        navigate("/", {
          state: { month: state.month, year: state.year },
        });
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

  if (!state?.bill) {
    return null;
  }

  return (
    <div className="edit-bill-value-page">
      <header className="edit-bill-value-header">
        <button
          className="back-button"
          onClick={() =>
            navigate("/", {
              state: { month: state.month, year: state.year },
            })
          }
        >
          ← Voltar
        </button>
        <h1>Editar Valor da Conta</h1>
      </header>

      <div className="edit-bill-value-content">
        <div className="bill-summary-card">
          <h3>{state.bill.descript}</h3>
          <div className="bill-summary-info">
            <p>
              <strong>Mês/Ano:</strong>{" "}
              {new Date(state.year, state.month - 1).toLocaleDateString(
                "pt-BR",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>
            <p>
              <strong>Valor atual:</strong>{" "}
              {formatCurrency(state.bill.value || 0)}
            </p>
            {state.bill.installment_info && (
              <p>
                <strong>Parcela:</strong> {state.bill.installment_info}
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

          <div className="form-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/", {
                  state: { month: state.month, year: state.year },
                })
              }
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
