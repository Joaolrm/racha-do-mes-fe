import { useState, useEffect, useRef } from "react";
import { apiService, type PendingInvite } from "../services/api";
import { InviteCard } from "./InviteCard";
import "./InvitesDropdown.css";

interface InvitesDropdownProps {
  onInviteAccepted: () => void;
}

export function InvitesDropdown({ onInviteAccepted }: InvitesDropdownProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPendingInvites();
      setInvites(data);
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleInviteResponse = async (
    billId: number,
    status: "accepted" | "rejected"
  ) => {
    setResponding(billId);
    try {
      await apiService.respondToInvite(billId, status);
      setInvites((prevInvites) =>
        prevInvites.filter((invite) => invite.bill_id !== billId)
      );
      if (status === "accepted") {
        onInviteAccepted();
      }
    } catch (err) {
      console.error("Erro ao responder ao convite:", err);
    } finally {
      setResponding(null);
    }
  };

  const pendingCount = invites.length;

  return (
    <div className="invites-dropdown">
      <button
        ref={buttonRef}
        className="invites-button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadInvites();
          }
        }}
        aria-label="Convites pendentes"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {pendingCount > 0 && (
          <span className="invites-badge">{pendingCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="invites-dropdown-content" ref={dropdownRef}>
          <div className="invites-dropdown-header">
            <h3>Convites Pendentes</h3>
            <button
              className="close-dropdown"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          <div className="invites-dropdown-body">
            {loading ? (
              <div className="invites-loading">Carregando convites...</div>
            ) : invites.length === 0 ? (
              <div className="invites-empty">
                <p>Nenhum convite pendente</p>
              </div>
            ) : (
              <div className="invites-list">
                {invites.map((invite) => (
                  <InviteCard
                    key={invite.bill_id}
                    invite={invite}
                    onAccept={(billId) =>
                      handleInviteResponse(billId, "accepted")
                    }
                    onReject={(billId) =>
                      handleInviteResponse(billId, "rejected")
                    }
                    loading={responding === invite.bill_id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

