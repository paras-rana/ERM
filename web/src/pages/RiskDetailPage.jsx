import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import RiskMatrix from '../components/RiskMatrix';
import { apiFetch } from '../lib/api';

const initialMitigationForm = {
  title: '',
  status: 'Planned',
  mitigation_owner_name: '',
  start_date: '',
  due_date: '',
  completed_date: '',
  impacts_severity: false,
  impacts_probability: false,
  confidence_level: 'Medium',
  control_type: 'Preventive',
  estimated_cost: '',
  plan_url: '',
  notes: '',
};

const initialAssessmentForm = {
  assessment_type: 'RESIDUAL',
  severity: 3,
  probability: 3,
  assessed_by: '',
  notes: '',
};

function renderImpactIcon(impacts) {
  if (impacts) {
    return <Icon name="arrowDown" className="impact-icon impact-icon-down" />;
  }

  return <Icon name="minus" className="impact-icon impact-icon-flat" />;
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function RiskDetailPage() {
  const { riskId } = useParams();
  const { token, logout } = useAuth();

  // Primary page data state.
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Row selections used for visual context and "selected influence" callout.
  const [selectedMitigationId, setSelectedMitigationId] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

  // Active entity ids when editing existing records in the drawer.
  const [editingMitigationId, setEditingMitigationId] = useState(null);
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);

  // Single source of truth for drawer visibility and form mode.
  // values: null | 'mitigation' | 'assessment'
  const [activeForm, setActiveForm] = useState(null);

  // Controlled form state for both drawer forms.
  const [mitigationForm, setMitigationForm] = useState(initialMitigationForm);
  const [assessmentForm, setAssessmentForm] = useState(initialAssessmentForm);

  // Submit lifecycle state.
  const [mitigationSaving, setMitigationSaving] = useState(false);
  const [assessmentSaving, setAssessmentSaving] = useState(false);

  // Form-specific error messages.
  const [mitigationError, setMitigationError] = useState('');
  const [assessmentError, setAssessmentError] = useState('');

  const isMitigationOpen = activeForm === 'mitigation';
  const isAssessmentOpen = activeForm === 'assessment';

  const closeDrawer = () => {
    setActiveForm(null);
    setEditingMitigationId(null);
    setEditingAssessmentId(null);
    setMitigationError('');
    setAssessmentError('');
  };

  // Loads all data needed by the page.
  const loadDetail = useCallback(async () => {
    if (!riskId) return;

    try {
      setLoading(true);
      setError('');
      setSelectedMitigationId(null);
      setSelectedAssessmentId(null);

      const res = await apiFetch(`/risks/${riskId}/detail`, {
        token,
        onUnauthorized: logout,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setDetail(data);
    } catch (err) {
      setError(`Failed to load risk detail: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [riskId, token, logout]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const selectedAssessment = useMemo(() => {
    if (!detail || !selectedAssessmentId) return null;
    return (
      detail.assessments.find((a) => a.assessment_id === selectedAssessmentId) || null
    );
  }, [detail, selectedAssessmentId]);

  // Opens mitigation drawer in "edit existing mitigation" mode.
  function openMitigationEditor(mitigation) {
    const selectedMitigation =
      mitigation ??
      detail?.mitigations.find((item) => item.mitigation_id === selectedMitigationId) ??
      null;

    if (!selectedMitigation) return;

    setAssessmentError('');
    setMitigationError('');
    setEditingAssessmentId(null);
    setEditingMitigationId(selectedMitigation.mitigation_id);
    setMitigationForm({
      title: selectedMitigation.title ?? '',
      status: selectedMitigation.status ?? 'Planned',
      mitigation_owner_name: selectedMitigation.mitigation_owner_name ?? '',
      start_date: toDateInputValue(selectedMitigation.start_date),
      due_date: toDateInputValue(selectedMitigation.due_date),
      completed_date: toDateInputValue(selectedMitigation.completed_date),
      impacts_severity: Boolean(selectedMitigation.impacts_severity),
      impacts_probability: Boolean(selectedMitigation.impacts_probability),
      confidence_level: selectedMitigation.confidence_level ?? 'Medium',
      control_type: selectedMitigation.control_type ?? 'Preventive',
      estimated_cost:
        selectedMitigation.estimated_cost == null
          ? ''
          : String(selectedMitigation.estimated_cost),
      plan_url: selectedMitigation.plan_url ?? '',
      notes: selectedMitigation.notes ?? '',
    });
    setActiveForm('mitigation');
  }

  // Opens assessment drawer in "edit existing assessment" mode.
  function openAssessmentEditor(assessment = selectedAssessment) {
    if (!assessment) return;

    setMitigationError('');
    setAssessmentError('');
    setEditingMitigationId(null);
    setEditingAssessmentId(assessment.assessment_id);
    setAssessmentForm({
      assessment_type: assessment.assessment_type ?? 'RESIDUAL',
      severity: assessment.severity ?? 3,
      probability: assessment.probability ?? 3,
      assessed_by: assessment.assessed_by ?? '',
      notes: assessment.notes ?? '',
    });
    setActiveForm('assessment');
  }

  // Opens mitigation drawer in "add new mitigation" mode.
  function openNewMitigationForm() {
    setMitigationError('');
    setAssessmentError('');
    setEditingMitigationId(null);
    setMitigationForm(initialMitigationForm);
    setActiveForm((prev) => (prev === 'mitigation' ? null : 'mitigation'));
  }

  // Opens assessment drawer in "add new assessment" mode.
  function openNewAssessmentForm() {
    setMitigationError('');
    setAssessmentError('');
    setEditingAssessmentId(null);
    setAssessmentForm(initialAssessmentForm);
    setActiveForm((prev) => (prev === 'assessment' ? null : 'assessment'));
  }

  // Generic input binding for mitigation form controls.
  function onMitigationChange(e) {
    const { name, value, type, checked } = e.target;
    setMitigationForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function onAssessmentChange(e) {
    const { name, value } = e.target;
    setAssessmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Persists mitigation changes; switches between POST/PUT based on edit state.
  async function submitMitigation(e) {
    e.preventDefault();
    setMitigationError('');

    try {
      setMitigationSaving(true);

      const payload = {
        ...mitigationForm,
        estimated_cost:
          mitigationForm.estimated_cost === ''
            ? null
            : Number(mitigationForm.estimated_cost),
      };

      const isEditing = Boolean(editingMitigationId);
      const endpoint = isEditing
        ? `/risks/${riskId}/mitigations/${editingMitigationId}`
        : `/risks/${riskId}/mitigations`;

      const res = await apiFetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        token,
        onUnauthorized: logout,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          errBody && typeof errBody.message === 'string'
            ? errBody.message
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setMitigationForm(initialMitigationForm);
      setEditingMitigationId(null);
      setActiveForm(null);
      await loadDetail();
    } catch (err) {
      setMitigationError(
        `Failed to ${editingMitigationId ? 'update' : 'add'} mitigation: ${getErrorMessage(err)}`,
      );
    } finally {
      setMitigationSaving(false);
    }
  }

  // Persists assessment changes; switches between POST/PUT based on edit state.
  async function submitAssessment(e) {
    e.preventDefault();
    setAssessmentError('');

    try {
      setAssessmentSaving(true);

      const payload = {
        ...assessmentForm,
        severity: Number(assessmentForm.severity),
        probability: Number(assessmentForm.probability),
      };

      const isEditing = Boolean(editingAssessmentId);
      const endpoint = isEditing
        ? `/risks/${riskId}/assessments/${editingAssessmentId}`
        : `/risks/${riskId}/assessments`;

      const res = await apiFetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        token,
        onUnauthorized: logout,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          errBody && typeof errBody.message === 'string'
            ? errBody.message
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setAssessmentForm(initialAssessmentForm);
      setEditingAssessmentId(null);
      setActiveForm(null);
      await loadDetail();
    } catch (err) {
      setAssessmentError(
        `Failed to ${editingAssessmentId ? 'update' : 'add'} assessment: ${getErrorMessage(err)}`,
      );
    } finally {
      setAssessmentSaving(false);
    }
  }

  const siteProgramLabel = detail && ['Initiative', 'Major Project'].includes(detail.risk.category)
    ? 'PMO'
    : (detail?.risk.site_or_program ?? 'No site/program');

  return (
    <AppFrame
      title="Risk Detail"
      description="Review scoring, mitigations, and assessments for one risk."
      detailLabel="Risk Detail"
    >

      <section className="panel detail-panel">
        {loading && <p>Loading detail...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && detail && (
          <>
            <div className="detail-block detail-section-banded">
              <h3 className="risk-heading">
                <strong>{detail.risk.risk_id}</strong>
                <span>{detail.risk.title}</span>
              </h3>
              <p className="risk-description">
                {detail.risk.description?.trim() || 'No risk description provided.'}
              </p>
              <p className="muted">
                {detail.risk.category} - {detail.risk.status} -{' '}
                {siteProgramLabel}
              </p>
            </div>

            <div className="matrix-row">
              <RiskMatrix
                title="Inherent Risk"
                severity={detail.risk.inherent_severity}
                probability={detail.risk.inherent_probability}
              />

              <RiskMatrix
                title="Residual Risk"
                severity={detail.risk.residual_severity}
                probability={detail.risk.residual_probability}
              />
            </div>

            <div className="detail-block detail-section-banded">
              <div className="panel-header-row">
                <h3><Icon name="assessment" />Assessments</h3>
                <button className="secondary-btn" onClick={openNewAssessmentForm}>
                  <Icon name="plus" />
                  {isAssessmentOpen ? 'Close Assessment Form' : 'Add Assessment'}
                </button>
              </div>
              {detail.assessments.length === 0 ? (
                <p className="muted">No assessments found.</p>
              ) : (
                <div className="table-wrap">
                  <table className="simple-table assessment-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Probability</th>
                        <th className="assessment-score-heading">Score</th>
                        <th>Assessed By</th>
                        <th>Assessed At</th>
                        <th className="action-column">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.assessments.map((a) => (
                        <tr
                          key={a.assessment_id}
                          className={
                            selectedAssessmentId === a.assessment_id ? 'row-selected' : ''
                          }
                          onClick={() => setSelectedAssessmentId(a.assessment_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{a.assessment_type}</td>
                          <td>{a.severity}</td>
                          <td>{a.probability}</td>
                          <td className="assessment-score-cell">{a.score}</td>
                          <td>{a.assessed_by}</td>
                          <td>{new Date(a.assessed_at).toLocaleString()}</td>
                          <td className="action-column">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssessmentId(a.assessment_id);
                                openAssessmentEditor(a);
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="detail-block detail-section-banded">
              <div className="panel-header-row">
                <h3><Icon name="mitigations" />Mitigations</h3>
                <button className="secondary-btn" onClick={openNewMitigationForm}>
                  <Icon name="plus" />
                  {isMitigationOpen ? 'Close Mitigation Form' : 'Add Mitigation'}
                </button>
              </div>
              {detail.mitigations.length === 0 ? (
                <p className="muted">No mitigations found.</p>
              ) : (
                <div className="table-wrap">
                  <table className="simple-table mitigation-table">
                    <thead>
                      <tr>
                        <th>Mitigation</th>
                        <th>Status</th>
                        <th className="impact-column">Severity</th>
                        <th className="impact-column">Probability</th>
                        <th>Due</th>
                        <th className="action-column">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.mitigations.map((m) => (
                        <tr
                          key={m.mitigation_id}
                          className={
                            selectedMitigationId === m.mitigation_id ? 'row-selected' : ''
                          }
                          onClick={() => setSelectedMitigationId(m.mitigation_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{m.title}</td>
                          <td>{m.status}</td>
                          <td className="impact-column">{renderImpactIcon(m.impacts_severity)}</td>
                          <td className="impact-column">
                            {renderImpactIcon(m.impacts_probability)}
                          </td>
                          <td>
                            {m.due_date ? new Date(m.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="action-column">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMitigationId(m.mitigation_id);
                                openMitigationEditor(m);
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Right-side drawer overlay (single form at a time) */}
      <div
        className={`drawer-overlay ${activeForm ? 'open' : ''}`}
        onClick={closeDrawer}
      >
        <aside
          className={`drawer-panel ${activeForm ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isMitigationOpen && (
            <>
              <div className="drawer-header">
                <h2>{editingMitigationId ? 'Edit Mitigation' : 'Add Mitigation'}</h2>
                <button className="icon-btn" onClick={closeDrawer} aria-label="Close">
                  x
                </button>
              </div>

              <p className="muted">
                Mitigations indicate whether they reduce severity and/or probability.
                Final cumulative scoring is captured via assessment.
              </p>

              {mitigationError && <p className="error">{mitigationError}</p>}

              <form className="risk-form" onSubmit={submitMitigation}>
                <div className="inline-form-grid">
                  <label>
                    <span className="field-label">Title <span className="required-marker" aria-hidden="true">*</span></span>
                    <input
                      name="title"
                      value={mitigationForm.title}
                      onChange={onMitigationChange}
                      required
                    />
                  </label>

                  <label>
                    Status
                    <select
                      name="status"
                      value={mitigationForm.status}
                      onChange={onMitigationChange}
                    >
                      <option>Planned</option>
                      <option>In Progress</option>
                      <option>Implemented</option>
                      <option>On Hold</option>
                      <option>Cancelled</option>
                    </select>
                  </label>

                  <label>
                    Mitigation Owner
                    <input
                      name="mitigation_owner_name"
                      value={mitigationForm.mitigation_owner_name}
                      onChange={onMitigationChange}
                    />
                  </label>

                  <label>
                    Control Type
                    <select
                      name="control_type"
                      value={mitigationForm.control_type}
                      onChange={onMitigationChange}
                    >
                      <option>Preventive</option>
                      <option>Detective</option>
                      <option>Corrective</option>
                      <option>Compensating</option>
                    </select>
                  </label>

                  <label>
                    Confidence
                    <select
                      name="confidence_level"
                      value={mitigationForm.confidence_level}
                      onChange={onMitigationChange}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </label>

                  <label>
                    Estimated Cost
                    <input
                      name="estimated_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={mitigationForm.estimated_cost}
                      onChange={onMitigationChange}
                    />
                  </label>

                  <label>
                    Start Date
                    <input
                      name="start_date"
                      type="date"
                      value={mitigationForm.start_date}
                      onChange={onMitigationChange}
                    />
                  </label>

                  <label>
                    Due Date
                    <input
                      name="due_date"
                      type="date"
                      value={mitigationForm.due_date}
                      onChange={onMitigationChange}
                    />
                  </label>

                  <label>
                    Completed Date
                    <input
                      name="completed_date"
                      type="date"
                      value={mitigationForm.completed_date}
                      onChange={onMitigationChange}
                    />
                  </label>

                  <label>
                    Plan URL
                    <input
                      name="plan_url"
                      value={mitigationForm.plan_url}
                      onChange={onMitigationChange}
                      placeholder="https://..."
                    />
                  </label>

                  <div className="full-width checkbox-row">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        name="impacts_severity"
                        checked={mitigationForm.impacts_severity}
                        onChange={onMitigationChange}
                      />
                      Reduces Severity
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        name="impacts_probability"
                        checked={mitigationForm.impacts_probability}
                        onChange={onMitigationChange}
                      />
                      Reduces Probability
                    </label>
                  </div>

                  <label className="full-width">
                    Notes
                    <textarea
                      name="notes"
                      rows={3}
                      value={mitigationForm.notes}
                      onChange={onMitigationChange}
                    />
                  </label>
                </div>

                <div className="drawer-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setMitigationForm(initialMitigationForm);
                      closeDrawer();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setMitigationForm(initialMitigationForm)}
                  >
                    Reset
                  </button>

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={mitigationSaving}
                  >
                    {mitigationSaving
                      ? 'Saving...'
                      : editingMitigationId
                        ? 'Update Mitigation'
                        : 'Save Mitigation'}
                  </button>
                </div>
              </form>
            </>
          )}

          {isAssessmentOpen && (
            <>
              <div className="drawer-header">
                <h2>{editingAssessmentId ? 'Edit Assessment' : 'Add Assessment'}</h2>
                <button className="icon-btn" onClick={closeDrawer} aria-label="Close">
                  x
                </button>
              </div>

              <p className="muted">
                Use this to record the owner's scoring decision. Residual assessments
                update the residual matrix on this page.
              </p>

              {assessmentError && <p className="error">{assessmentError}</p>}

              <form className="risk-form" onSubmit={submitAssessment}>
                <div className="inline-form-grid">
                  <label>
                    Assessment Type
                    <select
                      name="assessment_type"
                      value={assessmentForm.assessment_type}
                      onChange={onAssessmentChange}
                    >
                      <option value="RESIDUAL">RESIDUAL</option>
                      <option value="INHERENT">INHERENT</option>
                    </select>
                  </label>

                  <label>
                    Assessed By
                    <input
                      name="assessed_by"
                      value={assessmentForm.assessed_by}
                      onChange={onAssessmentChange}
                      placeholder="Risk Owner"
                    />
                  </label>

                  <label>
                    <span className="field-label">Severity (1-5) <span className="required-marker" aria-hidden="true">*</span></span>
                    <input
                      name="severity"
                      type="number"
                      min="1"
                      max="5"
                      value={assessmentForm.severity}
                      onChange={onAssessmentChange}
                      required
                    />
                  </label>

                  <label>
                    <span className="field-label">Probability (1-5) <span className="required-marker" aria-hidden="true">*</span></span>
                    <input
                      name="probability"
                      type="number"
                      min="1"
                      max="5"
                      value={assessmentForm.probability}
                      onChange={onAssessmentChange}
                      required
                    />
                  </label>

                  <label className="full-width">
                    Notes
                    <textarea
                      name="notes"
                      rows={3}
                      value={assessmentForm.notes}
                      onChange={onAssessmentChange}
                      placeholder="Why this score was chosen..."
                    />
                  </label>
                </div>

                <div className="drawer-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setAssessmentForm(initialAssessmentForm);
                      closeDrawer();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setAssessmentForm(initialAssessmentForm)}
                  >
                    Reset
                  </button>

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={assessmentSaving}
                  >
                    {assessmentSaving
                      ? 'Saving...'
                      : editingAssessmentId
                        ? 'Update Assessment'
                        : 'Save Assessment'}
                  </button>
                </div>
              </form>
            </>
          )}
        </aside>
      </div>
    </AppFrame>
  );
}
