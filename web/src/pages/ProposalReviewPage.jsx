import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';
import { CURRENT_PROJECT_CLASSIFICATION_OPTIONS } from '../ppm/ppmConfig';

function ProjectList({ items, emptyLabel }) {
  if (!items?.length) {
    return <div className="muted">{emptyLabel}</div>;
  }

  return (
    <ul className="ppm-inline-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function downloadProjectDocument(fileName) {
  const blob = new Blob([`Placeholder download for ${fileName}`], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function AttachmentTable({ attachments }) {
  return (
    <div className="table-wrap">
      <table className="simple-table">
        <thead>
          <tr>
            <th>Attachment Type</th>
            <th>File Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {attachments.length ? attachments.map((attachment) => (
            <tr key={`${attachment.type}-${attachment.fileName}`}>
              <td>{attachment.type}</td>
              <td>{attachment.fileName}</td>
              <td>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => downloadProjectDocument(attachment.fileName)}
                >
                  Download
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={3} className="muted">No attachments available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function parseMilestoneMonth(value) {
  if (!value) return null;

  const normalized = String(value).trim();
  const monthMatch = normalized.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (monthMatch) {
    return new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
  }

  const quarterMatch = normalized.match(/^Q([1-4])\s+(\d{4})$/i);
  if (quarterMatch) {
    return new Date(Number(quarterMatch[2]), (Number(quarterMatch[1]) - 1) * 3, 1);
  }

  return null;
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

function formatMilestoneDate(date, fallbackValue) {
  if (!date) return fallbackValue || '';
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function buildMonthRange(startDate, endDate) {
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= last) {
    months.push(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function SimpleMilestoneTimeline({ milestones }) {
  return (
    <div className="ppm-timeline" aria-label="Project milestones timeline">
      {milestones.map((milestone, index) => (
        <div key={milestone.id ?? `${milestone.name}-${index}`} className="ppm-timeline-step">
          <div className="ppm-timeline-node" />
          <div className="ppm-timeline-label">{milestone.month || milestone.quarter}</div>
          <div className="ppm-timeline-title">{milestone.name}</div>
        </div>
      ))}
    </div>
  );
}

function MilestoneTimeline({ milestones }) {
  if (!milestones?.length) {
    return <div className="muted">No milestones entered yet.</div>;
  }

  const parsedMilestones = milestones
    .map((milestone, index) => ({
      ...milestone,
      date: parseMilestoneMonth(milestone.month || milestone.quarter),
      order: index,
    }))
    .filter((milestone) => milestone.date);

  if (parsedMilestones.length !== milestones.length) {
    return <SimpleMilestoneTimeline milestones={milestones} />;
  }

  const sortedMilestones = [...parsedMilestones].sort((left, right) => left.date - right.date);
  const months = buildMonthRange(
    sortedMilestones[0].date,
    sortedMilestones[sortedMilestones.length - 1].date,
  );
  const monthIndexByKey = new Map(months.map((month, index) => [formatMonthKey(month), index]));

  return (
    <div className="ppm-month-timeline" aria-label="Project milestones timeline">
      <div className="ppm-month-timeline-track">
        <div
          className="ppm-month-timeline-months"
          style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
        >
          {months.map((month) => (
            <div key={formatMonthKey(month)} className="ppm-month-timeline-month">
              {formatMonthLabel(month)}
            </div>
          ))}
        </div>
      </div>

      <div className="ppm-month-timeline-events">
        {sortedMilestones.map((milestone, index) => {
          const monthIndex = monthIndexByKey.get(formatMonthKey(milestone.date)) ?? 0;
          const left = `${((monthIndex + 0.5) / months.length) * 100}%`;

          return (
            <div
              key={milestone.id ?? `${milestone.name}-${index}`}
              className={`ppm-month-event ${index % 2 === 0 ? 'is-top' : 'is-bottom'}`}
              style={{ left }}
            >
              <div className="ppm-month-event-card">
                <div className="ppm-month-event-date">
                  {formatMilestoneDate(milestone.date, milestone.month || milestone.quarter)}
                </div>
                <div className="ppm-month-event-title">{milestone.name}</div>
              </div>
              <div className="ppm-month-event-marker" />
              <div className="ppm-month-event-line" />
              <div className="ppm-month-event-node" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getProposalStatusLabel(project) {
  if (project.status === 'wip' || project.proposalStatus === 'wip') return 'WIP';
  return 'New Submission';
}

export default function ProposalReviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { getProjectById, reviewProjectProposal } = usePpmProjects();
  const project = getProjectById(projectId);
  const [reviewNotes, setReviewNotes] = useState(project?.reviewNotes ?? '');
  const [classification, setClassification] = useState(project?.currentProjectClassification ?? '');
  const attachments = [
    ...(project?.scopeStatementFiles ?? []).map((fileName) => ({
      type: 'Scope Statement Document',
      fileName,
    })),
    ...(project?.costEstimateBreakdownFiles ?? []).map((fileName) => ({
      type: 'Cost Breakdown File',
      fileName,
    })),
  ];

  if (!project || project.stage !== 'submitted') {
    return <Navigate to="/ppm/review" replace />;
  }

  function handleDecision(decision) {
    reviewProjectProposal(project.id, decision, reviewNotes, classification);

    if (decision === 'needs_more_detail') {
      navigate('/ppm/review', { replace: true });
      return;
    }

    if (decision === 'approve') {
      navigate('/ppm/current', { replace: true });
      return;
    }

    if (decision === 'hold') {
      navigate('/ppm/future', { replace: true });
      return;
    }

    navigate('/ppm/future', { replace: true });
  }

  return (
    <AppFrame
      title="Proposal Review"
      description="Review proposal details and make a portfolio intake decision."
    >
      <section className="panel">
        <div className="panel-header-row">
          <div>
            <h2><Icon name="review" />{project.name}</h2>
            <div className="muted">
              Proposal ID {project.proposalId || project.id} | Submitted {project.submittedAt}
            </div>
          </div>
          <span className={`pill ${project.status === 'wip' ? 'unknown' : 'medium'}`}>
            {getProposalStatusLabel(project)}
          </span>
        </div>

        <section className="detail-block detail-section-banded band-purple ppm-form-section">
          <div className="panel-header-row">
            <div>
              <h3>Project Summary</h3>
            </div>
          </div>

          <div className="ppm-review-grid">
            <div className="detail-block">
              <div className="label">Project Title</div>
              <div>{project.name || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Project Purpose</div>
              <p className="risk-description">{project.summary || project.projectPurpose || '-'}</p>
            </div>
            <div className="detail-block">
              <div className="label">Scope Statement</div>
              <div>{project.scopeStatement || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Expected Outcomes / Benefits</div>
              <ProjectList items={project.expectedOutcomes} emptyLabel="No expected outcomes listed." />
            </div>
          </div>
        </section>

        <section className="detail-block detail-section-banded band-orange ppm-form-section">
          <div className="panel-header-row">
            <div>
              <h3>Resources</h3>
            </div>
          </div>

          <div className="ppm-review-grid">
            <div className="detail-block">
              <div className="label">Executive Sponsor</div>
              <div>{project.executiveSponsor || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Business Owner</div>
              <div>{project.businessOwner || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Team Members</div>
              <ProjectList items={project.teamMembers} emptyLabel="No team members listed." />
            </div>
            <div className="detail-block">
              <div className="label">Estimated Cost</div>
              <div>{project.estimatedCost || '-'}</div>
            </div>
          </div>
        </section>

        <section className="detail-block detail-section-banded band-red ppm-form-section">
          <div className="panel-header-row">
            <div>
              <h3>Attachements</h3>
            </div>
          </div>

          <AttachmentTable attachments={attachments} />
        </section>

        <section className="detail-block detail-section-banded band-green ppm-form-section">
          <div className="panel-header-row">
            <div>
              <h3>Schedule, Assumptions and Risks</h3>
            </div>
          </div>

          <div className="ppm-review-grid">
            <div className="detail-block">
              <div className="label">Expected Start</div>
              <div>{project.expectedStartMonth || project.targetStartQuarter || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Duration in Months</div>
              <div>{project.durationMonths || '-'}</div>
            </div>
          </div>

          <div className="detail-block">
            <div className="label">Milestone Timeline</div>
            <MilestoneTimeline milestones={project.milestones} />
          </div>

          <div className="detail-block">
            <div className="label">Potential Risks</div>
            <ProjectList items={project.potentialRisks} emptyLabel="No potential risks listed." />
          </div>

          <div className="detail-block">
            <div className="label">Assumptions</div>
            <ProjectList items={project.assumptions} emptyLabel="No assumptions listed." />
          </div>
        </section>

        <section className="detail-block detail-section-banded band-blue ppm-form-section">
          <div className="panel-header-row">
            <div>
              <h3>Alignment and Decision</h3>
            </div>
          </div>

          <div className="ppm-review-grid">
            <div className="detail-block">
              <div className="label">Category</div>
              <div>{project.category || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Annual Operational Initiative</div>
              <div>{project.operationalInitiativeTitle || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="label">Strategic Priority</div>
              <div>{project.strategicPriorityTitle || project.strategicAlignment || '-'}</div>
            </div>
          </div>

          <label className="filter-item">
            Portfolio Manager Notes
            <textarea
              rows={4}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              placeholder="Capture the rationale, follow-ups, or missing information."
            />
          </label>

          <label className="filter-item">
            Approval Destination
            <select value={classification} onChange={(event) => setClassification(event.target.value)}>
              <option value="">Select destination</option>
              {CURRENT_PROJECT_CLASSIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <div className="detail-actions-row">
            <button
              type="button"
              className="primary-btn"
              onClick={() => handleDecision('approve')}
              disabled={!classification}
            >
              Approve
            </button>
            <button type="button" className="secondary-btn" onClick={() => handleDecision('deny')}>
              Deny
            </button>
            <button type="button" className="secondary-btn" onClick={() => handleDecision('hold')}>
              Hold
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => handleDecision('needs_more_detail')}
            >
              Needs More Detail
            </button>
          </div>
        </section>
      </section>
    </AppFrame>
  );
}
