import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

function getDeliveryStatusIndicator(project) {
  if (project.deliveryStatus === 'red') {
    return { label: 'At Risk', tone: 'red' };
  }

  if (project.deliveryStatus === 'yellow') {
    return { label: 'Watch', tone: 'yellow' };
  }

  return { label: 'On Track', tone: 'green' };
}

function getDeliveryPriority(project) {
  if (project.deliveryStatus === 'red') return 0;
  if (project.deliveryStatus === 'yellow') return 1;
  if (project.deliveryStatus === 'green') return 2;
  return 3;
}

function sortProjectsForDashboard(projects) {
  return [...projects].sort((left, right) => {
    const deliveryDelta = getDeliveryPriority(left) - getDeliveryPriority(right);
    if (deliveryDelta !== 0) return deliveryDelta;

    return String(left.name ?? '').localeCompare(String(right.name ?? ''));
  });
}

function sumProjectCosts(projects) {
  return projects.reduce((sum, project) => {
    const value = Number(String(project.estimatedCost).replace(/[^0-9.]/g, '')) || 0;
    return sum + value;
  }, 0);
}

function formatMillions(value) {
  return `$${value.toFixed(1)}M`;
}

const DELIVERY_STATUS_VISUAL_CONFIG = [
  { key: 'red', label: 'Off Track', tone: 'red' },
  { key: 'yellow', label: 'At Risk', tone: 'yellow' },
  { key: 'green', label: 'On Track', tone: 'green' },
];
const HEALTH_DIMENSIONS = ['scope', 'schedule', 'cost', 'quality', 'risk'];

const PROJECT_HEALTH_BY_ID = {
  'PRJ-301': {
    scope: 'green',
    schedule: 'yellow',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-302': {
    scope: 'green',
    schedule: 'green',
    cost: 'yellow',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-303': {
    scope: 'green',
    schedule: 'green',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-304': {
    scope: 'green',
    schedule: 'yellow',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-305': {
    scope: 'yellow',
    schedule: 'yellow',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-306': {
    scope: 'green',
    schedule: 'green',
    cost: 'yellow',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-307': {
    scope: 'green',
    schedule: 'yellow',
    cost: 'green',
    risk: 'red',
    quality: 'green',
  },
  'PRJ-308': {
    scope: 'green',
    schedule: 'green',
    cost: 'yellow',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-309': {
    scope: 'green',
    schedule: 'green',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-201': {
    scope: 'green',
    schedule: 'yellow',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-214': {
    scope: 'green',
    schedule: 'green',
    cost: 'yellow',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-223': {
    scope: 'yellow',
    schedule: 'green',
    cost: 'green',
    risk: 'red',
    quality: 'yellow',
  },
  'PRJ-230': {
    scope: 'yellow',
    schedule: 'yellow',
    cost: 'green',
    risk: 'yellow',
    quality: 'green',
  },
  'PRJ-233': {
    scope: 'green',
    schedule: 'yellow',
    cost: 'yellow',
    risk: 'red',
    quality: 'green',
  },
};

function getDeliveryStatusKey(project) {
  return project.deliveryStatus === 'red'
    || project.deliveryStatus === 'yellow'
    || project.deliveryStatus === 'green'
    ? project.deliveryStatus
    : 'green';
}

function getBusinessOwnerLabel(project) {
  return project.businessOwner?.trim() || 'Unassigned';
}

function getStrategicPriorityLabel(project) {
  return project.strategicPriorityTitle?.trim()
    || project.strategicAlignment?.trim()
    || 'Unassigned';
}

function getHealthLabel(tone) {
  if (tone === 'red') return 'At Risk';
  if (tone === 'yellow') return 'Watch';
  if (tone === 'green') return 'On Track';
  return 'Not Started';
}

function getProjectSheetHealth(project) {
  if (project.dashboardHealth) return project.dashboardHealth;

  const configuredHealth = PROJECT_HEALTH_BY_ID[project.id];
  if (configuredHealth) return configuredHealth;

  if (project.currentProjectClassification === 'Operational project') {
    if (project.category === 'Compliance') {
      return {
        scope: 'green',
        schedule: 'green',
        cost: 'yellow',
        risk: 'yellow',
        quality: 'green',
      };
    }

    return {
      scope: 'green',
      schedule: 'green',
      cost: 'green',
      risk: 'yellow',
      quality: 'green',
    };
  }

  return {
    scope: 'grey',
    schedule: 'grey',
    cost: 'grey',
    risk: 'grey',
    quality: 'grey',
  };
}

function renderHealthStatusCell(tone) {
  return (
    <span className="status-indicator-cell">
      <span className={`status-indicator-dot ${tone}`} aria-hidden="true" />
      <span>{getHealthLabel(tone)}</span>
    </span>
  );
}

function renderPortfolioItemLink(project) {
  if (project.isInitiativeItem) {
    return (
      <Link className="table-link" to={`/ppm/operational-initiatives/${project.id}`}>
        {project.name}
      </Link>
    );
  }

  return (
    <Link className="table-link" to={`/ppm/projects/${project.id}`}>
      {project.name}
    </Link>
  );
}

function getPortfolioItemId(project) {
  return project.id || '-';
}

function getHealthTonePriority(tone) {
  if (tone === 'red') return 0;
  if (tone === 'yellow') return 1;
  if (tone === 'green') return 2;
  return 3;
}

function getOverallHealthTone(health) {
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'red')) return 'red';
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'yellow')) return 'yellow';
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'green')) return 'green';
  return 'grey';
}

function getCurrentInitiativeYear(operationalInitiatives, activeStrategicPriorityPeriod) {
  return Math.max(
    ...operationalInitiatives
      .filter((initiative) => initiative.strategicPriorityPeriodId === activeStrategicPriorityPeriod?.id)
      .map((initiative) => Number(initiative.year) || 0),
    new Date().getFullYear(),
  );
}

function buildInitiativeHealth(relatedProjects) {
  if (!relatedProjects.length) {
    return {
      scope: 'grey',
      schedule: 'grey',
      cost: 'grey',
      quality: 'grey',
      risk: 'grey',
    };
  }

  return HEALTH_DIMENSIONS.reduce((health, dimension) => {
    const tone = relatedProjects.reduce((worstTone, project) => {
      const projectHealth = getProjectSheetHealth(project);
      const nextTone = projectHealth[dimension] ?? 'grey';
      return getHealthTonePriority(nextTone) < getHealthTonePriority(worstTone) ? nextTone : worstTone;
    }, 'grey');

    return {
      ...health,
      [dimension]: tone,
    };
  }, {});
}

function buildOperationalInitiativeItems(operationalInitiatives, activeStrategicPriorityPeriod, majorProjects) {
  const currentYear = getCurrentInitiativeYear(operationalInitiatives, activeStrategicPriorityPeriod);

  return operationalInitiatives
    .filter(
      (initiative) => initiative.strategicPriorityPeriodId === activeStrategicPriorityPeriod?.id
        && Number(initiative.year) === currentYear,
    )
    .map((initiative) => {
      const relatedProjects = majorProjects.filter(
        (project) => project.operationalInitiativeId === initiative.id
          || project.operationalInitiativeTitle === initiative.title,
      );
      const explicitOwner = initiative.owner?.trim() || '';
      const owners = [...new Set(
        relatedProjects
          .map((project) => project.businessOwner?.trim())
          .filter(Boolean),
      )];
      const dashboardHealth = buildInitiativeHealth(relatedProjects);
      const deliveryStatus = getOverallHealthTone(dashboardHealth);
      const rolledUpBudget = formatMillions(sumProjectCosts(relatedProjects));

      return {
        id: initiative.id,
        name: initiative.title,
        businessOwner: explicitOwner || (owners.length === 1 ? owners[0] : owners.length > 1 ? 'Multiple Owners' : 'Unassigned'),
        estimatedCost: rolledUpBudget,
        currentProjectClassification: 'Operational Initiative',
        stage: 'current',
        deliveryStatus: deliveryStatus === 'grey' ? 'green' : deliveryStatus,
        dashboardHealth,
        strategicPriorityTitle: initiative.strategicPriorityTitle || '-',
        description: initiative.description || '',
        linkedProjectCount: relatedProjects.length,
        relatedProjects,
        isInitiativeItem: true,
      };
    });
}

export default function PortfolioDashboardPage() {
  const {
    currentProjects,
    futureProjects,
    submittedProjects,
    operationalInitiatives,
    activeStrategicPriorityPeriod,
  } = usePpmProjects();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedSummaryCard, setSelectedSummaryCard] = useState(null);
  const [selectedOwnerStatusCell, setSelectedOwnerStatusCell] = useState(null);
  const [selectedOwnerRow, setSelectedOwnerRow] = useState(null);
  const [selectedPriorityStatusCell, setSelectedPriorityStatusCell] = useState(null);
  const [selectedVisualType, setSelectedVisualType] = useState('initiatives');
  const majorProjects = useMemo(
    () => sortProjectsForDashboard(
      currentProjects.filter(
        (project) => project.currentProjectClassification === 'Major project',
      ),
    ),
    [currentProjects],
  );
  const operationalInitiativeItems = useMemo(
    () => sortProjectsForDashboard(
      buildOperationalInitiativeItems(
        operationalInitiatives,
        activeStrategicPriorityPeriod,
        majorProjects,
      ),
    ),
    [operationalInitiatives, activeStrategicPriorityPeriod, majorProjects],
  );
  const futureProjectsSorted = useMemo(
    () => sortProjectsForDashboard(futureProjects),
    [futureProjects],
  );
  const submittedProjectsSorted = useMemo(
    () => sortProjectsForDashboard(submittedProjects),
    [submittedProjects],
  );
  const majorProjectsApprovedBudget = useMemo(
    () => formatMillions(sumProjectCosts(majorProjects)),
    [majorProjects],
  );
  const operationalInitiativesRolledUpBudget = useMemo(
    () => formatMillions(sumProjectCosts(operationalInitiativeItems)),
    [operationalInitiativeItems],
  );
  const futurePipelineEstimatedCost = useMemo(
    () => formatMillions(sumProjectCosts(futureProjects)),
    [futureProjects],
  );
  const currentPortfolioItems = useMemo(
    () => sortProjectsForDashboard([
      ...operationalInitiativeItems,
      ...majorProjects,
    ]),
    [operationalInitiativeItems, majorProjects],
  );
  const visualPortfolioItems = useMemo(() => {
    if (selectedVisualType === 'initiatives') return operationalInitiativeItems;
    if (selectedVisualType === 'major-projects') return majorProjects;
    return currentPortfolioItems;
  }, [selectedVisualType, operationalInitiativeItems, majorProjects, currentPortfolioItems]);
  const portfolioSummary = useMemo(
    () => [
      {
        key: 'initiatives',
        label: 'Operational Initiatives',
        value: String(operationalInitiativeItems.length),
        note: `Rolled-Up Budget: ${operationalInitiativesRolledUpBudget}`,
        projects: operationalInitiativeItems,
      },
      {
        key: 'major',
        label: 'Major Projects',
        value: String(majorProjects.length),
        note: `Approved Budget: ${majorProjectsApprovedBudget}`,
        projects: majorProjects,
      },
      {
        key: 'future',
        label: 'Future Pipeline',
        value: String(futureProjects.length),
        note: `Estimated Cost: ${futurePipelineEstimatedCost}`,
        projects: futureProjectsSorted,
      },
      {
        key: 'submitted',
        label: 'New Submissions',
        value: String(submittedProjects.length),
        note: 'Awaiting portfolio review',
        projects: submittedProjectsSorted,
      },
    ],
    [
      futurePipelineEstimatedCost,
      futureProjects.length,
      futureProjectsSorted,
      operationalInitiativeItems,
      operationalInitiativesRolledUpBudget,
      majorProjects,
      majorProjectsApprovedBudget,
      submittedProjects.length,
      submittedProjectsSorted,
    ],
  );
  const projectsByStatus = useMemo(
    () => DELIVERY_STATUS_VISUAL_CONFIG.map((statusConfig) => {
      const matchingProjects = sortProjectsForDashboard(
        visualPortfolioItems.filter((project) => getDeliveryStatusKey(project) === statusConfig.key),
      );

      return {
        ...statusConfig,
        count: matchingProjects.length,
        projects: matchingProjects,
      };
    }),
    [visualPortfolioItems],
  );
  const businessOwnerStatusMatrix = useMemo(() => {
    const rowsByOwner = visualPortfolioItems.reduce((accumulator, project) => {
      const owner = getBusinessOwnerLabel(project);
      const statusKey = getDeliveryStatusKey(project);
      const existingRow = accumulator.get(owner) ?? {
        owner,
        projects: [],
        red: 0,
        yellow: 0,
        green: 0,
      };

      existingRow[statusKey] += 1;
      existingRow.projects.push(project);
      accumulator.set(owner, existingRow);
      return accumulator;
    }, new Map());

    return [...rowsByOwner.values()].sort((left, right) => {
      const leftTotal = left.red + left.yellow + left.green;
      const rightTotal = right.red + right.yellow + right.green;
      if (rightTotal !== leftTotal) return rightTotal - leftTotal;
      return left.owner.localeCompare(right.owner);
    });
  }, [visualPortfolioItems]);
  const strategicPriorityStatusMatrix = useMemo(() => {
    const rowsByPriority = visualPortfolioItems.reduce((accumulator, project) => {
      const priority = getStrategicPriorityLabel(project);
      const statusKey = getDeliveryStatusKey(project);
      const existingRow = accumulator.get(priority) ?? {
        priority,
        projects: [],
        red: 0,
        yellow: 0,
        green: 0,
      };

      existingRow[statusKey] += 1;
      existingRow.projects.push(project);
      accumulator.set(priority, existingRow);
      return accumulator;
    }, new Map());

    return [...rowsByPriority.values()].sort((left, right) => {
      const leftTotal = left.red + left.yellow + left.green;
      const rightTotal = right.red + right.yellow + right.green;
      if (rightTotal !== leftTotal) return rightTotal - leftTotal;
      return left.priority.localeCompare(right.priority);
    });
  }, [visualPortfolioItems]);
  const selectedStatusGroup = useMemo(
    () => projectsByStatus.find((statusGroup) => statusGroup.key === selectedStatus) ?? null,
    [projectsByStatus, selectedStatus],
  );
  const selectedSummaryGroup = useMemo(
    () => portfolioSummary.find((card) => card.key === selectedSummaryCard) ?? null,
    [portfolioSummary, selectedSummaryCard],
  );
  const selectedOwnerStatusGroup = useMemo(() => {
    if (selectedOwnerRow) {
      const ownerRow = businessOwnerStatusMatrix.find((row) => row.owner === selectedOwnerRow);
      if (!ownerRow) return null;

      const matchingProjects = sortProjectsForDashboard(ownerRow.projects);

      return {
        owner: ownerRow.owner,
        statusKey: null,
        label: selectedVisualType === 'major-projects' ? 'All Projects' : 'All Initiatives',
        count: matchingProjects.length,
        projects: matchingProjects,
      };
    }

    if (!selectedOwnerStatusCell) return null;

    const ownerRow = businessOwnerStatusMatrix.find((row) => row.owner === selectedOwnerStatusCell.owner);
    if (!ownerRow) return null;

    const statusConfig = DELIVERY_STATUS_VISUAL_CONFIG.find(
      (config) => config.key === selectedOwnerStatusCell.statusKey,
    );
    const matchingProjects = sortProjectsForDashboard(
      ownerRow.projects.filter(
        (project) => getDeliveryStatusKey(project) === selectedOwnerStatusCell.statusKey,
      ),
    );

    return {
      owner: ownerRow.owner,
      statusKey: selectedOwnerStatusCell.statusKey,
      label: statusConfig ? statusConfig.label : '',
      count: matchingProjects.length,
      projects: matchingProjects,
    };
  }, [businessOwnerStatusMatrix, selectedOwnerRow, selectedOwnerStatusCell, selectedVisualType]);
  const selectedPriorityStatusGroup = useMemo(() => {
    if (!selectedPriorityStatusCell) return null;

    const priorityRow = strategicPriorityStatusMatrix.find(
      (row) => row.priority === selectedPriorityStatusCell.priority,
    );
    if (!priorityRow) return null;

    const statusConfig = DELIVERY_STATUS_VISUAL_CONFIG.find(
      (config) => config.key === selectedPriorityStatusCell.statusKey,
    );
    const matchingProjects = sortProjectsForDashboard(
      priorityRow.projects.filter(
        (project) => getDeliveryStatusKey(project) === selectedPriorityStatusCell.statusKey,
      ),
    );

    return {
      priority: priorityRow.priority,
      statusKey: selectedPriorityStatusCell.statusKey,
      label: statusConfig ? statusConfig.label : '',
      count: matchingProjects.length,
      projects: matchingProjects,
    };
  }, [selectedPriorityStatusCell, strategicPriorityStatusMatrix]);
  const ownerMatrixTitle = selectedVisualType === 'major-projects'
    ? 'Project Status by Business Owner'
    : 'Operational Initiative Status by Business Owner';
  const ownerMatrixSubtitle = selectedVisualType === 'major-projects'
    ? 'Click any count to view the related projects'
    : 'Click any count to view the related initiatives';

  return (
    <AppFrame
      title="Portfolio Dashboard"
      description="PPM workflow across proposal intake, review, future pipeline, and active projects."
      topNavActions={(
        <Link className="primary-btn" to="/ppm/submit">
          <Icon name="plus" />
          Submit Project
        </Link>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="portfolio" />Portfolio Snapshot</h2>
          <div className="muted">Operational initiatives and major projects drive the active portfolio view</div>
        </div>

        <div className="cards portfolio-cards">
          {portfolioSummary.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`card portfolio-summary-card${selectedSummaryGroup?.key === card.key ? ' is-selected' : ''}`}
              onClick={() => setSelectedSummaryCard((current) => (current === card.key ? null : card.key))}
              aria-pressed={selectedSummaryGroup?.key === card.key}
            >
              <div className="label">{card.label}</div>
              <div className="value portfolio-summary-value">{card.value}</div>
              <div className="muted">{card.note}</div>
            </button>
          ))}
        </div>

        {selectedSummaryGroup ? (
          <div className="portfolio-summary-drilldown">
            <div className="panel-header-row">
              <h3>{selectedSummaryGroup.label}</h3>
              <div className="muted">{selectedSummaryGroup.projects.length} item(s)</div>
            </div>

            <div className="table-wrap portfolio-summary-table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Item</th>
                    <th>Stage</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSummaryGroup.projects.map((project) => (
                    <tr key={project.id}>
                      <td>{getPortfolioItemId(project)}</td>
                      <td>
                        {renderPortfolioItemLink(project)}
                      </td>
                      <td>{project.stage || '-'}</td>
                      <td>{project.businessOwner || '-'}</td>
                      <td>{project.currentProjectClassification || '-'}</td>
                      <td>{getDeliveryStatusIndicator(project).label}</td>
                    </tr>
                  ))}
                  {!selectedSummaryGroup.projects.length ? (
                    <tr>
                      <td colSpan={6} className="muted">No projects are in this view.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel band-blue portfolio-dashboard-visuals-panel">
        <div className="panel-header-row">
          <h2><Icon name="assessment" />Portfolio Items By Status</h2>
          <div className="portfolio-visual-selector" role="tablist" aria-label="Dashboard visual type">
            <button
              type="button"
              role="tab"
              aria-selected={selectedVisualType === 'initiatives'}
              className={`portfolio-visual-selector-btn${selectedVisualType === 'initiatives' ? ' is-selected' : ''}`}
              onClick={() => {
                setSelectedVisualType('initiatives');
                setSelectedStatus(null);
                setSelectedOwnerStatusCell(null);
                setSelectedOwnerRow(null);
                setSelectedPriorityStatusCell(null);
              }}
            >
              Operational Initiatives
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedVisualType === 'major-projects'}
              className={`portfolio-visual-selector-btn${selectedVisualType === 'major-projects' ? ' is-selected' : ''}`}
              onClick={() => {
                setSelectedVisualType('major-projects');
                setSelectedStatus(null);
                setSelectedOwnerStatusCell(null);
                setSelectedOwnerRow(null);
                setSelectedPriorityStatusCell(null);
              }}
            >
              Major Projects
            </button>
          </div>
        </div>

        <div className="portfolio-dashboard-visual-grid">
          <div className="portfolio-dashboard-visual-card portfolio-status-overview visual-band-status">
            <div className="portfolio-matrix-intro">
              <h3>Status Overview</h3>
              <p>Select a status to drill into the portfolio items below</p>
            </div>

            <div className="table-wrap portfolio-status-overview-wrap">
              <table className="simple-table portfolio-status-overview-table" aria-label="Portfolio items by status">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsByStatus.map((statusGroup) => {
                    const isSelected = selectedStatusGroup?.key === statusGroup.key;

                    return (
                      <tr key={statusGroup.key}>
                        <th scope="row" className="portfolio-status-overview-label">
                          {statusGroup.label}
                        </th>
                        <td className="portfolio-status-overview-count-cell">
                          <button
                            type="button"
                            className={`owner-status-count tone-${statusGroup.tone}${statusGroup.count === 0 ? ' is-empty' : ''}${isSelected ? ' is-selected' : ''}`}
                            onClick={() => {
                              setSelectedOwnerStatusCell(null);
                              setSelectedOwnerRow(null);
                              setSelectedPriorityStatusCell(null);
                              setSelectedStatus((current) => (
                                current === statusGroup.key ? null : statusGroup.key
                              ));
                            }}
                            aria-pressed={isSelected}
                          >
                            {statusGroup.count}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="portfolio-dashboard-visual-card portfolio-owner-matrix visual-band-owner">
            <div className="portfolio-matrix-intro">
              <h3>{ownerMatrixTitle}</h3>
              <p>{ownerMatrixSubtitle}</p>
            </div>

            <div className="table-wrap portfolio-owner-matrix-wrap">
              <table className="simple-table portfolio-owner-matrix-table">
                <thead>
                  <tr>
                    <th>Business Owner</th>
                    {DELIVERY_STATUS_VISUAL_CONFIG.map((statusConfig) => (
                      <th key={statusConfig.key} className={`portfolio-status-column-label tone-${statusConfig.tone}`}>
                        {statusConfig.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {businessOwnerStatusMatrix.map((row) => (
                    <tr key={row.owner}>
                      <th scope="row">
                        <button
                          type="button"
                          className={`owner-status-total${selectedOwnerRow === row.owner ? ' is-selected' : ''}`}
                          onClick={() => {
                            setSelectedStatus(null);
                            setSelectedPriorityStatusCell(null);
                            setSelectedOwnerStatusCell(null);
                            setSelectedOwnerRow((current) => (current === row.owner ? null : row.owner));
                          }}
                          aria-pressed={selectedOwnerRow === row.owner}
                        >
                          {row.owner}
                        </button>
                      </th>
                      {DELIVERY_STATUS_VISUAL_CONFIG.map((statusConfig) => {
                        const isSelected = selectedOwnerStatusGroup?.owner === row.owner
                          && selectedOwnerStatusGroup.statusKey === statusConfig.key;

                        return (
                          <td key={`${row.owner}-${statusConfig.key}`}>
                            <button
                              type="button"
                              className={`owner-status-count tone-${statusConfig.tone}${row[statusConfig.key] === 0 ? ' is-empty' : ''}${isSelected ? ' is-selected' : ''}`}
                              onClick={() => {
                                setSelectedStatus(null);
                                setSelectedPriorityStatusCell(null);
                                setSelectedOwnerRow(null);
                                setSelectedOwnerStatusCell((current) => (
                                  current?.owner === row.owner && current?.statusKey === statusConfig.key
                                    ? null
                                    : { owner: row.owner, statusKey: statusConfig.key }
                                ));
                              }}
                              aria-pressed={isSelected}
                            >
                              {row[statusConfig.key]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!businessOwnerStatusMatrix.length ? (
                    <tr>
                      <td colSpan={4} className="muted">No project data is available for the owner matrix.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="portfolio-dashboard-visual-card portfolio-priority-matrix visual-band-priority">
            <div className="portfolio-matrix-intro">
              <h3>Strategic Priority Status</h3>
              <p>Select a count to drill into that strategic priority and status combination</p>
            </div>

            <div className="table-wrap portfolio-priority-matrix-wrap">
              <table className="simple-table portfolio-priority-matrix-table">
                <thead>
                  <tr>
                    <th>Strategic Priority</th>
                    {DELIVERY_STATUS_VISUAL_CONFIG.map((statusConfig) => (
                      <th key={statusConfig.key} className={`portfolio-status-column-label tone-${statusConfig.tone}`}>
                        {statusConfig.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {strategicPriorityStatusMatrix.map((row) => (
                    <tr key={row.priority}>
                      <th scope="row">{row.priority}</th>
                      {DELIVERY_STATUS_VISUAL_CONFIG.map((statusConfig) => {
                        const isSelected = selectedPriorityStatusGroup?.priority === row.priority
                          && selectedPriorityStatusGroup.statusKey === statusConfig.key;

                        return (
                          <td key={`${row.priority}-${statusConfig.key}`}>
                            <button
                              type="button"
                              className={`owner-status-count tone-${statusConfig.tone}${row[statusConfig.key] === 0 ? ' is-empty' : ''}${isSelected ? ' is-selected' : ''}`}
                              onClick={() => {
                                setSelectedStatus(null);
                                setSelectedOwnerRow(null);
                                setSelectedOwnerStatusCell(null);
                                setSelectedPriorityStatusCell((current) => (
                                  current?.priority === row.priority && current?.statusKey === statusConfig.key
                                    ? null
                                    : { priority: row.priority, statusKey: statusConfig.key }
                                ));
                              }}
                              aria-pressed={isSelected}
                            >
                              {row[statusConfig.key]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!strategicPriorityStatusMatrix.length ? (
                    <tr>
                      <td colSpan={4} className="muted">No portfolio items are available for strategic priority analysis.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {(selectedStatusGroup || selectedOwnerStatusGroup || selectedPriorityStatusGroup) ? (
          <div className="portfolio-dashboard-drilldown-grid">
            {selectedStatusGroup ? (
              <div className="portfolio-dashboard-drilldown-card">
                <div className="panel-header-row">
                  <h3>{selectedStatusGroup.label} Portfolio Items</h3>
                  <div className="muted">{selectedStatusGroup.count} item(s)</div>
                </div>

                <div className="table-wrap portfolio-status-table-wrap">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Owner</th>
                        <th>Scope</th>
                        <th>Schedule</th>
                        <th>Cost</th>
                        <th>Quality</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStatusGroup.projects.map((project) => {
                        const health = getProjectSheetHealth(project);

                        return (
                          <tr key={project.id}>
                            <td>{getPortfolioItemId(project)}</td>
                            <td>
                              {renderPortfolioItemLink(project)}
                            </td>
                            <td>{project.currentProjectClassification || '-'}</td>
                            <td>{project.businessOwner || '-'}</td>
                            <td>{renderHealthStatusCell(health.scope)}</td>
                            <td>{renderHealthStatusCell(health.schedule)}</td>
                            <td>{renderHealthStatusCell(health.cost)}</td>
                            <td>{renderHealthStatusCell(health.quality)}</td>
                            <td>{renderHealthStatusCell(health.risk)}</td>
                          </tr>
                        );
                      })}
                      {!selectedStatusGroup.projects.length ? (
                        <tr>
                          <td colSpan={9} className="muted">No portfolio items are in this status.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {selectedOwnerStatusGroup ? (
              <div className="portfolio-dashboard-drilldown-card">
                <div className="panel-header-row">
                  <h3>{selectedOwnerStatusGroup.owner} - {selectedOwnerStatusGroup.label}</h3>
                  <div className="muted">{selectedOwnerStatusGroup.count} item(s)</div>
                </div>

                <div className="table-wrap portfolio-owner-status-table-wrap">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Stage</th>
                        <th>Owner</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOwnerStatusGroup.projects.map((project) => (
                        <tr key={project.id}>
                          <td>{getPortfolioItemId(project)}</td>
                          <td>
                            {renderPortfolioItemLink(project)}
                          </td>
                          <td>{project.stage || '-'}</td>
                          <td>{project.businessOwner || '-'}</td>
                          <td>{project.currentProjectClassification || '-'}</td>
                          <td>{getDeliveryStatusIndicator(project).label}</td>
                        </tr>
                      ))}
                      {!selectedOwnerStatusGroup.projects.length ? (
                        <tr>
                          <td colSpan={6} className="muted">No projects are in this owner/status selection.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {selectedPriorityStatusGroup ? (
              <div className="portfolio-dashboard-drilldown-card">
                <div className="panel-header-row">
                  <h3>{selectedPriorityStatusGroup.priority} - {selectedPriorityStatusGroup.label}</h3>
                  <div className="muted">{selectedPriorityStatusGroup.count} item(s)</div>
                </div>

                <div className="table-wrap portfolio-priority-status-table-wrap">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Owner</th>
                        <th>Type</th>
                        <th>Strategic Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPriorityStatusGroup.projects.map((project) => (
                        <tr key={project.id}>
                          <td>{getPortfolioItemId(project)}</td>
                          <td>{renderPortfolioItemLink(project)}</td>
                          <td>{project.businessOwner || '-'}</td>
                          <td>{project.currentProjectClassification || '-'}</td>
                          <td>{getStrategicPriorityLabel(project)}</td>
                          <td>{getDeliveryStatusIndicator(project).label}</td>
                        </tr>
                      ))}
                      {!selectedPriorityStatusGroup.projects.length ? (
                        <tr>
                          <td colSpan={6} className="muted">No portfolio items are in this strategic priority selection.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

    </AppFrame>
  );
}
