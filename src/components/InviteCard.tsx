import { type PendingInvite } from "../services/api";
import { formatDate } from "../utils/formatters";
import "./InviteCard.css";

interface InviteCardProps {
  invite: PendingInvite;
  onAccept: (billId: number) => void;
  onReject: (billId: number) => void;
  loading?: boolean;
}

export function InviteCard({
  invite,
  onAccept,
  onReject,
  loading = false,
}: InviteCardProps) {
  return (
    <div className="invite-card">
      <div className="invite-header">
        <div className="invite-info">
          <h3 className="invite-description">{invite.descript}</h3>
          <p className="invite-owner">Convidado por: {invite.owner_name}</p>
        </div>
        <span className="invite-badge">Convite Pendente</span>
      </div>

      <div className="invite-details">
        <div className="invite-detail">
          <span className="invite-label">Tipo:</span>
          <span className="invite-value">
            {invite.type === "recorrente" ? "Recorrente" : "Parcelada"}
          </span>
        </div>
        <div className="invite-detail">
          <span className="invite-label">Vencimento:</span>
          <span className="invite-value">Dia {invite.due_day}</span>
        </div>
        <div className="invite-detail">
          <span className="invite-label">Sua participação:</span>
          <span className="invite-value">{invite.share_percentage}%</span>
        </div>
        <div className="invite-detail">
          <span className="invite-label">Data do convite:</span>
          <span className="invite-value">{formatDate(invite.created_at)}</span>
        </div>
      </div>

      <div className="invite-actions">
        <button
          onClick={() => onReject(invite.bill_id)}
          className="invite-button reject-button"
          disabled={loading}
        >
          Rejeitar
        </button>
        <button
          onClick={() => onAccept(invite.bill_id)}
          className="invite-button accept-button"
          disabled={loading}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
