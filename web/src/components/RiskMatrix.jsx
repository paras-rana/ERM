import React from 'react';

function getBand(score) {
  if (score <= 6) return 'low';
  if (score >= 15) return 'high';
  return 'medium';
}

export default function RiskMatrix({ title, severity, probability, subtitle }) {
  // Matrix coordinates are fixed to 5x5.
  const severities = [5, 4, 3, 2, 1]; // top to bottom
  const probabilities = [1, 2, 3, 4, 5]; // left to right

  const selectedSeverity = Number(severity);
  const selectedProbability = Number(probability);

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
              const isActive = s === selectedSeverity && p === selectedProbability;

              return (
                <div
                  key={`${s}-${p}`}
                  className={`matrix-cell ${band} ${isActive ? 'active' : ''}`}
                  title={`Severity ${s}, Probability ${p}, Score ${score}`}
                >
                  <span className="matrix-score">{score}</span>
                  {isActive ? <span className="matrix-dot">&bull;</span> : null}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
