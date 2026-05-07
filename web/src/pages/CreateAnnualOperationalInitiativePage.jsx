import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

function createInitialForm(activePeriod) {
  return {
    title: '',
    year: String(activePeriod?.startYear ?? new Date().getFullYear()),
    strategicPriorityId: '',
    description: '',
  };
}

function buildInitiativeYearOptions(activePeriod) {
  const currentYear = new Date().getFullYear();
  const startYear = Number(activePeriod?.startYear) || currentYear;
  const endYear = Number(activePeriod?.endYear) || startYear;
  const normalizedEndYear = endYear >= startYear ? endYear : startYear;

  return Array.from(
    { length: normalizedEndYear - startYear + 1 },
    (_, index) => String(startYear + index),
  );
}

export default function CreateAnnualOperationalInitiativePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeStrategicPriorityPeriod,
    strategicPriorities,
    addOperationalInitiative,
  } = usePpmProjects();
  const [form, setForm] = useState(() => createInitialForm(activeStrategicPriorityPeriod));
  const initiativeYearOptions = buildInitiativeYearOptions(activeStrategicPriorityPeriod);

  if (!location.state?.fromOperationalInitiatives) {
    return <Navigate to="/ppm/operational-initiatives" replace />;
  }

  function onChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onSubmit(event) {
    event.preventDefault();
    const strategicPriority = strategicPriorities.find((priority) => priority.id === form.strategicPriorityId);
    addOperationalInitiative({
      title: form.title.trim(),
      year: Number(form.year),
      strategicPriorityId: strategicPriority?.id ?? '',
      strategicPriorityTitle: strategicPriority?.title ?? '',
      strategicPriorityPeriodId: activeStrategicPriorityPeriod?.id ?? '',
      strategicPriorityPeriodLabel: activeStrategicPriorityPeriod?.label ?? '',
      description: form.description.trim(),
    });
    navigate('/ppm/operational-initiatives', { replace: true });
  }

  return (
    <AppFrame
      title="New Operational Initiative"
      description="Create an annual operational initiative by selecting the strategic priority it should roll up to."
      topNavActions={(
        <Link className="secondary-btn" to="/ppm/operational-initiatives">
          Back To Annual Operational Initiatives
        </Link>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="plus" />Initiative Details</h2>
          <div className="muted">
            Annual operational initiatives sit between strategic priorities and project delivery work.
          </div>
        </div>

        <form className="risk-form ppm-form" onSubmit={onSubmit}>
          <div className="inline-form-grid">
            <label className="full-width">
              <span className="field-label">Initiative Title <span className="required-marker" aria-hidden="true">*</span></span>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Example: FY2027 Access Throughput Plan"
                required
              />
            </label>

            <label>
              <span className="field-label">Initiative Year <span className="required-marker" aria-hidden="true">*</span></span>
              <select
                name="year"
                value={form.year}
                onChange={onChange}
                required
              >
                {initiativeYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">Strategic Priority <span className="required-marker" aria-hidden="true">*</span></span>
              <select
                name="strategicPriorityId"
                value={form.strategicPriorityId}
                onChange={onChange}
                required
                disabled={!strategicPriorities.length}
              >
                <option value="" disabled>Select a strategic priority</option>
                {strategicPriorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>{priority.title}</option>
                ))}
              </select>
            </label>

            <label className="full-width">
              <span className="field-label">Description <span className="required-marker" aria-hidden="true">*</span></span>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={onChange}
                placeholder="Describe the annual initiative and how projects should align under it."
                required
              />
            </label>
          </div>

          <div className="drawer-actions ppm-form-actions">
            <button type="submit" className="primary-btn" disabled={!form.strategicPriorityId}>
              Save Initiative
            </button>
          </div>
        </form>
      </section>
    </AppFrame>
  );
}
