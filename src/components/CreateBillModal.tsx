import { useState, useEffect, type FormEvent } from "react";
import {
  apiService,
  type User,
  type ParticipantDto,
  type CreateBillDto,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";
import "./CreateBillModal.css";

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBillModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBillModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Campos do formulário
  const [descript, setDescript] = useState("");
  const [type, setType] = useState<"recorrente" | "parcelada">("recorrente");
  const [dueDay, setDueDay] = useState(1);
  const [totalValue, setTotalValue] = useState("");
  const [installments, setInstallments] = useState("");
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [currentMonthValue, setCurrentMonthValue] = useState("");

  // Participantes
  const [participants, setParticipants] = useState<ParticipantDto[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user && users.length > 0 && participants.length === 0) {
      // Adiciona o usuário atual como participante por padrão
      const userExists = users.some((u) => u.id === user.id);
      if (userExists) {
        setParticipants([{ user_id: user.id, share_percentage: 100 }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, users]);

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar usuários"
      );
    }
  };

  const handleAddParticipant = () => {
    // Encontra o primeiro usuário que ainda não está na lista de participantes
    const addedUserIds = participants.map((p) => p.user_id);
    const availableUser = users.find((u) => !addedUserIds.includes(u.id));

    if (availableUser) {
      setParticipants([
        ...participants,
        { user_id: availableUser.id, share_percentage: 0 },
      ]);
    } else {
      setError("Todos os usuários já foram adicionados como participantes");
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (
    index: number,
    field: "user_id" | "share_percentage",
    value: number
  ) => {
    // Se está mudando o user_id, verifica se já não está em outro participante
    if (field === "user_id") {
      const isDuplicate = participants.some(
        (p, i) => i !== index && p.user_id === value
      );
      if (isDuplicate) {
        setError("Este usuário já foi adicionado como participante");
        return;
      }
    }

    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
    setError(""); // Limpa o erro se a mudança foi bem-sucedida
  };

  const calculateTotalPercentage = () => {
    return participants.reduce((sum, p) => sum + (p.share_percentage || 0), 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (!descript.trim()) {
      setError("A descrição é obrigatória");
      return;
    }

    if (participants.length === 0) {
      setError("Adicione pelo menos um participante");
      return;
    }

    const totalPercentage = calculateTotalPercentage();
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(
        `A soma das porcentagens deve ser 100% (atual: ${totalPercentage.toFixed(
          2
        )}%)`
      );
      return;
    }

    if (type === "parcelada") {
      if (!totalValue || parseFloat(totalValue) <= 0) {
        setError("O valor total é obrigatório para contas parceladas");
        return;
      }
      if (!installments || parseInt(installments) <= 0) {
        setError("O número de parcelas é obrigatório para contas parceladas");
        return;
      }
    } else {
      if (!currentMonthValue || parseFloat(currentMonthValue) <= 0) {
        setError("O valor mensal é obrigatório para contas recorrentes");
        return;
      }
    }

    setLoading(true);

    try {
      const billData: CreateBillDto = {
        descript: descript.trim(),
        type,
        due_day: dueDay,
        participants,
        ...(type === "parcelada"
          ? {
              total_value: parseFloat(totalValue),
              installments: parseInt(installments),
              start_month: startMonth,
              start_year: startYear,
            }
          : {
              current_month_value: parseFloat(currentMonthValue),
            }),
      };

      await apiService.createBill(billData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescript("");
    setType("recorrente");
    setDueDay(1);
    setTotalValue("");
    setInstallments("");
    setStartMonth(new Date().getMonth() + 1);
    setStartYear(new Date().getFullYear());
    setCurrentMonthValue("");
    setParticipants([]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const totalPercentage = calculateTotalPercentage();
  const percentageError = Math.abs(totalPercentage - 100) > 0.01;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Nova Conta</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-bill-form">
          <div className="form-group">
            <label htmlFor="descript">Descrição *</label>
            <input
              id="descript"
              type="text"
              value={descript}
              onChange={(e) => setDescript(e.target.value)}
              required
              placeholder="Ex: Aluguel do apartamento"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Tipo de Conta *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as "recorrente" | "parcelada";
                setType(newType);
                // Limpa campos específicos ao mudar o tipo
                if (newType === "parcelada") {
                  setCurrentMonthValue("");
                } else {
                  setTotalValue("");
                  setInstallments("");
                }
              }}
              required
            >
              <option value="recorrente">Recorrente</option>
              <option value="parcelada">Parcelada</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDay">Dia de Vencimento *</label>
            <input
              id="dueDay"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {type === "parcelada" ? (
            <>
              <div className="form-group">
                <label htmlFor="totalValue">Valor Total *</label>
                <input
                  id="totalValue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  required
                  placeholder="1500.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="installments">Número de Parcelas *</label>
                <input
                  id="installments"
                  type="number"
                  min="1"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  required
                  placeholder="12"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startMonth">Mês de Início *</label>
                  <input
                    id="startMonth"
                    type="number"
                    min="1"
                    max="12"
                    value={startMonth}
                    onChange={(e) =>
                      setStartMonth(parseInt(e.target.value) || 1)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startYear">Ano de Início *</label>
                  <input
                    id="startYear"
                    type="number"
                    min="2020"
                    max="2100"
                    value={startYear}
                    onChange={(e) =>
                      setStartYear(
                        parseInt(e.target.value) || new Date().getFullYear()
                      )
                    }
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="currentMonthValue">Valor do Mês Atual *</label>
              <input
                id="currentMonthValue"
                type="number"
                step="0.01"
                min="0.01"
                value={currentMonthValue}
                onChange={(e) => setCurrentMonthValue(e.target.value)}
                required
                placeholder="150.00"
              />
            </div>
          )}

          <div className="participants-section">
            <div className="participants-header">
              <label>Participantes *</label>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="add-participant-btn"
                disabled={
                  participants.length >= users.length || users.length === 0
                }
              >
                + Adicionar
              </button>
            </div>

            {participants.map((participant, index) => {
              // Filtra usuários já adicionados, exceto o próprio participante atual
              const addedUserIds = participants
                .map((p, i) => (i !== index ? p.user_id : null))
                .filter((id): id is number => id !== null);
              const availableUsers = users.filter(
                (u) => !addedUserIds.includes(u.id)
              );

              return (
                <div key={index} className="participant-row">
                  <select
                    value={participant.user_id}
                    onChange={(e) =>
                      handleParticipantChange(
                        index,
                        "user_id",
                        parseInt(e.target.value)
                      )
                    }
                    required
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  <div className="percentage-input">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={participant.share_percentage}
                      onChange={(e) =>
                        handleParticipantChange(
                          index,
                          "share_percentage",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                      placeholder="%"
                    />
                    <span>%</span>
                  </div>

                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(index)}
                      className="remove-participant-btn"
                    >
                      Remover
                    </button>
                  )}
                </div>
              );
            })}

            <div
              className={`percentage-total ${percentageError ? "error" : ""}`}
            >
              Total: {totalPercentage.toFixed(2)}%
              {percentageError && (
                <span className="error-text"> (deve ser 100%)</span>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

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
              {loading ? "Criando..." : "Criar Conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
