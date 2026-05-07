import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

function formatPeriodYears(period) {
  return `${period.startYear} - ${period.endYear}`;
}

export default function StrategicPriorityPeriodRegisterPage() {
  const { strategicPriorityPeriods } = usePpmProjects();
  const [expandedPeriodIds, setExpandedPeriodIds] = useState(() => new Set());

  const periods = useMemo(
    () => [...strategicPriorityPeriods].sort((left, right) => right.startYear - left.startYear),
    [strategicPriorityPeriods],
  );

  function togglePeriod(periodId) {
    setExpandedPeriodIds((current) => {
      const next = new Set(current);
      if (next.has(periodId)) {
        next.delete(periodId);
      } else {
        next.add(periodId);
      }
      return next;
    });
  }

  return (
    <AppFrame
      title="Period Register"
      description="Review the full register of strategic priority periods and inspect the priorities defined within each period."
      detailLabel="Period Register"
      topNavActions={(
        <Link className="secondary-btn" to="/ppm/strategic-priorities">
          Back To Strategic Priorities
        </Link>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="portfolio" />Period Register</h2>
          <div className="muted">{periods.length} period set(s)</div>
        </div>

        <div className="table-wrap ppm-period-register-table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Applicable Years</th>
                <th>Number of Priorities</th>
                <th>Approved Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const isExpanded = expandedPeriodIds.has(period.id);

                return (
                  <FragmentLike
                    key={period.id}
                    period={period}
                    isExpanded={isExpanded}
                    onToggle={() => togglePeriod(period.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}

function FragmentLike({ period, isExpanded, onToggle }) {
  return (
    <>
      <tr className={isExpanded ? 'row-selected' : ''}>
        <td>{period.label}</td>
        <td>{formatPeriodYears(period)}</td>
        <td>{period.priorities.length}</td>
        <td>{period.approvedOn}</td>
        <td>
          <button type="button" className="secondary-btn" onClick={onToggle}>
            <Icon name={isExpanded ? 'arrowUp' : 'arrowDown'} />
            {isExpanded ? 'Hide Priorities' : 'Show Priorities'}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="ppm-period-register-expanded-row">
          <td colSpan={5}>
            <div className="ppm-period-register-subtable-wrap">
              <table className="simple-table ppm-period-register-subtable">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {period.priorities.length ? (
                    period.priorities.map((priority) => (
                      <tr key={priority.id}>
                        <td>{priority.title}</td>
                        <td>{priority.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="muted">No priorities have been defined for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
