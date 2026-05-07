import { useNavigate } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

function getQueueStatus(project) {
  return project.status === 'wip' || project.proposalStatus === 'wip'
    ? 'WIP'
    : 'New Submission';
}

export default function SubmissionReviewPage() {
  const navigate = useNavigate();
  const { submittedProjects } = usePpmProjects();

  return (
    <AppFrame
      title="Submission Review"
      description="Portfolio manager queue for reviewing submitted project proposals."
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="review" />Review Queue</h2>
          <div className="muted">{submittedProjects.length} proposal(s) waiting review</div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Proposal ID</th>
                <th>Project Title</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Executive Sponsor</th>
                <th>Business Owner</th>
                <th>Estimated Cost</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submittedProjects.map((project) => (
                <tr key={project.id}>
                  <td>{project.proposalId || project.id}</td>
                  <td>{project.name}</td>
                  <td>
                    <span className={`pill ${getQueueStatus(project) === 'WIP' ? 'unknown' : 'medium'}`}>
                      {getQueueStatus(project)}
                    </span>
                  </td>
                  <td>{project.submittedAt}</td>
                  <td>{project.executiveSponsor || '-'}</td>
                  <td>{project.businessOwner || '-'}</td>
                  <td>{project.estimatedCost || '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => navigate(`/ppm/review/${project.id}`)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {submittedProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">No submitted proposals are waiting for review.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}
