import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiService, type MonthlyBill } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./Payments.css";

interface LocationState {
  billId?: number;
  month?: number;
  year?: number;
}

export function Payments() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    bill_id: state?.billId?.toString() || "",
    month: state?.month || new Date().getMonth() + 1,
    year: state?.year || new Date().getFullYear(),
    payment_value: "",
    payed_at: new Date().toISOString().split("T")[0],
    receipt_photo: null as File | null,
  });

  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.billId && bills.length > 0) {
      const billExists = bills.some(
        (b) => b.bill_id.toString() === formData.bill_id
      );
      if (!billExists) {
        setFormData((prev) => ({ ...prev, bill_id: "" }));
      }
    }
  }, [bills, state?.billId, formData.bill_id]);

  const loadBills = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMonthlyBills(
        formData.month,
        formData.year
      );
      setBills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "month" || name === "year" ? parseInt(value) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Recarregar contas quando mês ou ano mudar
    if (name === "month" || name === "year") {
      const updatedMonth = name === "month" ? parseInt(value) : formData.month;
      const updatedYear = name === "year" ? parseInt(value) : formData.year;
      loadBillsForMonth(updatedMonth, updatedYear);
    }
  };

  const loadBillsForMonth = async (month: number, year: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMonthlyBills(month, year);
      setBills(data);
      // Limpar seleção se a conta não existir mais
      setFormData((prev) => {
        const billExists = data.some(
          (b) => b.bill_id.toString() === prev.bill_id
        );
        return {
          ...prev,
          bill_id: billExists ? prev.bill_id : "",
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
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

    if (!formData.bill_id) {
      setError("Selecione uma conta");
      return;
    }

    if (!formData.payment_value || parseFloat(formData.payment_value) <= 0) {
      setError("Informe um valor válido");
      return;
    }

    setSubmitting(true);

    try {
      const payedAtDate = new Date(formData.payed_at);
      payedAtDate.setHours(12, 0, 0, 0);

      await apiService.createPayment({
        bill_id: parseInt(formData.bill_id),
        month: formData.month,
        year: formData.year,
        payment_value: parseFloat(formData.payment_value),
        payed_at: payedAtDate.toISOString(),
        receipt_photo: formData.receipt_photo || undefined,
      });

      setSuccess(true);
      setFormData({
        bill_id: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        payment_value: "",
        payed_at: new Date().toISOString().split("T")[0],
        receipt_photo: null,
      });
      setPreview(null);

      setTimeout(() => {
        setSuccess(false);
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao registrar pagamento"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBill = bills.find(
    (b) => b.bill_id.toString() === formData.bill_id
  );

  return (
    <div className="payments-container">
      <header className="payments-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Voltar
        </button>
        <h1>Registrar Pagamento</h1>
      </header>

      {loading && <div className="loading">Carregando contas...</div>}

      {error && <div className="error-message">{error}</div>}

      {success && (
        <div className="success-message">
          ✓ Pagamento registrado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="bill_id">Conta *</label>
          <select
            id="bill_id"
            name="bill_id"
            value={formData.bill_id}
            onChange={handleInputChange}
            required
            className="form-select"
          >
            <option value="">Selecione uma conta</option>
            {bills.map((bill) => (
              <option key={bill.bill_id} value={bill.bill_id}>
                {bill.descript} - {formatCurrency(bill.user_value)}
                {bill.is_paid && " (Pago)"}
              </option>
            ))}
          </select>
          {selectedBill && (
            <div className="bill-info">
              <p>
                <strong>Valor total:</strong>{" "}
                {formatCurrency(selectedBill.user_value)}
              </p>
              <p>
                <strong>Vencimento:</strong>{" "}
                {new Date(selectedBill.due_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="month">Mês *</label>
            <select
              id="month"
              name="month"
              value={formData.month}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleDateString("pt-BR", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="year">Ano *</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
              min="2020"
              max="2100"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="payment_value">Valor do Pagamento *</label>
          <input
            type="number"
            id="payment_value"
            name="payment_value"
            value={formData.payment_value}
            onChange={handleInputChange}
            required
            min="0.01"
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
          <label htmlFor="receipt_photo">Foto do Comprovante (opcional)</label>
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

        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? "Registrando..." : "Registrar Pagamento"}
        </button>
      </form>
    </div>
  );
}
