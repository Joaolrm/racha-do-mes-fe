import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiService, type MonthlyBill } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import "./Payments.css";

interface LocationState {
  billId?: number;
  month?: number;
  year?: number;
  userValue?: number;
  dueDate?: string;
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

  // Verifica se veio de uma conta específica (modo pré-preenchido)
  const isFromSpecificBill = !!state?.billId;

  const [formData, setFormData] = useState({
    bill_id: state?.billId?.toString() || "",
    month: state?.month || new Date().getMonth() + 1,
    year: state?.year || new Date().getFullYear(),
    payment_value: state?.userValue?.toString() || "",
    payed_at: new Date().toISOString().split("T")[0],
    receipt_photo: null as File | null,
  });

  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBills = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getMonthlyBills(
        formData.month,
        formData.year
      );
      setBills(data);

      // Se há um billId no state e ele existe nas contas carregadas, seleciona ele e preenche os dados
      if (state?.billId) {
        const bill = data.find(
          (b) => b.bill_id.toString() === state.billId?.toString()
        );
        if (bill) {
          setFormData((prev) => ({
            ...prev,
            bill_id: state.billId!.toString(),
            payment_value: bill.user_value.toString(),
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Se veio de uma conta específica, não permite alterar campos bloqueados
    if (isFromSpecificBill) {
      const blockedFields = ["bill_id", "month", "year", "payment_value"];
      if (blockedFields.includes(e.target.name)) {
        return;
      }
    }

    const { name, value } = e.target;
    const newValue =
      name === "month" || name === "year" ? parseInt(value) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Recarregar contas quando mês ou ano mudar (apenas se não estiver bloqueado)
    if (!isFromSpecificBill && (name === "month" || name === "year")) {
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
      // Manter seleção se a conta ainda existir, ou selecionar a conta do state se existir
      setFormData((prev) => {
        const currentBillId = prev.bill_id;
        const stateBillId = state?.billId?.toString();

        // Se há uma conta selecionada atualmente, verifica se ainda existe
        if (currentBillId) {
          const billExists = data.some(
            (b) => b.bill_id.toString() === currentBillId
          );
          if (billExists) {
            return prev; // Mantém a seleção atual
          }
        }

        // Se não há seleção atual mas há um billId no state, tenta selecioná-lo
        if (stateBillId && !currentBillId) {
          const stateBillExists = data.some(
            (b) => b.bill_id.toString() === stateBillId
          );
          if (stateBillExists) {
            return { ...prev, bill_id: stateBillId };
          }
        }

        // Se nada funcionou, limpa a seleção
        return {
          ...prev,
          bill_id: "",
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

    if (!formData.payment_value || parseFloat(formData.payment_value) < 0) {
      setError("Informe um valor válido");
      return;
    }

    setSubmitting(true);

    try {
      const payedAtDate = new Date(formData.payed_at);
      payedAtDate.setHours(12, 0, 0, 0);

      // Tentar buscar o bill_value_id primeiro
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
          parseInt(formData.bill_id),
          formData.month,
          formData.year
        );
        const billValue = billValues.find(
          (bv) => bv.month === formData.month && bv.year === formData.year
        );

        if (billValue) {
          // Se encontrou o bill_value_id, usa ele
          paymentData.bill_value_id = billValue.id;
        } else {
          // Se não encontrou, usa bill_id, month e year (para contas recorrentes sem bill-value gerado)
          paymentData.bill_id = parseInt(formData.bill_id);
          paymentData.month = formData.month;
          paymentData.year = formData.year;
        }
      } catch {
        // Se der erro ao buscar, usa bill_id, month e year diretamente
        paymentData.bill_id = parseInt(formData.bill_id);
        paymentData.month = formData.month;
        paymentData.year = formData.year;
      }

      await apiService.createPayment(paymentData);

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
            disabled={isFromSpecificBill}
            className={`form-select ${isFromSpecificBill ? "disabled" : ""}`}
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
              disabled={isFromSpecificBill}
              className={`form-select ${isFromSpecificBill ? "disabled" : ""}`}
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
              disabled={isFromSpecificBill}
              min="2020"
              max="2100"
              className={`form-input ${isFromSpecificBill ? "disabled" : ""}`}
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
            disabled={isFromSpecificBill}
            min="0"
            step="0.01"
            placeholder="0,00"
            className={`form-input ${isFromSpecificBill ? "disabled" : ""}`}
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
