import "./MonthSelector.css";

interface MonthSelectorProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

export function MonthSelector({
  month,
  year,
  onMonthChange,
}: MonthSelectorProps) {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const handlePreviousMonth = () => {
    let newMonth = month - 1;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    onMonthChange(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    onMonthChange(newMonth, newYear);
  };

  return (
    <div className="month-selector">
      <button
        className="month-nav-button"
        onClick={handlePreviousMonth}
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <div className="month-display">
        <span className="month-name">{months[month - 1]}</span>
        <span className="year-name">{year}</span>
      </div>
      <button
        className="month-nav-button"
        onClick={handleNextMonth}
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
