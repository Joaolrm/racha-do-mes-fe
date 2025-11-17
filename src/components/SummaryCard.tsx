import "./SummaryCard.css";

interface SummaryCardProps {
  label: string;
  value: string | number;
  variant?: "default" | "paid" | "unpaid";
}

export function SummaryCard({
  label,
  value,
  variant = "default",
}: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className={`summary-value ${variant}`}>{value}</div>
    </div>
  );
}
