import { Link } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

export default function AnnualOperationalInitiativesPage() {
  const { operationalInitiatives, activeStrategicPriorityPeriod } = usePpmProjects();
  const currentYear = Math.max(
    ...operationalInitiatives
      .filter((initiative) => initiative.strategicPriorityPeriodId === activeStrategicPriorityPeriod?.id)
      .map((initiative) => Number(initiative.year) || 0),
    new Date().getFullYear(),
  );
  const currentInitiatives = operationalInitiatives.filter(
    (initiative) => (
      initiative.strategicPriorityPeriodId === activeStrategicPriorityPeriod?.id
      && Number(initiative.year) === currentYear
    ),
  );
  const initiativesByPriority = currentInitiatives.reduce((groups, initiative) => {
    const key = initiative.strategicPriorityTitle || 'Unassigned Strategic Priority';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(initiative);
    return groups;
  }, {});
  const priorityGroups = Object.entries(initiativesByPriority);

  return (
    <AppFrame
      title="Annual Operational Initiatives"
      description="Manage the annual operational initiatives that connect delivery work to strategic priorities."
      topNavActions={(
        <>
          <Link className="secondary-btn" to="/ppm/operational-initiatives/register">
            <Icon name="register" />
            View Initiative Register
          </Link>
          <Link
            className="primary-btn"
            to="/ppm/operational-initiatives/new"
            state={{ fromOperationalInitiatives: true }}
          >
            <Icon name="plus" />
            Add Annual Operational Initiative
          </Link>
        </>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="portfolio" />Current Initiatives</h2>
          <div className="muted">
            {currentYear} | {activeStrategicPriorityPeriod?.label || 'No active period'} | {currentInitiatives.length} initiative(s)
          </div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Strategic Priority</th>
                <th>Initiative</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {priorityGroups.flatMap(([priorityTitle, initiatives]) => (
                initiatives.map((initiative, index) => (
                  <tr key={initiative.id} className={index === 0 ? 'ppm-priority-group-start' : ''}>
                    {index === 0 ? (
                      <td rowSpan={initiatives.length} className="ppm-priority-group-cell">
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
              {priorityGroups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">No annual operational initiatives are defined for the current year.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}
