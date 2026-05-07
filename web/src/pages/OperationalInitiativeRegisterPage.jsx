import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

export default function OperationalInitiativeRegisterPage() {
  const { operationalInitiatives } = usePpmProjects();
  const [expandedYears, setExpandedYears] = useState(() => new Set());

  const years = useMemo(() => {
    const grouped = operationalInitiatives.reduce((map, initiative) => {
      const year = Number(initiative.year) || new Date().getFullYear();
      const current = map.get(year) ?? [];
      current.push(initiative);
      map.set(year, current);
      return map;
    }, new Map());

    return [...grouped.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([year, initiatives]) => ({ year, initiatives }));
  }, [operationalInitiatives]);

  function toggleYear(year) {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }

  return (
    <AppFrame
      title="Initiative Register"
      description="Review annual operational initiatives across current and historical years."
      detailLabel="Initiative Register"
      topNavActions={(
        <Link className="secondary-btn" to="/ppm/operational-initiatives">
          Back To Annual Operational Initiatives
        </Link>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="portfolio" />Initiative Register</h2>
          <div className="muted">{years.length} year set(s)</div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Number of Initiatives</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {years.map(({ year, initiatives }) => {
                const isExpanded = expandedYears.has(year);
                return (
                  <HistoricalYearRows
                    key={year}
                    year={year}
                    initiatives={initiatives}
                    isExpanded={isExpanded}
                    onToggle={() => toggleYear(year)}
                  />
                );
              })}
              {years.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">No annual operational initiative history is available.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}

function HistoricalYearRows({ year, initiatives, isExpanded, onToggle }) {
  const groups = initiatives.reduce((map, initiative) => {
    const key = initiative.strategicPriorityTitle || 'Unassigned Strategic Priority';
    const current = map.get(key) ?? [];
    current.push(initiative);
    map.set(key, current);
    return map;
  }, new Map());

  return (
    <>
      <tr className={isExpanded ? 'row-selected' : ''}>
        <td>{year}</td>
        <td>{initiatives.length}</td>
        <td>
          <button type="button" className="secondary-btn" onClick={onToggle}>
            <Icon name={isExpanded ? 'arrowUp' : 'arrowDown'} />
            {isExpanded ? 'Hide Initiatives' : 'Show Initiatives'}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="ppm-period-register-expanded-row">
          <td colSpan={3}>
            <div className="ppm-period-register-subtable-wrap">
              <table className="simple-table ppm-period-register-subtable">
                <thead>
                  <tr>
                    <th>Strategic Priority</th>
                    <th>Initiative</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[...groups.entries()].flatMap(([priorityTitle, priorityInitiatives]) => (
                    priorityInitiatives.map((initiative, index) => (
                      <tr key={initiative.id} className={index === 0 ? 'ppm-priority-group-start' : ''}>
                        {index === 0 ? (
                          <td rowSpan={priorityInitiatives.length} className="ppm-priority-group-cell">
                            {priorityTitle}
                          </td>
                        ) : null}
                        <td>
                          <Link className="table-link" to={`/ppm/operational-initiatives/${initiative.id}`}>
                            {initiative.title}
                          </Link>
                        </td>
                        <td>{initiative.description || '-'}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
