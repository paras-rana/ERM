import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';
import {
  EXECUTIVE_SPONSOR_OPTIONS,
  PROJECT_CATEGORY_OPTIONS,
} from '../ppm/ppmConfig';

function formatQuarterFromMonth(monthValue) {
  if (!monthValue) return '';
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return '';
  return `Q${Math.floor((month - 1) / 3) + 1} ${year}`;
}

function createInitialForm() {
  return {
    name: '',
    projectPurpose: '',
    scopeStatement: '',
    executiveSponsor: EXECUTIVE_SPONSOR_OPTIONS[0],
    businessOwner: '',
    teamMembersText: '',
    estimatedCost: '',
    costEstimateBreakdownFiles: [],
    scopeStatementFiles: [],
    expectedOutcomesText: '',
    expectedStartMonth: '',
    durationMonths: '',
    potentialRisksText: '',
    assumptionsText: '',
    milestones: [
      {
        id: `draft-${Date.now()}`,
        name: '',
        quarter: '',
      },
    ],
    category: PROJECT_CATEGORY_OPTIONS[0],
    operationalInitiativeId: '',
  };
}

export default function SubmitProjectPage() {
  const navigate = useNavigate();
  const {
    activeStrategicPriorityPeriod,
    operationalInitiatives,
    submitProject,
  } = usePpmProjects();
  const [form, setForm] = useState(() => createInitialForm());
  const selectedOperationalInitiative = operationalInitiatives.find(
    (initiative) => initiative.id === form.operationalInitiativeId,
  ) ?? null;

  function onChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const nextForm = { ...current, [name]: value };
      return nextForm;
    });
  }

  function onFileChange(event) {
    const { name, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: Array.from(files ?? []).map((file) => file.name),
    }));
  }

  function addMilestone() {
    setForm((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        {
          id: `draft-${Date.now()}-${current.milestones.length + 1}`,
          name: '',
          quarter: '',
        },
      ],
    }));
  }

  function updateMilestone(milestoneId, field, value) {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone) => (
        milestone.id === milestoneId ? { ...milestone, [field]: value } : milestone
      )),
    }));
  }

  function removeMilestone(milestoneId) {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.filter((milestone) => milestone.id !== milestoneId),
    }));
  }

  function onSubmit(event) {
    event.preventDefault();
    submitProject({
      ...form,
      summary: form.projectPurpose.trim(),
      targetStartQuarter: formatQuarterFromMonth(form.expectedStartMonth),
      strategicPriorityPeriodId: activeStrategicPriorityPeriod?.id ?? '',
      strategicPriorityPeriodLabel: activeStrategicPriorityPeriod?.label ?? '',
      teamMembers: form.teamMembersText
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      expectedOutcomes: form.expectedOutcomesText
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      potentialRisks: form.potentialRisksText
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      assumptions: form.assumptionsText
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      operationalInitiativeId: selectedOperationalInitiative?.id ?? '',
      operationalInitiativeTitle: selectedOperationalInitiative?.title ?? '',
      strategicPriorityId: selectedOperationalInitiative?.strategicPriorityId ?? '',
      strategicPriorityTitle: selectedOperationalInitiative?.strategicPriorityTitle ?? '',
      strategicAlignment: selectedOperationalInitiative?.strategicPriorityTitle ?? '',
      milestones: form.milestones
        .map((milestone, index) => ({
          id: milestone.id || `draft-${index + 1}`,
          name: milestone.name.trim(),
          quarter: milestone.quarter,
        }))
        .filter((milestone) => milestone.name),
    });
    setForm(createInitialForm());
    navigate('/ppm/review');
  }

  return (
    <AppFrame
      title="Submit New Project"
      description="Capture a proposal for portfolio manager review before it enters the future pipeline."
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="plus" />Project Proposal</h2>
          <div className="muted">Submitted proposals route to the review queue</div>
        </div>

        <form className="risk-form ppm-form" onSubmit={onSubmit}>
          <section className="detail-block detail-section-banded band-purple ppm-form-section">
            <div className="panel-header-row">
              <div>
                <h3>Project Summary</h3>
              </div>
            </div>

            <div className="inline-form-grid">
              <label className="full-width">
                <span className="field-label">Project Title <span className="required-marker" aria-hidden="true">*</span></span>
                <input name="name" value={form.name} onChange={onChange} required />
              </label>

              <label className="full-width">
                <span className="field-label">Project Purpose <span className="required-marker" aria-hidden="true">*</span></span>
                <textarea
                  name="projectPurpose"
                  rows={4}
                  value={form.projectPurpose}
                  onChange={onChange}
                  placeholder="Describe the purpose of the project."
                  required
                />
              </label>

              <label>
                Scope Statement Document
                <input
                  type="file"
                  name="scopeStatementFiles"
                  onChange={onFileChange}
                  accept=".pdf,.doc,.docx"
                  multiple
                />
              </label>

              <label className="full-width">
                Scope Statement
                <textarea
                  name="scopeStatement"
                  rows={4}
                  value={form.scopeStatement}
                  onChange={onChange}
                  placeholder="Summarize what is in and out of scope."
                />
              </label>

              <label className="full-width">
                <span className="field-label">Expected Outcomes / Benefits <span className="required-marker" aria-hidden="true">*</span></span>
                <textarea
                  name="expectedOutcomesText"
                  rows={4}
                  value={form.expectedOutcomesText}
                  onChange={onChange}
                  placeholder="Enter one expected outcome or benefit per line"
                  required
                />
              </label>
            </div>
          </section>

          <section className="detail-block detail-section-banded band-orange ppm-form-section">
            <div className="panel-header-row">
              <div>
                <h3>Resources</h3>
              </div>
            </div>

            <div className="inline-form-grid">
              <label>
                Executive Sponsor
                <select name="executiveSponsor" value={form.executiveSponsor} onChange={onChange}>
                  {EXECUTIVE_SPONSOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label">Business Owner <span className="required-marker" aria-hidden="true">*</span></span>
                <input name="businessOwner" value={form.businessOwner} onChange={onChange} required />
              </label>

              <label className="full-width">
                <span className="field-label">Team Members <span className="required-marker" aria-hidden="true">*</span></span>
                <textarea
                  name="teamMembersText"
                  rows={4}
                  value={form.teamMembersText}
                  onChange={onChange}
                  placeholder="Enter one team member per line"
                  required
                />
              </label>

              <label>
                <span className="field-label">Estimated Cost <span className="required-marker" aria-hidden="true">*</span></span>
                <input
                  name="estimatedCost"
                  value={form.estimatedCost}
                  onChange={onChange}
                  placeholder="$2.5M"
                  required
                />
              </label>

              <label>
                Cost Breakdown File
                <input
                  type="file"
                  name="costEstimateBreakdownFiles"
                  onChange={onFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  multiple
                />
              </label>
            </div>
          </section>

          <section className="detail-block detail-section-banded band-green ppm-form-section">
            <div className="panel-header-row">
              <div>
                <h3>Assumptions and Risks</h3>
              </div>
            </div>

            <div className="inline-form-grid">
              <label>
                <span className="field-label">Expected Start Month <span className="required-marker" aria-hidden="true">*</span></span>
                <input
                  type="month"
                  name="expectedStartMonth"
                  value={form.expectedStartMonth}
                  onChange={onChange}
                  required
                />
              </label>

              <label>
                <span className="field-label">Duration in Months <span className="required-marker" aria-hidden="true">*</span></span>
                <input
                  type="number"
                  min="1"
                  name="durationMonths"
                  value={form.durationMonths}
                  onChange={onChange}
                  placeholder="6"
                  required
                />
              </label>

              <label className="full-width">
                Potential Risks
                <textarea
                  name="potentialRisksText"
                  rows={4}
                  value={form.potentialRisksText}
                  onChange={onChange}
                  placeholder="Enter one potential risk per line"
                />
              </label>

              <label className="full-width">
                Assumptions
                <textarea
                  name="assumptionsText"
                  rows={4}
                  value={form.assumptionsText}
                  onChange={onChange}
                  placeholder="Enter one assumption per line"
                />
              </label>

              <div className="full-width ppm-milestone-section">
                <div className="panel-header-row">
                  <label className="ppm-section-label">Key Milestones</label>
                  <button type="button" className="secondary-btn" onClick={addMilestone}>
                    Add Milestone
                  </button>
                </div>

                <div className="ppm-milestone-list">
                  {form.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="detail-block ppm-milestone-editor">
                      <div className="panel-header-row">
                        <div className="label">Milestone {index + 1}</div>
                        {form.milestones.length > 1 ? (
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => removeMilestone(milestone.id)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="inline-form-grid">
                        <label>
                          <span className="field-label">Milestone Name {index === 0 ? <span className="required-marker" aria-hidden="true">*</span> : null}</span>
                          <input
                            value={milestone.name}
                            onChange={(event) => updateMilestone(milestone.id, 'name', event.target.value)}
                            placeholder="Example: Steering committee approval"
                            required={index === 0}
                          />
                        </label>

                        <label>
                          <span className="field-label">Target Month {index === 0 ? <span className="required-marker" aria-hidden="true">*</span> : null}</span>
                          <input
                            type="month"
                            value={milestone.quarter}
                            onChange={(event) => updateMilestone(milestone.id, 'quarter', event.target.value)}
                            required={index === 0}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="detail-block detail-section-banded band-blue ppm-form-section">
            <div className="panel-header-row">
              <div>
                <h3>Alignment</h3>
              </div>
            </div>

            <div className="inline-form-grid">
              <label>
                Category
                <select name="category" value={form.category} onChange={onChange}>
                  {PROJECT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label">Annual Operational Initiative <span className="required-marker" aria-hidden="true">*</span></span>
                <select
                  name="operationalInitiativeId"
                  value={form.operationalInitiativeId}
                  onChange={onChange}
                  required
                  disabled={!operationalInitiatives.length}
                >
                  <option value="" disabled>Select an annual operational initiative</option>
                  {operationalInitiatives.map((initiative) => (
                    <option key={initiative.id} value={initiative.id}>
                      {initiative.year} | {initiative.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="detail-block">
                <div className="label">Strategic Priority</div>
                <div>{selectedOperationalInitiative?.strategicPriorityTitle || '-'}</div>
              </div>
            </div>
          </section>

          <div className="ppm-upload-summary">
            <div className="detail-block">
              <div className="label">Cost Estimate Breakdown</div>
              <div className="muted">
                {form.costEstimateBreakdownFiles.length > 0
                  ? form.costEstimateBreakdownFiles.join(', ')
                  : 'No files selected'}
              </div>
            </div>
            <div className="detail-block">
              <div className="label">Scope Statement Document</div>
              <div className="muted">
                {form.scopeStatementFiles.length > 0
                  ? form.scopeStatementFiles.join(', ')
                  : 'No files selected'}
              </div>
            </div>
          </div>

          <div className="drawer-actions ppm-form-actions">
            <button type="button" className="secondary-btn" onClick={() => setForm(createInitialForm())}>
              Reset
            </button>
            <button type="submit" className="primary-btn">
              Submit Proposal
            </button>
          </div>
        </form>
      </section>
    </AppFrame>
  );
}
