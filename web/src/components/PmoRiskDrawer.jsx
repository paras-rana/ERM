import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/useAuth';
import { apiFetch } from '../lib/api';

const INITIAL_FORM = {
  title: '',
  description: '',
  owner_email: '',
  inherent_severity: 3,
  inherent_probability: 3,
  residual_severity: '',
  residual_probability: '',
  residual_notes: '',
  next_review_due: '',
};

function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export default function PmoRiskDrawer({
  isOpen,
  onClose,
  onCreated,
  category,
  ownerName,
  ownerEmail,
  linkId,
  contextLabel,
}) {
  const { token, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const initialForm = useMemo(
    () => ({
      ...INITIAL_FORM,
      owner_email: ownerEmail ?? '',
    }),
    [ownerEmail],
  );

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialForm);
    setFormError('');
  }, [initialForm, isOpen]);

  function onFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function closeDrawer() {
    if (saving) return;
    setFormError('');
    onClose();
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFormError('');

    try {
      setSaving(true);

      const payload = {
        ...form,
        category,
        department: 'PMO',
        owner_name: ownerName ?? '',
        site_or_program: linkId,
        status: 'Open',
        inherent_severity: Number(form.inherent_severity),
        inherent_probability: Number(form.inherent_probability),
        residual_severity: form.residual_severity === '' ? null : Number(form.residual_severity),
        residual_probability: form.residual_probability === '' ? null : Number(form.residual_probability),
      };

      const response = await apiFetch('/risks', {
        method: 'POST',
        token,
        onUnauthorized: logout,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `HTTP ${response.status}`);
      }

      const createdRisk = await response.json();
      setForm(initialForm);
      onCreated(createdRisk);
      onClose();
    } catch (error) {
      setFormError(`Failed to create risk: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={closeDrawer}>
      <aside
        className={`drawer-panel ${isOpen ? 'open' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <h2>Add New Risk</h2>
          <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close">
            x
          </button>
        </div>

        {formError ? <p className="error">{formError}</p> : null}

        <form className="risk-form" onSubmit={onSubmit}>
          <div className="form-grid single-column">
            <p className="muted risk-form-context-note">
              This risk will be created in the ERM register and linked back to this {contextLabel}.
            </p>

            <label>
              <span className="field-label">Title <span className="required-marker" aria-hidden="true">*</span></span>
              <input name="title" value={form.title} onChange={onFormChange} required />
            </label>

            <div className="two-col-row">
              <label>
                Category
                <input value={category} readOnly />
              </label>

              <label>
                Department
                <input value="PMO" readOnly />
              </label>
            </div>

            <div className="two-col-row">
              <label>
                Owner
                <input value={ownerName || '-'} readOnly />
              </label>

              <label>
                Site / Program
                <input value="PMO" readOnly />
              </label>
            </div>

            <label>
              Status
              <input value="Open" readOnly />
            </label>

            <label>
              Owner Email
              <input
                name="owner_email"
                type="email"
                value={form.owner_email}
                onChange={onFormChange}
              />
            </label>

            <div className="two-col-row">
              <label>
                <span className="field-label">Inherent Severity <span className="required-marker" aria-hidden="true">*</span></span>
                <input
                  name="inherent_severity"
                  type="number"
                  min="1"
                  max="5"
                  value={form.inherent_severity}
                  onChange={onFormChange}
                  required
                />
              </label>

              <label>
                <span className="field-label">Inherent Probability <span className="required-marker" aria-hidden="true">*</span></span>
                <input
                  name="inherent_probability"
                  type="number"
                  min="1"
                  max="5"
                  value={form.inherent_probability}
                  onChange={onFormChange}
                  required
                />
              </label>
            </div>

            <div className="two-col-row">
              <label>
                Residual Severity
                <input
                  name="residual_severity"
                  type="number"
                  min="1"
                  max="5"
                  value={form.residual_severity}
                  onChange={onFormChange}
                />
              </label>

              <label>
                Residual Probability
                <input
                  name="residual_probability"
                  type="number"
                  min="1"
                  max="5"
                  value={form.residual_probability}
                  onChange={onFormChange}
                />
              </label>
            </div>

            <label>
              Next Review Due
              <input
                name="next_review_due"
                type="date"
                value={form.next_review_due}
                onChange={onFormChange}
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={onFormChange}
                rows={3}
              />
            </label>

            <label>
              Residual Notes
              <textarea
                name="residual_notes"
                value={form.residual_notes}
                onChange={onFormChange}
                rows={2}
              />
            </label>
          </div>

          <div className="drawer-actions">
            <button type="button" className="secondary-btn" onClick={closeDrawer}>
              Cancel
            </button>
            <button type="button" className="secondary-btn" onClick={() => setForm(initialForm)}>
              Reset
            </button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Create Risk'}
            </button>
          </div>
        </form>
      </aside>
    </div>,
    document.body,
  );
}
