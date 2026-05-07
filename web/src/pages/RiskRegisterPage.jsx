import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { apiFetch } from '../lib/api';
const PAGE_SIZE = 20;

const DEFAULT_DEPARTMENT_BY_CATEGORY = {
  Clinical: 'Clinical Operations',
  Compliance: 'Compliance',
  Operations: 'Operations',
  Finance: 'Finance',
  Workforce: 'People',
  Safety: 'Safety',
  IT: 'Technology',
  Facilities: 'Facilities',
};

const DEPARTMENT_OPTIONS = [
  'Clinical Operations',
  'Compliance',
  'Operations',
  'Finance',
  'PMO',
  'People',
  'Safety',
  'Technology',
  'Facilities',
];

const CATEGORY_OPTIONS = [
  'Clinical',
  'Compliance',
  'Operations',
  'Finance',
  'Workforce',
  'Safety',
  'IT',
  'Facilities',
  'Initiative',
  'Major Project',
];

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'Clinical',
  department: DEFAULT_DEPARTMENT_BY_CATEGORY.Clinical,
  owner_name: '',
  owner_email: '',
  site_or_program: '',
  status: 'Open',
  inherent_severity: 3,
  inherent_probability: 3,
  residual_severity: '',
  residual_probability: '',
  residual_notes: '',
  next_review_due: '',
};

function getBand(score) {
  if (score == null) return 'unknown';
  if (score <= 6) return 'low';
  if (score >= 15) return 'high';
  return 'medium';
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export default function RiskRegisterPage() {
  const { token, logout } = useAuth();
  // Main page + list state.
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Drawer form state.
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [drawerInitialForm, setDrawerInitialForm] = useState(INITIAL_FORM);

  // Table filtering + paging state.
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bandFilter, setBandFilter] = useState('All');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();

  const loadRisks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await apiFetch('/risks', { token, onUnauthorized: logout });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setRisks(data);
    } catch (err) {
      setError(`Failed to load risks: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void loadRisks();
  }, [loadRisks]);

  useEffect(() => {
    if (!location.state?.openNewRisk) return;

    setDrawerInitialForm(INITIAL_FORM);
    setForm(INITIAL_FORM);
    setFormError('');
    setShowDrawer(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const categories = useMemo(() => {
    const values = new Set(risks.map((risk) => risk.category).filter(Boolean));
    return ['All', ...Array.from(values).sort()];
  }, [risks]);

  const statuses = useMemo(() => {
    const values = new Set(risks.map((risk) => risk.status).filter(Boolean));
    return ['All', ...Array.from(values).sort()];
  }, [risks]);

  // Apply all filters client-side for the list view.
  const filteredRisks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return risks.filter((risk) => {
      const band = getBand(risk.inherent_score);

      const matchesSearch =
        !query ||
        risk.risk_id?.toLowerCase().includes(query) ||
        risk.title?.toLowerCase().includes(query) ||
        risk.category?.toLowerCase().includes(query) ||
        risk.department?.toLowerCase().includes(query) ||
        risk.status?.toLowerCase().includes(query) ||
        (risk.owner_name ?? '').toLowerCase().includes(query);

      const matchesCategory = categoryFilter === 'All' || risk.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || risk.status === statusFilter;
      const matchesBand = bandFilter === 'All' || band === bandFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesBand;
    });
  }, [risks, search, categoryFilter, statusFilter, bandFilter]);

  function getDepartmentDisplay(risk) {
    if (risk.department && risk.department.trim() !== '') return risk.department;
    return DEFAULT_DEPARTMENT_BY_CATEGORY[risk.category] || '-';
  }

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, bandFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRisks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRisks.slice(start, start + PAGE_SIZE);
  }, [filteredRisks, page]);

  const drawer =
    typeof document !== 'undefined'
      ? createPortal(
        <div className={`drawer-overlay ${showDrawer ? 'open' : ''}`} onClick={closeDrawer}>
          <aside
            className={`drawer-panel ${showDrawer ? 'open' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <h2>Add New Risk</h2>
              <button className="icon-btn" onClick={closeDrawer} aria-label="Close">
                x
              </button>
            </div>

            {formError && <p className="error">{formError}</p>}

            <form className="risk-form" onSubmit={onSubmit}>
              <div className="form-grid single-column">
                <label>
                  <span className="field-label">Title <span className="required-marker" aria-hidden="true">*</span></span>
                  <input name="title" value={form.title} onChange={onFormChange} required />
                </label>

                <label>
                  <span className="field-label">Category <span className="required-marker" aria-hidden="true">*</span></span>
                  <select name="category" value={form.category} onChange={onFormChange}>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="field-label">Department <span className="required-marker" aria-hidden="true">*</span></span>
                  <select name="department" value={form.department} onChange={onFormChange} required>
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Owner Name
                  <input name="owner_name" value={form.owner_name} onChange={onFormChange} />
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

                <label>
                  Site / Program
                  <input
                    name="site_or_program"
                    value={form.site_or_program}
                    onChange={onFormChange}
                  />
                </label>

                <label>
                  Status
                  <select name="status" value={form.status} onChange={onFormChange}>
                    <option>Open</option>
                    <option>Monitoring</option>
                    <option>Mitigating</option>
                    <option>Accepted</option>
                    <option>Closed</option>
                  </select>
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
                <button type="button" className="secondary-btn" onClick={() => setForm(drawerInitialForm)}>
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
      )
      : null;

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function closeDrawer() {
    setShowDrawer(false);
    setFormError('');
  }

  function openNewRiskDrawer() {
    setDrawerInitialForm(INITIAL_FORM);
    setForm(INITIAL_FORM);
    setFormError('');
    setShowDrawer(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');

    try {
      setSaving(true);

      const payload = {
        ...form,
        inherent_severity: Number(form.inherent_severity),
        inherent_probability: Number(form.inherent_probability),
        residual_severity:
          form.residual_severity === '' ? null : Number(form.residual_severity),
        residual_probability:
          form.residual_probability === '' ? null : Number(form.residual_probability),
      };

      const res = await apiFetch('/risks', {
        method: 'POST',
        token,
        onUnauthorized: logout,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }

      const created = await res.json();

      setDrawerInitialForm(INITIAL_FORM);
      setForm(INITIAL_FORM);
      setShowDrawer(false);
      await loadRisks();

      navigate(`/risks/${created.risk_id}`);
    } catch (err) {
      setFormError(`Failed to create risk: ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppFrame
      title="Risk Register"
      description="Manage risks and open each risk&apos;s detail page."
    >

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="filter" />Filters</h2>
          <button className="primary-btn" onClick={openNewRiskDrawer}>
            <Icon name="plus" />
            Add New Risk
          </button>
        </div>

        <div className="filters-grid">
          <label className="filter-item">
            Search
            <input
              className="search-input"
              placeholder="Risk ID, title, category, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="filter-item">
            Category
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-item">
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-item">
            Risk Band
            <select value={bandFilter} onChange={(e) => setBandFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="filter-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setSearch('');
                setCategoryFilter('All');
                setStatusFilter('All');
                setBandFilter('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="risk" />Risks ({filteredRisks.length})</h2>
          <div className="muted">
            Page {page} of {totalPages} - {PAGE_SIZE} per page
          </div>
        </div>

        {loading && <p>Loading risks...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Risk ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Risk Level</th>
                    <th>Owner</th>
                    <th>Inherent</th>
                    <th>Residual</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRisks.map((risk) => {
                    const band = getBand(risk.inherent_score);
                    return (
                      <tr key={risk.risk_id}>
                        <td>{risk.risk_id}</td>
                        <td>{risk.title}</td>
                        <td>{risk.category}</td>
                        <td>{getDepartmentDisplay(risk)}</td>
                        <td>{risk.status}</td>
                        <td>
                          <span className={`pill ${band}`}>{band}</span>
                        </td>
                        <td>{risk.owner_name || '-'}</td>
                        <td>
                          S{risk.inherent_severity}/P{risk.inherent_probability} (
                          {risk.inherent_score})
                        </td>
                        <td>
                          {risk.residual_score != null
                            ? `S${risk.residual_severity}/P${risk.residual_probability} (${risk.residual_score})`
                            : '-'}
                        </td>
                        <td>
                          <Link className="link-btn" to={`/risks/${risk.risk_id}`}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {pagedRisks.length === 0 && (
                    <tr>
                      <td colSpan={10} className="muted">
                        No risks match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-row">
              <button
                className="secondary-btn"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                  .map((pageNumber) => (
                    <button
                      key={pageNumber}
                      className={`page-btn ${pageNumber === page ? 'active' : ''}`}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
              </div>

              <button
                className="secondary-btn"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>

      {drawer}
    </AppFrame>
  );
}
