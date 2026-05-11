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

const initialTcorForm = {
  tcor_amount: '',
  narrative: '',
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

function formatCurrency(value) {
  if (value == null || value === '') return '-';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
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
  // values: null | 'mitigation' | 'assessment' | 'tcor'
  const [activeForm, setActiveForm] = useState(null);

  // Controlled form state for both drawer forms.
  const [mitigationForm, setMitigationForm] = useState(initialMitigationForm);
  const [assessmentForm, setAssessmentForm] = useState(initialAssessmentForm);
  const [tcorForm, setTcorForm] = useState(initialTcorForm);
  const [tcorFiles, setTcorFiles] = useState([]);

  // Submit lifecycle state.
  const [mitigationSaving, setMitigationSaving] = useState(false);
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [tcorSaving, setTcorSaving] = useState(false);

  // Form-specific error messages.
  const [mitigationError, setMitigationError] = useState('');
  const [assessmentError, setAssessmentError] = useState('');
  const [tcorError, setTcorError] = useState('');

  const isMitigationOpen = activeForm === 'mitigation';
  const isAssessmentOpen = activeForm === 'assessment';
  const isTcorOpen = activeForm === 'tcor';

  const closeDrawer = () => {
    setActiveForm(null);
    setEditingMitigationId(null);
    setEditingAssessmentId(null);
    setMitigationError('');
    setAssessmentError('');
    setTcorError('');
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
    setTcorError('');
    setEditingAssessmentId(null);
    setAssessmentForm(initialAssessmentForm);
    setActiveForm((prev) => (prev === 'assessment' ? null : 'assessment'));
  }

  // Opens TCOR drawer in "add new cost assessment" mode.
  function openNewTcorForm() {
    setMitigationError('');
    setAssessmentError('');
    setTcorError('');
    setTcorForm(initialTcorForm);
    setTcorFiles([]);
    setActiveForm((prev) => (prev === 'tcor' ? null : 'tcor'));
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

  function onTcorChange(e) {
    const { name, value } = e.target;
    setTcorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function onTcorFilesChange(e) {
    setTcorFiles(Array.from(e.target.files ?? []));
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

  async function submitTcor(e) {
    e.preventDefault();
    setTcorError('');

    try {
      setTcorSaving(true);

      const payload = {
        tcor_amount: tcorForm.tcor_amount === '' ? null : Number(tcorForm.tcor_amount),
        narrative: tcorForm.narrative,
        attachment_names: tcorFiles.map((file) => file.name),
      };

      const res = await apiFetch(`/risks/${riskId}/tcor-assessments`, {
        method: 'POST',
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

      setTcorForm(initialTcorForm);
      setTcorFiles([]);
      setActiveForm(null);
      await loadDetail();
    } catch (err) {
      setTcorError(`Failed to add TCOR assessment: ${getErrorMessage(err)}`);
    } finally {
      setTcorSaving(false);
    }
  }

  const pageTitle = detail
    ? `${detail.risk.risk_id} | ${detail.risk.title}`
    : riskId ?? 'Risk Detail';
  const pageDescription = detail?.risk.description?.trim() || 'No risk description provided.';
  const ownerName = detail?.risk.owner_name?.trim() || 'Unassigned';

  return (
    <AppFrame
      title={pageTitle}
      description={pageDescription}
      navDetailLabel="Risk Detail"
      topNavActions={
        detail ? (
          <div className="page-owner-card" aria-label={`Risk owner: ${ownerName}`}>
            <span className="page-owner-label">Owner</span>
            <span className="page-owner-name">{ownerName}</span>
          </div>
        ) : null
      }
    >

      <section className="panel detail-panel risk-detail-panel">
        {loading && <p>Loading detail...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && detail && (
          <>
            <div className="matrix-row">
              <RiskMatrix
                title="Inherent Risk"
                subtitle="Risk level before controls or mitigation actions are applied."
                severity={detail.risk.inherent_severity}
                probability={detail.risk.inherent_probability}
              />

              <RiskMatrix
                title="Residual Risk"
                subtitle="Risk level remaining after current controls and mitigations are considered."
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

            <div className="detail-block detail-section-banded tcor-section">
              <div className="panel-header-row">
                <h3><Icon name="assessment" />Total Cost of Risk</h3>
                <button className="secondary-btn" onClick={openNewTcorForm}>
                  <Icon name="plus" />
                  {isTcorOpen ? 'Close Cost Form' : 'Add Cost Assessment'}
                </button>
              </div>

              <div className="tcor-summary-card">
                <span className="tcor-summary-label">Latest TCOR</span>
                <span className="tcor-summary-value">
                  {formatCurrency(detail.risk.tcor_amount)}
                </span>
              </div>

              {(detail.tcorAssessments ?? []).length === 0 ? (
                <p className="muted">No TCOR assessments found.</p>
              ) : (
                <div className="table-wrap">
                  <table className="simple-table tcor-table">
                    <thead>
                      <tr>
                        <th>TCOR</th>
                        <th>Narrative</th>
                        <th>Attachments</th>
                        <th>Assessed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.tcorAssessments ?? []).map((assessment) => (
                        <tr key={assessment.tcor_assessment_id}>
                          <td>{formatCurrency(assessment.tcor_amount)}</td>
                          <td>{assessment.narrative || '-'}</td>
                          <td>
                            {assessment.attachment_names?.length
                              ? assessment.attachment_names.join(', ')
                              : '-'}
                          </td>
                          <td>{formatDateTime(assessment.assessed_at)}</td>
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

          {isTcorOpen && (
            <>
              <div className="drawer-header">
                <h2>Add Cost Assessment</h2>
                <button className="icon-btn" onClick={closeDrawer} aria-label="Close">
                  x
                </button>
              </div>

              <p className="muted">
                Capture the total cost of risk estimate and supporting context.
              </p>

              {tcorError && <p className="error">{tcorError}</p>}

              <form className="risk-form" onSubmit={submitTcor}>
                <div className="inline-form-grid">
                  <label>
                    <span className="field-label">TCOR <span className="required-marker" aria-hidden="true">*</span></span>
                    <input
                      name="tcor_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={tcorForm.tcor_amount}
                      onChange={onTcorChange}
                      required
                    />
                  </label>

                  <label className="full-width">
                    Cost Assessment Narrative
                    <textarea
                      name="narrative"
                      rows={4}
                      value={tcorForm.narrative}
                      onChange={onTcorChange}
                      placeholder="Describe assumptions, estimate basis, or cost drivers..."
                    />
                  </label>

                  <label className="full-width">
                    Attach Estimate Files
                    <input
                      name="attachments"
                      type="file"
                      multiple
                      onChange={onTcorFilesChange}
                    />
                  </label>

                  {tcorFiles.length > 0 && (
                    <div className="full-width tcor-file-list">
                      {tcorFiles.map((file) => (
                        <span key={`${file.name}-${file.size}`}>{file.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="drawer-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setTcorForm(initialTcorForm);
                      setTcorFiles([]);
                      closeDrawer();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setTcorForm(initialTcorForm);
                      setTcorFiles([]);
                    }}
                  >
                    Reset
                  </button>

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={tcorSaving}
                  >
                    {tcorSaving ? 'Saving...' : 'Save Cost Assessment'}
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
