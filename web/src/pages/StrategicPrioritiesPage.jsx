import { Link } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

function formatPeriodYears(period) {
  return `${period.startYear} - ${period.endYear}`;
}

export default function StrategicPrioritiesPage() {
  const { activeStrategicPriorityPeriod } = usePpmProjects();
  const selectedPeriod = activeStrategicPriorityPeriod ?? null;

  return (
    <AppFrame
      title="Strategic Priorities"
      description="Review the current strategic priority period and archived periods used for project alignment."
      topNavActions={(
        <>
          <Link className="secondary-btn" to="/ppm/operational-initiatives">
            <Icon name="portfolio" />
            Annual Operational Initiatives
          </Link>
          <Link className="secondary-btn" to="/ppm/strategic-priorities/register">
            <Icon name="register" />
            View Period Register
          </Link>
          <Link
            className="primary-btn"
            to="/ppm/strategic-priorities/new"
            state={{ fromStrategicPriorities: true }}
          >
            <Icon name="plus" />
            Create New Priority Period
          </Link>
        </>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="review" />Period Detail</h2>
          <div className="muted">
            {selectedPeriod
              ? `${selectedPeriod.label} is ${selectedPeriod.status === 'active' ? 'currently used' : 'available as history'}`
              : 'No period selected'}
          </div>
        </div>

        {selectedPeriod ? (
          <div className="ppm-period-detail-grid">
            <article className="detail-block">
              <div className="label">Period</div>
              <div>{selectedPeriod.label}</div>
            </article>
            <article className="detail-block">
              <div className="label">Approved On</div>
              <div>{selectedPeriod.approvedOn}</div>
            </article>
            <article className="detail-block">
              <div className="label">Applicable Years</div>
              <div>{formatPeriodYears(selectedPeriod)}</div>
            </article>
          </div>
        ) : (
          <p className="muted">No priority period is available.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="assessment" />Priorities</h2>
          <div className="muted">
            {selectedPeriod ? `${selectedPeriod.priorities.length} priority item(s)` : 'No period selected'}
          </div>
        </div>

        {selectedPeriod?.priorities.length ? (
          <div className="table-wrap">
            <table className="simple-table strategic-priorities-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {selectedPeriod.priorities.map((priority) => (
                  <tr key={priority.id}>
                    <td>{priority.id}</td>
                    <td>{priority.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No priorities have been defined for this period yet.</p>
        )}
      </section>
    </AppFrame>
  );
}
