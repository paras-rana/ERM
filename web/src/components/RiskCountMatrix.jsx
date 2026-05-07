import React from 'react';

function getBand(score) {
  if (score <= 6) return 'low';
  if (score >= 15) return 'high';
  return 'medium';
}

function getCellKey(severity, probability) {
  return `${severity}-${probability}`;
}

export default function RiskCountMatrix({
  title,
  subtitle,
  counts,
  selectedCell, // optional backward compatibility
  selectedCells, // preferred for multi-select
  onSelectCell,
}) {
  // Matrix coordinates are fixed to 5x5.
  const severities = [5, 4, 3, 2, 1];
  const probabilities = [1, 2, 3, 4, 5];

  // Build a Set so selection checks are O(1) while rendering all cells.
  const selectedKeySet = React.useMemo(() => {
    const set = new Set();

    if (Array.isArray(selectedCells) && selectedCells.length > 0) {
      for (const cell of selectedCells) {
        if (
          cell &&
          typeof cell.severity === 'number' &&
          typeof cell.probability === 'number'
        ) {
          set.add(getCellKey(cell.severity, cell.probability));
        }
      }
      return set;
    }

    // fallback to old single-select prop
    if (selectedCell) {
      set.add(getCellKey(selectedCell.severity, selectedCell.probability));
    }

    return set;
  }, [selectedCell, selectedCells]);

  const isSelected = (s, p) => selectedKeySet.has(getCellKey(s, p));

  return (
    <div className="matrix-card">
      <div className="matrix-title">{title}</div>
      {subtitle ? <div className="matrix-subtitle">{subtitle}</div> : null}

      <div className="matrix-grid">
        <div className="matrix-corner"></div>

        {probabilities.map((p) => (
          <div key={`p-${p}`} className="matrix-axis-label top">
            P{p}
          </div>
        ))}

        {severities.map((s) => (
          <React.Fragment key={`row-${s}`}>
            <div className="matrix-axis-label side">S{s}</div>

            {probabilities.map((p) => {
              const score = s * p;
              const band = getBand(score);
              const count = counts?.[`${s}-${p}`] ?? 0;
              const active = isSelected(s, p);

              return (
                <button
                  type="button"
                  key={`${s}-${p}`}
                  className={`matrix-cell matrix-count-cell ${band} ${active ? 'active' : ''}`}
                  title={`Severity ${s}, Probability ${p}, Score ${score}, Count ${count}`}
                  onClick={() => onSelectCell?.({ severity: s, probability: p })}
                >
                  <span className="matrix-score">{score}</span>
                  <span className="matrix-count">{count}</span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
