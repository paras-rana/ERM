import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

function createDraftPriority(priority = null) {
  return {
    id: priority?.id ?? `draft-priority-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: priority?.title ?? '',
    description: priority?.description ?? '',
  };
}

function createPeriodForm(activeStrategicPriorityPeriod) {
  const currentYear = new Date().getFullYear();
  const baseStartYear = Number(activeStrategicPriorityPeriod?.startYear) || currentYear;
  const baseEndYear = Number(activeStrategicPriorityPeriod?.endYear) || (currentYear + 4);

  return {
    approvedOn: new Date().toISOString().slice(0, 10),
    startYear: String(Math.max(baseStartYear, currentYear)),
    endYear: String(Math.max(baseEndYear, currentYear + 4)),
  };
}

export default function CreateStrategicPriorityPeriodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeStrategicPriorityPeriod, addStrategicPriorityPeriod } = usePpmProjects();
  const [periodForm, setPeriodForm] = useState(() => createPeriodForm(activeStrategicPriorityPeriod));
  const [draftPriorities, setDraftPriorities] = useState(() => (
    activeStrategicPriorityPeriod?.priorities?.length
      ? activeStrategicPriorityPeriod.priorities.map((priority) => createDraftPriority(priority))
      : [createDraftPriority()]
  ));

  if (!location.state?.fromStrategicPriorities) {
    return <Navigate to="/ppm/strategic-priorities" replace />;
  }

  function onPeriodChange(event) {
    const { name, value } = event.target;
    setPeriodForm((current) => ({ ...current, [name]: value }));
  }

  function updateDraftPriority(priorityId, field, value) {
    setDraftPriorities((current) => current.map((priority) => (
      priority.id === priorityId ? { ...priority, [field]: value } : priority
    )));
  }

  function addDraftPriority() {
    setDraftPriorities((current) => [...current, createDraftPriority()]);
  }

  function removeDraftPriority(priorityId) {
    setDraftPriorities((current) => (
      current.length > 1 ? current.filter((priority) => priority.id !== priorityId) : current
    ));
  }

  function onCreatePeriod(event) {
    event.preventDefault();

    const nextStartYear = Number(periodForm.startYear);
    const nextEndYear = Number(periodForm.endYear);
    if (!Number.isFinite(nextStartYear) || !Number.isFinite(nextEndYear) || nextEndYear < nextStartYear) {
      return;
    }

    addStrategicPriorityPeriod({
      approvedOn: periodForm.approvedOn,
      startYear: nextStartYear,
      endYear: nextEndYear,
      priorities: draftPriorities
        .map((priority) => ({
          title: priority.title.trim(),
          description: priority.description.trim(),
        }))
        .filter((priority) => priority.title),
    });

    navigate('/ppm/strategic-priorities', { replace: true });
  }

  const canCreatePeriod = draftPriorities.every(
    (priority) => priority.title.trim(),
  ) && Number(periodForm.endYear) >= Number(periodForm.startYear);

  return (
    <AppFrame
      title="Create Priority Period"
      description="Create a new active strategic priority period with the full set of priorities that should apply for project alignment."
      topNavActions={(
        <Link className="secondary-btn" to="/ppm/strategic-priorities">
          Back To Strategic Priorities
        </Link>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="assessment" />New Priority Period</h2>
          <div className="muted">
            Creating a new period archives the current active period. Include all priorities that should apply in the new period.
          </div>
        </div>

        <form className="risk-form ppm-form" onSubmit={onCreatePeriod}>
          <div className="inline-form-grid">
            <label>
              <span className="field-label">Approved On <span className="required-marker" aria-hidden="true">*</span></span>
              <input
                type="date"
                name="approvedOn"
                value={periodForm.approvedOn}
                onChange={onPeriodChange}
                required
              />
            </label>

            <label>
              <span className="field-label">Start Year <span className="required-marker" aria-hidden="true">*</span></span>
              <input
                type="number"
                min="2000"
                name="startYear"
                value={periodForm.startYear}
                onChange={onPeriodChange}
                required
              />
            </label>

            <label>
              <span className="field-label">End Year <span className="required-marker" aria-hidden="true">*</span></span>
              <input
                type="number"
                min={periodForm.startYear || '2000'}
                name="endYear"
                value={periodForm.endYear}
                onChange={onPeriodChange}
                required
              />
            </label>
          </div>

          <div className="panel-header-row">
            <h3>Priorities For The New Period</h3>
            <button type="button" className="secondary-btn" onClick={addDraftPriority}>
              Add Priority
            </button>
          </div>

          <div className="ppm-card-list">
            {draftPriorities.map((priority, index) => (
              <article key={priority.id} className="detail-block ppm-project-card">
                <div className="panel-header-row">
                  <div className="label">Priority {index + 1}</div>
                  {draftPriorities.length > 1 ? (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => removeDraftPriority(priority.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="inline-form-grid">
                  <label>
                    <span className="field-label">Priority Title <span className="required-marker" aria-hidden="true">*</span></span>
                    <input
                      value={priority.title}
                      onChange={(event) => updateDraftPriority(priority.id, 'title', event.target.value)}
                      required
                    />
                  </label>

                  <label className="full-width">
                    Description
                    <textarea
                      rows={4}
                      value={priority.description}
                      onChange={(event) => updateDraftPriority(priority.id, 'description', event.target.value)}
                      placeholder="Describe the intent, expected outcomes, and how project proposals should align."
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>

          <div className="drawer-actions ppm-form-actions">
            <button type="submit" className="primary-btn" disabled={!canCreatePeriod}>
              Create Active Period
            </button>
          </div>
        </form>
      </section>
    </AppFrame>
  );
}
