import { useState } from 'react';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';
import { CURRENT_PROJECT_CLASSIFICATION_OPTIONS } from '../ppm/ppmConfig';

function getFutureTone(status) {
  if (status === 'planned') return 'medium';
  if (status === 'hold') return 'unknown';
  return 'low';
}

export default function FutureProjectsPage() {
  const { futureProjects, archivedProposals, updateFutureStatus } = usePpmProjects();
  const [notes, setNotes] = useState({});
  const [currentClassifications, setCurrentClassifications] = useState({});

  function getNotes(projectId) {
    return notes[projectId] ?? '';
  }

  function setProjectNotes(projectId, value) {
    setNotes((current) => ({ ...current, [projectId]: value }));
  }

  function getCurrentClassification(project) {
    return currentClassifications[project.id] ?? project.currentProjectClassification ?? '';
  }

  function setCurrentClassification(projectId, value) {
    setCurrentClassifications((current) => ({ ...current, [projectId]: value }));
  }

  return (
    <AppFrame
      title="Future Projects"
      description="Projects parked in the future pipeline plus archived proposals."
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="portfolio" />Future Pipeline</h2>
          <div className="muted">{futureProjects.length} future project(s)</div>
        </div>

        <div className="ppm-card-list">
          {futureProjects.map((project) => (
            <article key={project.id} className="detail-block ppm-project-card">
              <div className="panel-header-row">
                <div>
                  <div className="label">{project.id}</div>
                  <h3>{project.name}</h3>
                </div>
                <span className={`pill ${getFutureTone(project.status)}`}>
                  {project.status === 'planned' ? 'planned' : 'on hold'}
                </span>
              </div>

              <p className="muted">
                {project.executiveSponsor} | {project.businessOwner} | {project.targetStartQuarter} | {project.estimatedCost}
              </p>
              <p className="muted">
                {project.category} | {project.operationalInitiativeTitle || 'No annual operational initiative selected'}
              </p>
              <p className="risk-description">{project.summary}</p>

              <label className="filter-item">
                Review Notes
                <textarea
                  rows={3}
                  value={getNotes(project.id) || project.reviewNotes}
                  onChange={(event) => setProjectNotes(project.id, event.target.value)}
                />
              </label>

              <label className="filter-item">
                Current Project Classification
                <select
                  value={getCurrentClassification(project)}
                  onChange={(event) => setCurrentClassification(project.id, event.target.value)}
                >
                  <option value="">Select classification</option>
                  {CURRENT_PROJECT_CLASSIFICATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <div className="detail-actions-row">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => updateFutureStatus(
                    project.id,
                    'approved',
                    getNotes(project.id),
                    getCurrentClassification(project),
                  )}
                  disabled={!getCurrentClassification(project)}
                >
                  Approve to Current
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => updateFutureStatus(project.id, 'hold', getNotes(project.id))}
                >
                  Put On Hold
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => updateFutureStatus(project.id, 'denied', getNotes(project.id))}
                >
                  Deny
                </button>
              </div>
            </article>
          ))}
          {futureProjects.length === 0 ? (
            <p className="muted">No projects are waiting in the future pipeline.</p>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="review" />Proposal Archive</h2>
          <div className="muted">{archivedProposals.length} archived proposal(s)</div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Name</th>
                <th>Executive Sponsor</th>
                <th>Target Quarter for Start</th>
                <th>Estimated Cost</th>
                <th>Category</th>
                <th>Review Notes</th>
              </tr>
            </thead>
            <tbody>
              {archivedProposals.map((project) => (
                <tr key={project.id}>
                  <td>{project.proposalId || project.id}</td>
                  <td>{project.name}</td>
                  <td>{project.executiveSponsor}</td>
                  <td>{project.targetStartQuarter}</td>
                  <td>{project.estimatedCost}</td>
                  <td>{project.category}</td>
                  <td>{project.reviewNotes || '-'}</td>
                </tr>
              ))}
              {archivedProposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">No archived proposals yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}
