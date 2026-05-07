import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

const HEALTH_DIMENSIONS = ['scope', 'schedule', 'cost', 'quality', 'risk'];
const PROJECT_HEALTH_BY_ID = {
  'PRJ-301': { scope: 'green', schedule: 'yellow', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-302': { scope: 'green', schedule: 'green', cost: 'yellow', risk: 'yellow', quality: 'green' },
  'PRJ-303': { scope: 'green', schedule: 'green', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-304': { scope: 'green', schedule: 'yellow', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-305': { scope: 'yellow', schedule: 'yellow', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-306': { scope: 'green', schedule: 'green', cost: 'yellow', risk: 'yellow', quality: 'green' },
  'PRJ-307': { scope: 'green', schedule: 'yellow', cost: 'green', risk: 'red', quality: 'green' },
  'PRJ-308': { scope: 'green', schedule: 'green', cost: 'yellow', risk: 'yellow', quality: 'green' },
  'PRJ-309': { scope: 'green', schedule: 'green', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-201': { scope: 'green', schedule: 'yellow', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-214': { scope: 'green', schedule: 'green', cost: 'yellow', risk: 'yellow', quality: 'green' },
  'PRJ-223': { scope: 'yellow', schedule: 'green', cost: 'green', risk: 'red', quality: 'yellow' },
  'PRJ-230': { scope: 'yellow', schedule: 'yellow', cost: 'green', risk: 'yellow', quality: 'green' },
  'PRJ-233': { scope: 'green', schedule: 'yellow', cost: 'yellow', risk: 'red', quality: 'green' },
};

function getDeliveryIndicator(status) {
  if (status === 'red') {
    return { label: 'At Risk', tone: 'red' };
  }

  if (status === 'yellow') {
    return { label: 'Watch', tone: 'yellow' };
  }

  return { label: 'On Track', tone: 'green' };
}

function getStageTone(stage) {
  if (stage === 'current') return 'low';
  if (stage === 'future') return 'medium';
  if (stage === 'submitted') return 'medium';
  return 'unknown';
}

function getHealthPriority(tone) {
  if (tone === 'red') return 0;
  if (tone === 'yellow') return 1;
  if (tone === 'green') return 2;
  return 3;
}

function getProjectHealth(project) {
  return PROJECT_HEALTH_BY_ID[project.id] ?? {
    scope: project.deliveryStatus || 'green',
    schedule: project.deliveryStatus || 'green',
    cost: project.deliveryStatus || 'green',
    quality: project.deliveryStatus || 'green',
    risk: project.deliveryStatus || 'green',
  };
}

function buildInitiativeHealth(relatedProjects) {
  if (!relatedProjects.length) {
    return {
      scope: 'green',
      schedule: 'green',
      cost: 'green',
      quality: 'green',
      risk: 'green',
    };
  }

  return HEALTH_DIMENSIONS.reduce((health, dimension) => {
    const tone = relatedProjects.reduce((worst, project) => {
      const nextTone = getProjectHealth(project)[dimension];
      return getHealthPriority(nextTone) < getHealthPriority(worst) ? nextTone : worst;
    }, 'green');

    return { ...health, [dimension]: tone };
  }, {});
}

function getOverallHealthTone(health) {
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'red')) return 'red';
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'yellow')) return 'yellow';
  return 'green';
}

function getInitiativeRelatedProjects(initiative, projects) {
  return projects.filter(
    (project) => project.operationalInitiativeId === initiative.id
      || project.operationalInitiativeTitle === initiative.title,
  );
}

function getLatestInitiativeUpdate(initiative) {
  if (!Array.isArray(initiative.monthlyProgressUpdates) || !initiative.monthlyProgressUpdates.length) {
    return null;
  }

  return [...initiative.monthlyProgressUpdates].sort(
    (left, right) => String(right.month ?? '').localeCompare(String(left.month ?? '')),
  )[0];
}

function getInitiativeCurrentHealth(initiative, projects) {
  const latestUpdate = getLatestInitiativeUpdate(initiative);
  if (latestUpdate) {
    return {
      scope: latestUpdate.scopeStatus,
      schedule: latestUpdate.scheduleStatus,
      cost: latestUpdate.costStatus,
      quality: latestUpdate.qualityStatus,
      risk: latestUpdate.riskStatus,
      overall: latestUpdate.overallStatus,
    };
  }

  const relatedProjects = getInitiativeRelatedProjects(initiative, projects);
  const derivedHealth = buildInitiativeHealth(relatedProjects);
  return {
    ...derivedHealth,
    overall: getOverallHealthTone(derivedHealth),
  };
}

function getInitiativeStage(year) {
  const currentYear = new Date().getFullYear();
  if (Number(year) > currentYear) return 'future';
  if (Number(year) < currentYear) return 'archived';
  return 'current';
}

function buildMajorProjectItems(projects, archivedProposals) {
  return [
    ...projects,
    ...archivedProposals.filter(
      (archivedProject) => !projects.some((project) => project.id === archivedProject.id),
    ),
  ]
    .filter((project) => project.currentProjectClassification === 'Major project')
    .map((project) => ({
      id: project.id,
      href: `/ppm/projects/${project.id}`,
      deliveryStatus: project.deliveryStatus,
      name: project.name,
      stage: project.stage,
      executiveSponsor: project.executiveSponsor || '-',
      businessOwner: project.businessOwner || '-',
      estimatedCost: project.estimatedCost || '-',
      targetStart: project.targetStartQuarter || '-',
      operationalInitiativeTitle: project.operationalInitiativeTitle || '-',
      strategicPriorityTitle: project.strategicPriorityTitle || project.strategicAlignment || '-',
    }))
    .sort((left, right) => String(left.id ?? '').localeCompare(String(right.id ?? '')));
}

function buildInitiativeItems(projects, operationalInitiatives) {
  return operationalInitiatives.map((initiative) => {
    const currentHealth = getInitiativeCurrentHealth(initiative, projects);

    return {
      id: initiative.id,
      href: `/ppm/operational-initiatives/${initiative.id}`,
      deliveryStatus: currentHealth.overall,
      name: initiative.title,
      stage: getInitiativeStage(initiative.year),
      targetStart: String(initiative.year || '-'),
      strategicPriorityTitle: initiative.strategicPriorityTitle || '-',
    };
  })
    .sort((left, right) => String(left.id ?? '').localeCompare(String(right.id ?? '')));
}

function RegisterTable({ columns, emptyMessage, rows, renderRow }) {
  return (
    <div className="table-wrap">
      <table className="simple-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(renderRow)}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="muted">{emptyMessage}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function PortfolioRegisterPage() {
  const { projects, archivedProposals, currentProjects, operationalInitiatives } = usePpmProjects();
  const initiativeItems = useMemo(
    () => buildInitiativeItems(currentProjects, operationalInitiatives),
    [currentProjects, operationalInitiatives],
  );
  const majorProjectItems = useMemo(
    () => buildMajorProjectItems(projects, archivedProposals),
    [projects, archivedProposals],
  );

  return (
    <AppFrame
      title="Portfolio Register"
      description="Portfolio register split into annual operational initiatives and major projects."
      topNavActions={(
        <Link className="secondary-btn" to="/dashboard">
          <Icon name="dashboard" />
          Back To Dashboard
        </Link>
      )}
    >
      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="register" />Portfolio Register</h2>
          <div className="muted">{initiativeItems.length + majorProjectItems.length} item(s)</div>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-header-row">
            <h3>Initiatives</h3>
            <div className="muted">{initiativeItems.length} initiative(s)</div>
          </div>

          <RegisterTable
            columns={[
              'Delivery',
              'Portfolio ID',
              'Name',
              'Stage',
              'Year',
              'Strategic Priority',
            ]}
            emptyMessage="No initiatives are available yet."
            rows={initiativeItems}
            renderRow={(item) => {
              const delivery = getDeliveryIndicator(item.deliveryStatus);

              return (
                <tr key={`initiative-${item.id}`}>
                  <td>
                    <span className="status-indicator-cell" title={delivery.label}>
                      <span className={`status-indicator-dot ${delivery.tone}`} aria-hidden="true" />
                      <span>{delivery.label}</span>
                    </span>
                  </td>
                  <td>
                    <Link className="table-link" to={item.href}>
                      {item.id}
                    </Link>
                  </td>
                  <td>
                    {item.name}
                  </td>
                  <td>
                    <span className={`pill ${getStageTone(item.stage)}`}>{item.stage}</span>
                  </td>
                  <td>{item.targetStart}</td>
                  <td>{item.strategicPriorityTitle}</td>
                </tr>
              );
            }}
          />
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-header-row">
            <h3>Major Projects</h3>
            <div className="muted">{majorProjectItems.length} project(s)</div>
          </div>

          <RegisterTable
            columns={[
              'Delivery',
              'Portfolio ID',
              'Name',
              'Stage',
              'Executive Sponsor',
              'Business Owner',
              'Estimated Cost',
              'Target Start',
              'Annual Operational Initiative',
              'Strategic Priority',
            ]}
            emptyMessage="No major projects are available yet."
            rows={majorProjectItems}
            renderRow={(item) => {
              const delivery = getDeliveryIndicator(item.deliveryStatus);

              return (
                <tr key={`project-${item.id}`}>
                  <td>
                    <span className="status-indicator-cell" title={delivery.label}>
                      <span className={`status-indicator-dot ${delivery.tone}`} aria-hidden="true" />
                      <span>{delivery.label}</span>
                    </span>
                  </td>
                  <td>
                    <Link className="table-link" to={item.href}>
                      {item.id}
                    </Link>
                  </td>
                  <td>{item.name}</td>
                  <td>
                    <span className={`pill ${getStageTone(item.stage)}`}>{item.stage}</span>
                  </td>
                  <td>{item.executiveSponsor}</td>
                  <td>{item.businessOwner}</td>
                  <td>{item.estimatedCost}</td>
                  <td>{item.targetStart}</td>
                  <td>{item.operationalInitiativeTitle}</td>
                  <td>{item.strategicPriorityTitle}</td>
                </tr>
              );
            }}
          />
        </div>
      </section>
    </AppFrame>
  );
}
