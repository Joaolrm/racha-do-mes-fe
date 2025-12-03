import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { type MonthlyBill, apiService } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./PaymentPage.css";

interface LocationState {
  bill: MonthlyBill;
  month: number;
  year: number;
}

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    payment_value: state?.bill.value.toString() || "",
    payed_at: new Date().toISOString().split("T")[0],
    receipt_photo: null as File | null,
  });

  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.bill) {
      navigate("/");
      return;
    }

    setFormData({
      payment_value: state.bill.value.toString(),
      payed_at: new Date().toISOString().split("T")[0],
      receipt_photo: null,
    });
  }, [state, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("A foto deve ter no máximo 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, receipt_photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, receipt_photo: null }));
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.payment_value || parseFloat(formData.payment_value) < 0) {
      setError("Informe um valor válido");
      return;
    }

    if (!state?.bill || !state.month || !state.year) {
      setError("Dados da conta não encontrados");
      return;
    }

    setSubmitting(true);

    try {
      const payedAtDate = new Date(formData.payed_at);
      payedAtDate.setHours(12, 0, 0, 0);

      const paymentData: {
        bill_value_id?: number;
        bill_id?: number;
        month?: number;
        year?: number;
        payment_value: number;
        payed_at: string;
        receipt_photo?: File;
      } = {
        payment_value: parseFloat(formData.payment_value),
        payed_at: payedAtDate.toISOString(),
        receipt_photo: formData.receipt_photo || undefined,
      };

      try {
        const billValues = await apiService.getBillValues(
          state.bill.bill_id,
          state.month,
          state.year
        );
        const billValue = billValues.find(
          (bv) => bv.month === state.month && bv.year === state.year
        );

        if (billValue) {
          paymentData.bill_value_id = billValue.id;
        } else {
          paymentData.bill_id = state.bill.bill_id;
          paymentData.month = state.month;
          paymentData.year = state.year;
        }
      } catch {
        paymentData.bill_id = state.bill.bill_id;
        paymentData.month = state.month;
        paymentData.year = state.year;
      }

      await apiService.createPayment(paymentData);

      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao registrar pagamento"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!state?.bill) {
    return null;
  }

  return (
    <div className="payment-page">
      <header className="payment-page-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Voltar
        </button>
        <h1>Registrar Pagamento</h1>
      </header>

      <div className="payment-page-content">
        <div className="bill-summary-card">
          <h3>{state.bill.descript}</h3>
          <div className="bill-summary-info">
            <p>
              <strong>Valor total da conta:</strong>{" "}
              {formatCurrency(state.bill.value)}
            </p>
            <p>
              <strong>Sua parte:</strong>{" "}
              {formatCurrency(state.bill.user_value)} (
              {state.bill.share_percentage}%)
            </p>
            <p>
              <strong>Vencimento:</strong>{" "}
              {new Date(state.bill.due_date).toLocaleDateString("pt-BR")}
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
          <div className="success-message">
            ✓ Pagamento registrado com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label htmlFor="payment_value">Valor do Pagamento *</label>
            <input
              type="number"
              id="payment_value"
              name="payment_value"
              value={formData.payment_value}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="0,00"
              className="form-input"
            />
            {formData.payment_value && (
              <p className="form-hint">
                {formatCurrency(parseFloat(formData.payment_value) || 0)}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="payed_at">Data do Pagamento *</label>
            <input
              type="date"
              id="payed_at"
              name="payed_at"
              value={formData.payed_at}
              onChange={handleInputChange}
              required
              max={new Date().toISOString().split("T")[0]}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="receipt_photo">
              Foto do Comprovante (opcional)
            </label>
            <input
              type="file"
              id="receipt_photo"
              name="receipt_photo"
              accept="image/*"
              onChange={handleFileChange}
              className="form-file"
            />
            {preview && (
              <div className="photo-preview">
                <img src={preview} alt="Preview" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="remove-photo-button"
                >
                  Remover foto
                </button>
              </div>
            )}
            <p className="form-hint">Tamanho máximo: 5MB</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="cancel-button"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? "Registrando..." : "Registrar Pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
