import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import RiskCountMatrix from '../components/RiskCountMatrix';
import { apiFetch } from '../lib/api';
const PAGE_SIZE = 20;

// Used when the API row has no explicit department value.
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

function getBand(score) {
  if (score == null) return 'unknown';
  if (score <= 6) return 'low';
  if (score >= 15) return 'high';
  return 'medium';
}

function getAxes(risk, basis) {
  if (basis === 'residual') {
    if (risk.residual_severity == null || risk.residual_probability == null) return null;
    return {
      severity: Number(risk.residual_severity),
      probability: Number(risk.residual_probability),
      score: Number(risk.residual_score),
    };
  }

  return {
    severity: Number(risk.inherent_severity),
    probability: Number(risk.inherent_probability),
    score: Number(risk.inherent_score),
  };
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function getCellKey(severity, probability) {
  return `${severity}-${probability}`;
}

function formatCellLabel(cell) {
  return `S${cell.severity} x P${cell.probability}`;
}

function getDepartmentForRisk(risk) {
  return risk.department || DEFAULT_DEPARTMENT_BY_CATEGORY[risk.category] || 'Unassigned';
}

function toggleStringFilter(list, value) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  // Core page and loading state.
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [basis, setBasis] = useState('inherent'); // inherent | residual

  // Active filters.
  const [selectedCells, setSelectedCells] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadRisks() {
      try {
        setLoading(true);
        setError('');

        const res = await apiFetch('/risks', { token, onUnauthorized: logout });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setRisks(data);
      } catch (err) {
        setError(`Failed to load dashboard data: ${getErrorMessage(err)}`);
      } finally {
        setLoading(false);
      }
    }

    void loadRisks();
  }, [token, logout]);

  // Changing basis invalidates any old matrix/category/department selections.
  useEffect(() => {
    setSelectedCells([]);
    setSelectedCategories([]);
    setSelectedDepartments([]);
  }, [basis]);

  // Residual mode excludes rows that do not have residual axes yet.
  const validRisks = useMemo(() => risks.filter((r) => getAxes(r, basis) !== null), [risks, basis]);

  // Build matrix counts after category + department filters.
  const matrixCounts = useMemo(() => {
    const counts = {};
    for (let s = 1; s <= 5; s += 1) {
      for (let p = 1; p <= 5; p += 1) {
        counts[getCellKey(s, p)] = 0;
      }
    }

    const baseForMatrix = validRisks.filter((risk) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(risk.category || 'Uncategorized')
      ) {
        return false;
      }

      if (selectedDepartments.length > 0) {
        const department = getDepartmentForRisk(risk);
        if (!selectedDepartments.includes(department)) return false;
      }

      return true;
    });

    for (const risk of baseForMatrix) {
      const axes = getAxes(risk, basis);
      if (!axes) continue;
      counts[getCellKey(axes.severity, axes.probability)] += 1;
    }

    return counts;
  }, [validRisks, basis, selectedCategories, selectedDepartments]);

  const selectedCellKeySet = useMemo(
    () => new Set(selectedCells.map((cell) => getCellKey(cell.severity, cell.probability))),
    [selectedCells],
  );

  const matrixFilteredRisks = useMemo(() => {
    if (selectedCells.length === 0) return validRisks;

    return validRisks.filter((risk) => {
      const axes = getAxes(risk, basis);
      if (!axes) return false;
      return selectedCellKeySet.has(getCellKey(axes.severity, axes.probability));
    });
  }, [validRisks, basis, selectedCells, selectedCellKeySet]);

  // Combined table filter: matrix + category + department.
  const filteredRisks = useMemo(() => {
    let rows = validRisks;

    if (selectedCells.length > 0) {
      rows = rows.filter((risk) => {
        const axes = getAxes(risk, basis);
        if (!axes) return false;
        return selectedCellKeySet.has(getCellKey(axes.severity, axes.probability));
      });
    }

    if (selectedCategories.length > 0) {
      rows = rows.filter((risk) =>
        selectedCategories.includes(risk.category || 'Uncategorized'),
      );
    }

    if (selectedDepartments.length > 0) {
      rows = rows.filter((risk) => selectedDepartments.includes(getDepartmentForRisk(risk)));
    }

    return [...rows].sort((a, b) => String(a.risk_id).localeCompare(String(b.risk_id)));
  }, [
    validRisks,
    basis,
    selectedCells,
    selectedCellKeySet,
    selectedCategories,
    selectedDepartments,
  ]);

  useEffect(() => {
    setPage(1);
  }, [basis, selectedCells, selectedCategories, selectedDepartments]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRisks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRisks.slice(start, start + PAGE_SIZE);
  }, [filteredRisks, page]);

  // Category summary is scoped by matrix + department selection.
  const categoryRows = useMemo(() => {
    const map = new Map();

    const baseForCategory = matrixFilteredRisks.filter((risk) => {
      if (selectedDepartments.length === 0) return true;
      return selectedDepartments.includes(getDepartmentForRisk(risk));
    });

    for (const risk of baseForCategory) {
      const axes = getAxes(risk, basis);
      if (!axes) continue;

      const category = risk.category || 'Uncategorized';
      const band = getBand(axes.score);

      if (!map.has(category)) {
        map.set(category, { category, low: 0, medium: 0, high: 0, total: 0 });
      }

      const row = map.get(category);
      row[band] += 1;
      row.total += 1;
    }

    return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [matrixFilteredRisks, basis, selectedDepartments]);

  // Department summary is scoped by matrix + category selection.
  const departmentRows = useMemo(() => {
    const map = new Map();

    const baseForDepartment = matrixFilteredRisks.filter((risk) => {
      if (selectedCategories.length === 0) return true;
      return selectedCategories.includes(risk.category || 'Uncategorized');
    });

    for (const risk of baseForDepartment) {
      const axes = getAxes(risk, basis);
      if (!axes) continue;

      const department = getDepartmentForRisk(risk);
      const band = getBand(axes.score);

      if (!map.has(department)) {
        map.set(department, { department, low: 0, medium: 0, high: 0, total: 0 });
      }

      const row = map.get(department);
      row[band] += 1;
      row.total += 1;
    }

    return Array.from(map.values()).sort((a, b) => a.department.localeCompare(b.department));
  }, [matrixFilteredRisks, basis, selectedCategories]);

  const excludedCount = risks.length - validRisks.length;

  const selectedSummaryText = useMemo(() => {
    if (selectedCells.length === 0) return 'Showing all matrix cells';
    if (selectedCells.length === 1) {
      const cell = selectedCells[0];
      return `${formatCellLabel(cell)} = ${cell.severity * cell.probability} - ${filteredRisks.length} risk(s)`;
    }

    const labels = selectedCells
      .map((cell) => formatCellLabel(cell))
      .sort((a, b) => a.localeCompare(b))
      .join(', ');

    return `${selectedCells.length} selected cells (${labels}) - ${filteredRisks.length} risk(s)`;
  }, [selectedCells, filteredRisks.length]);

  const categorySummaryText = useMemo(() => {
    if (selectedCategories.length === 0) return 'All categories';
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} categories selected`;
  }, [selectedCategories]);

  const departmentSummaryText = useMemo(() => {
    if (selectedDepartments.length === 0) return 'All departments';
    if (selectedDepartments.length === 1) return selectedDepartments[0];
    return `${selectedDepartments.length} departments selected`;
  }, [selectedDepartments]);

  function toggleSelectedCell(cell) {
    if (!cell || cell.severity == null || cell.probability == null) {
      setSelectedCells([]);
      return;
    }

    const severity = Number(cell.severity);
    const probability = Number(cell.probability);

    setSelectedCells((prev) => {
      const exists = prev.some(
        (selected) =>
          selected.severity === severity && selected.probability === probability,
      );

      if (exists) {
        return prev.filter(
          (selected) =>
            !(selected.severity === severity && selected.probability === probability),
        );
      }

      return [...prev, { severity, probability }];
    });
  }

  function clearSelection() {
    setSelectedCells([]);
  }

  function toggleCategory(category) {
    setSelectedCategories((prev) => toggleStringFilter(prev, category));
  }

  function clearCategorySelection() {
    setSelectedCategories([]);
  }

  function toggleDepartment(department) {
    setSelectedDepartments((prev) => toggleStringFilter(prev, department));
  }

  function clearDepartmentSelection() {
    setSelectedDepartments([]);
  }

  const hasSelection =
    selectedCells.length > 0 ||
    selectedCategories.length > 0 ||
    selectedDepartments.length > 0;

  return (
    <AppFrame
      title="Risk Dashboard"
      description="Matrix distribution view with clickable cells and category risk-band summary."
      topNavActions={(
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate('/risks', { state: { openNewRisk: true } })}
        >
          <Icon name="plus" />
          Add New Risk
        </button>
      )}
    >

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="filter" />Dashboard Controls</h2>
          <div className="basis-switch">
            <label>
              Matrix Basis
              <select value={basis} onChange={(e) => setBasis(e.target.value)}>
                <option value="inherent">Inherent Risk</option>
                <option value="residual">Residual Risk</option>
              </select>
            </label>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            className="secondary-btn"
            onClick={clearSelection}
            disabled={selectedCells.length === 0}
          >
            Clear Matrix Selection
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={clearCategorySelection}
            disabled={selectedCategories.length === 0}
          >
            Clear Category Selection
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={clearDepartmentSelection}
            disabled={selectedDepartments.length === 0}
          >
            Clear Department Selection
          </button>

          <span className="muted">{selectedSummaryText}</span>
        </div>

        {basis === 'residual' && excludedCount > 0 && (
          <p className="muted">
            {excludedCount} risk(s) are excluded because residual scoring is not available yet.
          </p>
        )}
      </section>

      {loading && <p>Loading dashboard...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="dashboard-grid">
            <section className="panel">
              <div className="section-title">
                <Icon name="matrix" />
                <span>Risk Matrix</span>
              </div>
              <div className="selection-badge-row">
                {selectedCells.length === 0 ? (
                  <span className="selection-badge is-empty">All cells</span>
                ) : (
                  <>
                    <span className="selection-badge">
                      {selectedCells.length} cell{selectedCells.length > 1 ? 's' : ''} selected
                    </span>

                    <div className="selection-chip-list">
                      {[...selectedCells]
                        .sort((a, b) =>
                          `${a.severity}-${a.probability}`.localeCompare(
                            `${b.severity}-${b.probability}`,
                          ),
                        )
                        .map((cell) => (
                          <span
                            key={`${cell.severity}-${cell.probability}`}
                            className="selection-chip"
                          >
                            S{cell.severity} x P{cell.probability}
                          </span>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <RiskCountMatrix
                title={basis === 'inherent' ? 'Inherent Risk Matrix' : 'Residual Risk Matrix'}
                subtitle="Click cells to filter the risk table and category summary"
                counts={matrixCounts}
                selectedCell={selectedCells[0] ?? null}
                selectedCells={selectedCells}
                onSelectCell={toggleSelectedCell}
              />
            </section>

            <section className="panel">
              <h2><Icon name="category" />Category Summary</h2>
              <p className="muted summary-note">
                Counts by category grouped into Low / Medium / High.
                {selectedCells.length > 0 ? ' (Filtered to selected matrix cells)' : ''}
                {selectedCategories.length > 0 ? ` (Selected: ${categorySummaryText})` : ''}
              </p>

              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Low</th>
                      <th>Medium</th>
                      <th>High</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRows.map((row) => (
                      <tr
                        key={row.category}
                        className={selectedCategories.includes(row.category) ? 'row-selected' : ''}
                        onClick={() => toggleCategory(row.category)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{row.category}</td>
                        <td>{row.low}</td>
                        <td>{row.medium}</td>
                        <td>{row.high}</td>
                        <td>{row.total}</td>
                      </tr>
                    ))}

                    {categoryRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="muted">
                          No risks available for this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h2><Icon name="department" />Department Summary</h2>
              <p className="muted summary-note">
                Counts by department grouped into Low / Medium / High.
                {selectedCells.length > 0 ? ' (Filtered to selected matrix cells)' : ''}
                {selectedCategories.length > 0 ? ' (Filtered to selected categories)' : ''}
                {selectedDepartments.length > 0 ? ` (Selected: ${departmentSummaryText})` : ''}
              </p>

              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Low</th>
                      <th>Medium</th>
                      <th>High</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentRows.map((row) => (
                      <tr
                        key={row.department}
                        className={
                          selectedDepartments.includes(row.department) ? 'row-selected' : ''
                        }
                        onClick={() => toggleDepartment(row.department)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{row.department}</td>
                        <td>{row.low}</td>
                        <td>{row.medium}</td>
                        <td>{row.high}</td>
                        <td>{row.total}</td>
                      </tr>
                    ))}

                    {departmentRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="muted">
                          No risks available for this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="panel-header-row">
              <h2><Icon name="risk" />{hasSelection ? 'Risks in Selected Filters' : 'Risks in Dashboard View'}</h2>

              <div className="muted">
                {selectedSummaryText} | Page {page} of {totalPages} - {PAGE_SIZE} per page
                {selectedCategories.length > 0 ? ` | ${categorySummaryText}` : ''}
                {selectedDepartments.length > 0 ? ` | ${departmentSummaryText}` : ''}
              </div>
            </div>

            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Risk ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Risk Level</th>
                    <th>Score</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCells.length === 0 && filteredRisks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted">
                        No risks available for this view.
                      </td>
                    </tr>
                  )}

                  {selectedCells.length > 0 && filteredRisks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted">
                        No risks in the selected matrix cells.
                      </td>
                    </tr>
                  )}

                  {pagedRisks.map((risk) => {
                    const axes = getAxes(risk, basis);
                    if (!axes) return null;

                    return (
                      <tr key={risk.risk_id}>
                        <td>{risk.risk_id}</td>
                        <td>{risk.title}</td>
                        <td>{risk.category}</td>
                        <td>{risk.status}</td>
                        <td>
                          <span className={`pill ${getBand(axes.score)}`}>
                            {getBand(axes.score)}
                          </span>
                        </td>
                        <td>
                          S{axes.severity}/P{axes.probability} ({axes.score})
                        </td>
                        <td>
                          <Link className="link-btn" to={`/risks/${risk.risk_id}`}>
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
          </section>
        </>
      )}
    </AppFrame>
  );
}
