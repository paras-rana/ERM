import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import pptxgen from 'pptxgenjs';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import PmoRiskDrawer from '../components/PmoRiskDrawer';
import { apiFetch } from '../lib/api';
import { usePpmProjects } from '../ppm/PpmProjectsContext';

const HEALTH_DIMENSIONS = ['scope', 'schedule', 'cost', 'quality', 'risk'];
const STATUS_OPTIONS = ['green', 'yellow', 'red'];

function getStatusSelectClass(value) {
  return `ppm-status-select tone-${value}`;
}

function getStatusSelectStyle(value) {
  if (value === 'green') {
    return {
      background: '#e9f8ee',
      borderColor: '#92d3a7',
      color: '#15693a',
    };
  }

  if (value === 'yellow') {
    return {
      background: '#fff5d8',
      borderColor: '#e7c562',
      color: '#8a5a00',
    };
  }

  if (value === 'red') {
    return {
      background: '#fde9ed',
      borderColor: '#e2a2b0',
      color: '#8f1f3c',
    };
  }

  return null;
}

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

function parseCost(value) {
  return Number(String(value ?? '').replace(/[^0-9.]/g, '')) || 0;
}

function formatMillions(value) {
  return `$${value.toFixed(1)}M`;
}

function formatMonthYearLabel(value) {
  const normalized = String(value ?? '').slice(0, 7);
  const parsed = new Date(`${normalized}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value || '-';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(parsed).replace(' ', '-');
}

function formatSlideDate(value) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized === '-') return '-';

  const parsed = new Date(normalized.length === 7 ? `${normalized}-01T00:00:00` : `${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return normalized;

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = String(parsed.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function getHealthColor(tone) {
  if (tone === 'green') return '2E9B56';
  if (tone === 'yellow') return 'D4A728';
  if (tone === 'red') return 'C74A5F';
  return '8B93A9';
}

function getHealthLabel(tone) {
  if (tone === 'red') return 'At Risk';
  if (tone === 'yellow') return 'Watch';
  if (tone === 'green') return 'On Track';
  return 'Not Started';
}

function getHealthPriority(tone) {
  if (tone === 'red') return 0;
  if (tone === 'yellow') return 1;
  if (tone === 'green') return 2;
  return 3;
}

function getNextMonthValue(value) {
  const normalized = String(value ?? '').slice(0, 7);
  const parsed = new Date(`${normalized}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 7);
  }

  parsed.setMonth(parsed.getMonth() + 1);
  return parsed.toISOString().slice(0, 7);
}

function getRiskBand(score) {
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getProjectHealth(project) {
  return PROJECT_HEALTH_BY_ID[project.id] ?? {
    scope: 'grey',
    schedule: 'grey',
    cost: 'grey',
    quality: 'grey',
    risk: 'grey',
  };
}

function buildInitiativeProgressForm(initiative, initiativeHealth) {
  const latestUpdate = Array.isArray(initiative.monthlyProgressUpdates) && initiative.monthlyProgressUpdates.length
    ? [...initiative.monthlyProgressUpdates].sort(
      (left, right) => String(right.month ?? '').localeCompare(String(left.month ?? '')),
    )[0]
    : null;

  return {
    month: latestUpdate?.month ? getNextMonthValue(latestUpdate.month) : new Date().toISOString().slice(0, 7),
    scopeStatus: latestUpdate?.scopeStatus ?? initiativeHealth.scope,
    scheduleStatus: latestUpdate?.scheduleStatus ?? initiativeHealth.schedule,
    costStatus: latestUpdate?.costStatus ?? initiativeHealth.cost,
    riskStatus: latestUpdate?.riskStatus ?? initiativeHealth.risk,
    qualityStatus: latestUpdate?.qualityStatus ?? initiativeHealth.quality,
    overallStatus: latestUpdate?.overallStatus ?? getOverallHealthTone(initiativeHealth),
    statusExplanation: '',
    accomplishments: ['', '', ''],
    commitments: ['', '', ''],
    milestoneChanges: '',
    decisionsNeeded: '',
    helpNeeded: '',
    notes: '',
  };
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
    const tone = relatedProjects.reduce((worst, project) => {
      const nextTone = getProjectHealth(project)[dimension];
      return getHealthPriority(nextTone) < getHealthPriority(worst) ? nextTone : worst;
    }, 'grey');

    return { ...health, [dimension]: tone };
  }, {});
}

function getOverallHealthTone(health) {
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'red')) return 'red';
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'yellow')) return 'yellow';
  if (HEALTH_DIMENSIONS.some((dimension) => health[dimension] === 'green')) return 'green';
  return 'grey';
}

function renderHealthCell(tone) {
  return (
    <span className="status-indicator-cell">
      <span className={`status-indicator-dot ${tone}`} aria-hidden="true" />
      <span>{getHealthLabel(tone)}</span>
    </span>
  );
}

function buildInitiativeOutcomes(initiative, relatedProjects) {
  const directOutcomes = relatedProjects.flatMap((project) => project.expectedOutcomes ?? []);
  const uniqueOutcomes = [...new Set(directOutcomes.filter(Boolean))];
  if (uniqueOutcomes.length) return uniqueOutcomes.slice(0, 6);

  return [
    `Advance delivery for ${initiative.title.toLowerCase()}.`,
    'Maintain visibility into initiative status, cost, and risk.',
    'Keep linked major projects aligned to the initiative outcome.',
  ];
}

function buildInitiativeTeam(initiative, relatedProjects) {
  const members = [
    ...relatedProjects.flatMap((project) => project.teamMembers ?? []),
    ...relatedProjects.map((project) => project.businessOwner),
  ].filter(Boolean);

  const uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length) return uniqueMembers;

  return ['Initiative Lead', 'Business Owner', 'PMO'];
}

function buildInitiativeDocuments(initiative, relatedProjects) {
  const documents = relatedProjects.flatMap((project) => (
    (project.documentVersions ?? [])
      .filter((document) => document.isCurrent)
      .map((document) => ({
        ...document,
        sourceProjectName: project.name,
      }))
  ));

  if (documents.length) {
    return documents.sort((left, right) => left.category.localeCompare(right.category));
  }

  const initiativeSlug = initiative.id.toLowerCase();
  return [
    {
      id: `${initiative.id}-charter`,
      category: 'Initiative Charter',
      versionNumber: 1,
      fileName: `${initiativeSlug}-charter.pdf`,
      comments: 'Initial initiative charter',
      uploadedAt: `${initiative.year}-01-15`,
      sourceProjectName: '-',
    },
    {
      id: `${initiative.id}-roadmap`,
      category: 'Roadmap',
      versionNumber: 1,
      fileName: `${initiativeSlug}-roadmap.pdf`,
      comments: 'Baseline initiative roadmap',
      uploadedAt: `${initiative.year}-01-20`,
      sourceProjectName: '-',
    },
  ];
}

function buildInitiativeMilestones(initiative) {
  const milestones = Array.isArray(initiative?.milestones)
    ? initiative.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title || 'Unnamed milestone',
        description: milestone.description || 'Initiative milestone',
        plannedDate: milestone.plannedDate || '-',
        actualDate: milestone.actualDate || '-',
        originalPlannedDate: milestone.originalPlannedDate || milestone.plannedDate || '',
        plannedDateChanged: Boolean(
          milestone.plannedDate
          && milestone.originalPlannedDate
          && milestone.plannedDate !== milestone.originalPlannedDate,
        ),
      }))
    : [];

  if (milestones.length) {
    return milestones.sort((left, right) => String(left.plannedDate).localeCompare(String(right.plannedDate)));
  }

  const fallbackYear = Number(initiative?.year) || new Date().getFullYear();
  return [
    {
      id: 'milestone-1',
      title: 'Initiative kickoff',
      description: 'Confirm scope, owners, and delivery plan for the initiative.',
      plannedDate: `${fallbackYear}-03-31`,
      actualDate: '-',
      originalPlannedDate: `${fallbackYear}-03-31`,
      plannedDateChanged: false,
    },
    {
      id: 'milestone-2',
      title: 'Mid-year review',
      description: 'Review status, costs, risks, and any scope adjustments.',
      plannedDate: `${fallbackYear}-06-30`,
      actualDate: '-',
      originalPlannedDate: `${fallbackYear}-06-30`,
      plannedDateChanged: false,
    },
    {
      id: 'milestone-3',
      title: 'Year-end closeout',
      description: 'Confirm results and close out the initiative year plan.',
      plannedDate: `${fallbackYear}-12-15`,
      actualDate: '-',
      originalPlannedDate: `${fallbackYear}-12-15`,
      plannedDateChanged: false,
    },
  ];
}

function buildInitiativeCostTracking(relatedProjects) {
  if (relatedProjects.length) {
    return relatedProjects.map((project) => {
      const budget = parseCost(project.estimatedCost);
      return {
        item: project.name,
        budget,
        actualToDate: Number((budget * 0.55).toFixed(2)),
        estimateAtCompletion: Number((budget * 1.04).toFixed(2)),
      };
    });
  }

  return [
    {
      item: 'Program coordination and management',
      budget: 0.35,
      actualToDate: 0.18,
      estimateAtCompletion: 0.36,
    },
    {
      item: 'Delivery support and reporting',
      budget: 0.25,
      actualToDate: 0.12,
      estimateAtCompletion: 0.24,
    },
  ];
}

function buildMonthlyUpdates(initiative, relatedProjects, milestones) {
  if (Array.isArray(initiative.monthlyProgressUpdates) && initiative.monthlyProgressUpdates.length) {
    return [...initiative.monthlyProgressUpdates]
      .sort((left, right) => String(right.month ?? '').localeCompare(String(left.month ?? '')))
      .map((update) => ({
        weekStart: `${update.month || initiative.year}-01`,
        monthLabel: formatMonthYearLabel(update.month || String(initiative.year ?? '')),
        cadence: 'monthly',
        plan: (update.commitments ?? []).filter(Boolean).slice(0, 3).join(' | ')
          || 'Next month commitments have not been recorded yet.',
        progress: (update.accomplishments ?? []).filter(Boolean).slice(0, 3).join(' | ')
          || update.statusExplanation
          || 'Monthly initiative progress has been recorded.',
        overallStatus: getHealthLabel(update.overallStatus),
        sourceProjectName: 'Initiative update',
        sourceUpdate: update,
      }));
  }

  const latestProjectUpdates = relatedProjects
    .flatMap((project) => (project.weeklyUpdates ?? [])
      .filter((entry) => (entry.cadence ?? 'weekly') === 'monthly')
      .map((entry) => ({
        ...entry,
        sourceProjectName: project.name,
        monthLabel: formatMonthYearLabel(String(entry.weekStart ?? '').slice(0, 7)),
      })))
    .sort((left, right) => String(right.weekStart).localeCompare(String(left.weekStart)));

  if (latestProjectUpdates.length) {
    return latestProjectUpdates.slice(0, 3);
  }

  return [
    {
      weekStart: `${initiative.year}-02-01`,
      monthLabel: formatMonthYearLabel(`${initiative.year}-02`),
      cadence: 'monthly',
      plan: milestones[0]?.title
        ? `Advance ${milestones[0].title.toLowerCase()} and align project owners on delivery priorities.`
        : 'Confirm initiative scope and delivery plan.',
      progress: `Initial coordination is underway for ${initiative.title.toLowerCase()}.`,
      overallStatus: 'On track',
      sourceProjectName: '-',
    },
    {
      weekStart: `${initiative.year}-03-01`,
      monthLabel: formatMonthYearLabel(`${initiative.year}-03`),
      cadence: 'monthly',
      plan: milestones[1]?.title
        ? `Prepare for ${milestones[1].title.toLowerCase()} and confirm risk mitigation actions.`
        : 'Continue execution and monitor health indicators.',
      progress: 'Current month progress will be recorded after review.',
      overallStatus: 'Pending update',
      sourceProjectName: '-',
    },
  ];
}

function buildInitiativeProgressPresentationData({
  initiative,
  selectedUpdate,
  monthlyUpdates,
  initiativeHealth,
  overallTone,
  owners,
  sortedInitiativeRisks,
  milestoneRows,
}) {
  const sortedProgressUpdates = Array.isArray(initiative.monthlyProgressUpdates) && initiative.monthlyProgressUpdates.length
    ? [...initiative.monthlyProgressUpdates].sort(
      (left, right) => String(right.month ?? '').localeCompare(String(left.month ?? '')),
    )
    : [];
  const latestSavedUpdate = sortedProgressUpdates[0] ?? null;
  const exportUpdate = selectedUpdate ?? latestSavedUpdate;
  const exportUpdateIndex = exportUpdate
    ? sortedProgressUpdates.findIndex((update) => update.month === exportUpdate.month)
    : -1;
  const priorUpdate = exportUpdateIndex >= 0 ? sortedProgressUpdates[exportUpdateIndex + 1] ?? null : sortedProgressUpdates[1] ?? null;
  const ownersText = owners.length ? owners.join(', ') : '-';
  const exportOverallTone = exportUpdate?.overallStatus ?? overallTone;
  const exportHealth = {
    scope: exportUpdate?.scopeStatus ?? initiativeHealth.scope,
    schedule: exportUpdate?.scheduleStatus ?? initiativeHealth.schedule,
    cost: exportUpdate?.costStatus ?? initiativeHealth.cost,
    risk: exportUpdate?.riskStatus ?? initiativeHealth.risk,
    quality: exportUpdate?.qualityStatus ?? initiativeHealth.quality,
  };
  const statusDimensions = [
    { label: 'Scope', tone: exportHealth.scope },
    { label: 'Schedule', tone: exportHealth.schedule },
    { label: 'Cost', tone: exportHealth.cost },
    { label: 'Risk', tone: exportHealth.risk },
    { label: 'Quality', tone: exportHealth.quality },
  ];
  const progressPeriodLabel = exportUpdate?.month
    ? formatMonthYearLabel(exportUpdate.month)
    : (monthlyUpdates[0]?.monthLabel || 'Current Month');
  const overallStatusSummary = exportUpdate?.statusExplanation
    || monthlyUpdates[0]?.progress
    || 'No monthly status summary has been recorded yet.';
  const progressBullets = exportUpdate?.accomplishments?.length
    ? exportUpdate.accomplishments.slice(0, 4)
    : (monthlyUpdates[0]?.progress ? [monthlyUpdates[0].progress] : ['No progress updates recorded this month.']);
  const commitmentBullets = exportUpdate?.commitments?.length
    ? exportUpdate.commitments.slice(0, 3)
    : (monthlyUpdates[0]?.plan ? [monthlyUpdates[0].plan] : ['No commitments recorded for next month.']);
  const priorCommitmentBullets = priorUpdate?.commitments?.length
    ? priorUpdate.commitments.slice(0, 3)
    : ['No commitments were recorded for the prior month.'];
  const riskLines = sortedInitiativeRisks.length > 0
    ? sortedInitiativeRisks.slice(0, 2).map((risk) => {
      const band = getRiskBand((risk.severity_score ?? 0) * (risk.probability_score ?? 0));
      const mitigation = risk.latest_mitigation || risk.response_plan || risk.mitigation_plan;
      const bandLabel = band === 'high' ? 'High' : band === 'medium' ? 'Moderate' : 'Low';
      return `${risk.risk_id}: ${risk.title} (${bandLabel}). ${mitigation || 'Mitigation plan to be confirmed.'}`;
    })
    : ['None.'];
  const decisionsNeededText = exportUpdate?.decisionsNeeded || 'None.';
  const helpNeededText = exportUpdate?.helpNeeded || 'None.';
  const additionalNotesText = exportUpdate?.notes || exportUpdate?.helpNeeded || 'None.';
  const milestonePreviewRows = milestoneRows.slice(0, 4).map((milestone) => ({
    ...milestone,
    plannedDateLabel: formatSlideDate(milestone.plannedDate),
    actualDateLabel: formatSlideDate(milestone.actualDate),
    tone: exportOverallTone,
  }));

  return {
    exportUpdate,
    exportOverallTone,
    ownersText,
    statusDimensions,
    progressPeriodLabel,
    overallStatusSummary,
    progressBullets,
    commitmentBullets,
    priorCommitmentBullets,
    riskLines,
    decisionsNeededText,
    helpNeededText,
    additionalNotesText,
    milestonePreviewRows,
  };
}

function buildProgressFormFromUpdate(update, initiativeHealth) {
  const accomplishments = Array.from({ length: 3 }, (_, index) => update?.accomplishments?.[index] ?? '');
  const commitments = Array.from({ length: 3 }, (_, index) => update?.commitments?.[index] ?? '');

  return {
    id: update?.id,
    createdAt: update?.createdAt,
    month: update?.month ?? new Date().toISOString().slice(0, 7),
    scopeStatus: update?.scopeStatus ?? initiativeHealth.scope,
    scheduleStatus: update?.scheduleStatus ?? initiativeHealth.schedule,
    costStatus: update?.costStatus ?? initiativeHealth.cost,
    riskStatus: update?.riskStatus ?? initiativeHealth.risk,
    qualityStatus: update?.qualityStatus ?? initiativeHealth.quality,
    overallStatus: update?.overallStatus ?? getOverallHealthTone(initiativeHealth),
    statusExplanation: update?.statusExplanation ?? '',
    accomplishments,
    commitments,
    milestoneChanges: update?.milestoneChanges ?? '',
    decisionsNeeded: update?.decisionsNeeded ?? '',
    helpNeeded: update?.helpNeeded ?? '',
    notes: update?.notes ?? '',
  };
}

function buildRowProgressActionTarget(update, overallTone) {
  return update.sourceUpdate ?? {
    month: String(update.weekStart ?? '').slice(0, 7),
    statusExplanation: update.progress,
    accomplishments: update.progress ? [update.progress] : [],
    commitments: update.plan ? [update.plan] : [],
    overallStatus: ['green', 'yellow', 'red'].includes(String(update.overallStatus ?? '').toLowerCase())
      ? String(update.overallStatus).toLowerCase()
      : overallTone,
  };
}

export default function OperationalInitiativeDetailPage() {
  const { initiativeId } = useParams();
  const { token, logout } = useAuth();
  const {
    operationalInitiatives,
    currentProjects,
    saveOperationalInitiativeMonthlyUpdate,
    saveOperationalInitiativeMilestones,
    saveOperationalInitiativeOwner,
  } = usePpmProjects();
  const [activeTab, setActiveTab] = useState('key-info');
  const [initiativeRisks, setInitiativeRisks] = useState([]);
  const [initiativeRisksLoading, setInitiativeRisksLoading] = useState(true);
  const [initiativeRisksError, setInitiativeRisksError] = useState('');
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [showRiskDrawer, setShowRiskDrawer] = useState(false);
  const [selectedProgressUpdate, setSelectedProgressUpdate] = useState(null);
  const [milestoneFormRows, setMilestoneFormRows] = useState([]);
  const [ownerFormText, setOwnerFormText] = useState('');
  const [openProgressActionsRow, setOpenProgressActionsRow] = useState(null);
  const progressActionsMenuRef = useRef(null);
  const initiative = operationalInitiatives.find((item) => item.id === initiativeId) ?? null;

  const relatedProjects = useMemo(
    () => currentProjects.filter(
      (project) => project.currentProjectClassification === 'Major project'
        && (
          project.operationalInitiativeId === initiativeId
          || project.operationalInitiativeTitle === initiative?.title
        ),
    ),
    [currentProjects, initiativeId, initiative?.title],
  );

  useEffect(() => {
    if (!initiative || !token) {
      setInitiativeRisks([]);
      setInitiativeRisksLoading(false);
      setInitiativeRisksError('');
      return;
    }

    async function loadInitiativeRisks() {
      try {
        setInitiativeRisksLoading(true);
        setInitiativeRisksError('');
        const response = await apiFetch('/risks', { token, onUnauthorized: logout });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const risks = await response.json();
        const linkedRiskTargets = new Set([initiative.id, ...relatedProjects.map((project) => project.id)]);
        setInitiativeRisks(
          risks.filter((risk) => linkedRiskTargets.has(risk.site_or_program)),
        );
      } catch (error) {
        setInitiativeRisksError(`Failed to load initiative risks: ${getErrorMessage(error)}`);
      } finally {
        setInitiativeRisksLoading(false);
      }
    }

    void loadInitiativeRisks();
  }, [initiative, relatedProjects, token, logout]);

  const initiativeHealth = buildInitiativeHealth(relatedProjects);
  const initiativeForForm = initiative ?? {
    monthlyProgressUpdates: [],
  };
  const overallTone = getOverallHealthTone(initiativeHealth);
  const rolledUpOwners = [...new Set(
    relatedProjects.map((project) => project.businessOwner?.trim()).filter(Boolean),
  )];
  const owners = initiative?.owner?.trim()
    ? [initiative.owner.trim()]
    : rolledUpOwners;
  const healthCards = [
    { label: 'Scope', tone: initiativeHealth.scope },
    { label: 'Schedule', tone: initiativeHealth.schedule },
    { label: 'Cost', tone: initiativeHealth.cost },
    { label: 'Risk', tone: initiativeHealth.risk },
    { label: 'Quality', tone: initiativeHealth.quality },
  ];
  const initiativeOutcomes = buildInitiativeOutcomes(initiative, relatedProjects);
  const initiativeTeam = buildInitiativeTeam(initiative, relatedProjects);
  const initiativeDocuments = buildInitiativeDocuments(initiative, relatedProjects);
  const milestoneRows = buildInitiativeMilestones(initiative);
  const monthlyUpdates = buildMonthlyUpdates(initiative, relatedProjects, milestoneRows);
  const sortedMonthlyProgressUpdates = Array.isArray(initiative.monthlyProgressUpdates) && initiative.monthlyProgressUpdates.length
    ? [...initiative.monthlyProgressUpdates].sort(
      (left, right) => String(right.month ?? '').localeCompare(String(left.month ?? '')),
    )
    : [];
  const latestMonthlyProgressUpdate = sortedMonthlyProgressUpdates[0] ?? null;
  const costTrackingRows = buildInitiativeCostTracking(relatedProjects);
  const costTrackingTotals = costTrackingRows.reduce(
    (totals, row) => ({
      budget: totals.budget + row.budget,
      actualToDate: totals.actualToDate + row.actualToDate,
      estimateAtCompletion: totals.estimateAtCompletion + row.estimateAtCompletion,
    }),
    { budget: 0, actualToDate: 0, estimateAtCompletion: 0 },
  );
  const sortedInitiativeRisks = [...initiativeRisks].sort(
    (left, right) => String(left.risk_id).localeCompare(String(right.risk_id)),
  );
  const nextProgressMonth = latestMonthlyProgressUpdate?.month
    ? getNextMonthValue(latestMonthlyProgressUpdate.month)
    : new Date().toISOString().slice(0, 7);
  const progressPresentation = buildInitiativeProgressPresentationData({
    initiative,
    selectedUpdate: selectedProgressUpdate,
    monthlyUpdates,
    initiativeHealth,
    overallTone,
    owners,
    sortedInitiativeRisks,
    milestoneRows,
  });
  const [progressForm, setProgressForm] = useState(() => buildInitiativeProgressForm(
    initiativeForForm,
    initiativeHealth,
  ));
  const priorCommitmentsReferenceUpdate = progressForm?.month
    ? sortedMonthlyProgressUpdates.find((update) => String(update.month ?? '') < String(progressForm.month))
    : latestMonthlyProgressUpdate;
  const priorCommitmentsReference = priorCommitmentsReferenceUpdate?.commitments?.length
    ? priorCommitmentsReferenceUpdate.commitments.slice(0, 3)
    : [];
  const priorCommitmentsReferenceLabel = priorCommitmentsReferenceUpdate?.month
    ? `Commitments From ${formatMonthYearLabel(priorCommitmentsReferenceUpdate.month)}`
    : 'Commitments From Last Month';

  useEffect(() => {
    if (!openProgressActionsRow) return undefined;

    function handlePointerDown(event) {
      if (!progressActionsMenuRef.current?.contains(event.target)) {
        setOpenProgressActionsRow(null);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openProgressActionsRow]);

  if (!initiative) {
    return <Navigate to="/ppm/operational-initiatives" replace />;
  }

  function openProgressUpdate() {
    setOpenProgressActionsRow(null);
    setSelectedProgressUpdate(null);
    setProgressForm({
      ...buildInitiativeProgressForm(initiative, initiativeHealth),
      month: nextProgressMonth,
    });
    setActiveOverlay('progress-update');
  }

  function openProgressEditor(update) {
    if (!update) return;

    setOpenProgressActionsRow(null);
    setSelectedProgressUpdate(update);
    setProgressForm(buildProgressFormFromUpdate(update, initiativeHealth));
    setActiveOverlay('progress-update');
  }

  function openProgressView(update) {
    setOpenProgressActionsRow(null);
    setSelectedProgressUpdate(update ?? null);
    setActiveOverlay('progress-view');
  }

  function toggleProgressActionsRow(rowKey) {
    setOpenProgressActionsRow((current) => (current === rowKey ? null : rowKey));
  }

  function openOwnerEditor() {
    setOwnerFormText(initiative.owner ?? '');
    setActiveOverlay('owner-edit');
  }

  function openMilestoneEditor() {
    setMilestoneFormRows(
      milestoneRows.map((milestone, index) => ({
        id: milestone.id || `AOI-MS-${initiative.id}-${index + 1}`,
        title: milestone.title || '',
        description: milestone.description || '',
        plannedDate: milestone.plannedDate && milestone.plannedDate !== '-' ? milestone.plannedDate : '',
        originalPlannedDate: milestone.originalPlannedDate || milestone.plannedDate || '',
        actualDate: milestone.actualDate && milestone.actualDate !== '-' ? milestone.actualDate : '',
      })),
    );
    setActiveOverlay('milestones-edit');
  }

  function handleRiskCreated(createdRisk) {
    setInitiativeRisks((current) => {
      const next = current.filter((risk) => risk.risk_id !== createdRisk.risk_id);
      return [...next, createdRisk];
    });
  }

  function updateMilestoneFormRow(rowId, field, value) {
    setMilestoneFormRows((current) => current.map((row) => (
      row.id === rowId ? { ...row, [field]: value } : row
    )));
  }

  function addMilestoneFormRow() {
    setMilestoneFormRows((current) => [
      ...current,
      {
        id: `MS-${initiative.id}-${Date.now()}-${current.length + 1}`,
        title: '',
        description: '',
        plannedDate: '',
        originalPlannedDate: '',
        actualDate: '',
      },
    ]);
  }

  function handleListFieldChange(listName, index, value) {
    setProgressForm((current) => ({
      ...current,
      [listName]: current[listName].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function submitProgressUpdate() {
    saveOperationalInitiativeMonthlyUpdate(initiative.id, {
      id: progressForm.id,
      createdAt: progressForm.createdAt,
      month: progressForm.month,
      scopeStatus: progressForm.scopeStatus,
      scheduleStatus: progressForm.scheduleStatus,
      costStatus: progressForm.costStatus,
      riskStatus: progressForm.riskStatus,
      qualityStatus: progressForm.qualityStatus,
      overallStatus: progressForm.overallStatus,
      statusExplanation: progressForm.statusExplanation.trim(),
      accomplishments: progressForm.accomplishments.map((value) => value.trim()).filter(Boolean).slice(0, 3),
      commitments: progressForm.commitments.map((value) => value.trim()).filter(Boolean).slice(0, 3),
      milestoneChanges: progressForm.milestoneChanges.trim(),
      decisionsNeeded: progressForm.decisionsNeeded.trim(),
      helpNeeded: progressForm.helpNeeded.trim(),
      notes: progressForm.notes.trim(),
    });
    setActiveOverlay(null);
  }

  function submitMilestones() {
    saveOperationalInitiativeMilestones(initiative.id, milestoneFormRows);
    setActiveOverlay(null);
  }

  function submitOwner() {
    saveOperationalInitiativeOwner(initiative.id, ownerFormText);
    setActiveOverlay(null);
  }

  async function exportInitiativeSlide(selectedUpdate = null) {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'OpenAI Codex';
    pptx.company = 'Risk App';
    pptx.subject = `${initiative.id} initiative summary`;
    pptx.title = `${initiative.id} | ${initiative.title}`;
    const slide = pptx.addSlide();
    const commitmentsSlide = pptx.addSlide();
    const panelFill = 'FFFFFF';
    const panelBorder = 'D9E2EC';
    const {
      exportUpdate,
      exportOverallTone,
      ownersText,
      statusDimensions,
      progressPeriodLabel,
      overallStatusSummary,
      progressBullets,
      commitmentBullets,
      priorCommitmentBullets,
      riskLines,
      decisionsNeededText,
      helpNeededText,
      additionalNotesText,
      milestonePreviewRows,
    } = buildInitiativeProgressPresentationData({
      initiative,
      selectedUpdate,
      monthlyUpdates,
      initiativeHealth,
      overallTone,
      owners,
      sortedInitiativeRisks,
      milestoneRows,
    });
    const renderBullets = (items) => items.map((item) => ({
      text: item,
      options: { bullet: { indent: 14 } },
    }));
    const drawPanel = ({ x, y, w, h, title }) => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w,
        h,
        rectRadius: 0.04,
        line: { color: panelBorder, pt: 1 },
        fill: { color: panelFill },
      });
      slide.addText(title, {
        x: x + 0.18,
        y: y + 0.12,
        w: w - 0.36,
        h: 0.2,
        fontFace: 'Aptos',
        fontSize: 11,
        bold: true,
        color: '163A5F',
      });
    };
    const drawPanelOnSlide = (targetSlide, { x, y, w, h, title }) => {
      targetSlide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w,
        h,
        rectRadius: 0.04,
        line: { color: panelBorder, pt: 1 },
        fill: { color: panelFill },
      });
      targetSlide.addText(title, {
        x: x + 0.18,
        y: y + 0.12,
        w: w - 0.36,
        h: 0.2,
        fontFace: 'Aptos',
        fontSize: 11,
        bold: true,
        color: '163A5F',
      });
    };
    const drawStatusDot = ({ tone, x, y, size = 0.14 }) => {
      const color = getHealthColor(tone);
      slide.addShape(pptx.ShapeType.ellipse, {
        x,
        y,
        w: size,
        h: size,
        line: { color, pt: 1 },
        fill: { color },
      });
    };
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.56,
      y: 0.35,
      w: 0.44,
      h: 0.44,
      line: { color: getHealthColor(exportOverallTone), pt: 1 },
      fill: { color: getHealthColor(exportOverallTone) },
    });
    slide.addText(`${initiative.id} | ${initiative.title}`, {
      x: 1.08,
      y: 0.4,
      w: 7.98,
      h: 0.34,
      fontFace: 'Aptos',
      fontSize: 20,
      bold: true,
      color: '102A43',
    });
    slide.addText(progressPeriodLabel, {
      x: 10.1,
      y: 0.38,
      w: 2.6,
      h: 0.2,
      fontFace: 'Aptos',
      fontSize: 12,
      bold: true,
      color: '486581',
      align: 'right',
    });
    slide.addText(`Owner: ${ownersText}`, {
      x: 9.45,
      y: 0.7,
      w: 3.25,
      h: 0.2,
      fontFace: 'Aptos',
      fontSize: 10.5,
      color: '627D98',
      align: 'right',
    });

    drawPanel({ x: 0.6, y: 1.08, w: 12.1, h: 1.15, title: 'STATUS SUMMARY' });
    statusDimensions.forEach((dimension, index) => {
      const startX = 0.82 + (index * 2.25);
      slide.addText(`${dimension.label}`, {
        x: startX,
        y: 1.43,
        w: 0.92,
        h: 0.18,
        fontFace: 'Aptos',
        fontSize: 10,
        bold: true,
        color: '486581',
      });
      drawStatusDot({
        tone: dimension.tone,
        x: startX + 1.03,
        y: 1.45,
        size: 0.12,
      });
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 0.82,
      y: 1.64,
      w: 11.3,
      h: 0,
      line: { color: 'D9E2EC', pt: 1 },
    });
    slide.addText(overallStatusSummary, {
      x: 0.82,
      y: 1.72,
      w: 11.55,
      h: 0.28,
      fontFace: 'Aptos',
      fontSize: 11.5,
      color: '243B53',
      margin: 0.01,
      fit: 'shrink',
    });

    drawPanel({ x: 0.6, y: 2.28, w: 3.92, h: 2.34, title: 'COMMITMENTS MADE LAST MONTH' });
    slide.addText(renderBullets(priorCommitmentBullets), {
      x: 0.78,
      y: 2.66,
      w: 3.56,
      h: 1.7,
      fontFace: 'Aptos',
      fontSize: 10.6,
      color: '243B53',
      breakLine: true,
      margin: 0.02,
      fit: 'shrink',
      valign: 'top',
    });

    drawPanel({ x: 4.69, y: 2.28, w: 3.92, h: 2.34, title: 'PROGRESS THIS MONTH' });
    slide.addText(renderBullets(progressBullets), {
      x: 4.87,
      y: 2.66,
      w: 3.56,
      h: 1.7,
      fontFace: 'Aptos',
      fontSize: 10.6,
      color: '243B53',
      breakLine: true,
      margin: 0.02,
      fit: 'shrink',
      valign: 'top',
    });

    drawPanel({ x: 8.78, y: 2.28, w: 3.92, h: 2.34, title: 'MILESTONE SNAPSHOT' });
    slide.addText('', {
      x: 8.98,
      y: 2.64,
      w: 0.16,
      h: 0.18,
      fontFace: 'Aptos',
      fontSize: 8,
      bold: true,
      color: '486581',
      align: 'center',
    });
    slide.addText('Milestone', {
      x: 9.16,
      y: 2.64,
      w: 2.04,
      h: 0.18,
      fontFace: 'Aptos',
      fontSize: 8,
      bold: true,
      color: '486581',
    });
    slide.addText('Due', {
      x: 11.28,
      y: 2.64,
      w: 0.54,
      h: 0.18,
      fontFace: 'Aptos',
      fontSize: 8,
      bold: true,
      color: '486581',
      align: 'center',
    });
    slide.addText('Actual', {
      x: 11.9,
      y: 2.64,
      w: 0.56,
      h: 0.18,
      fontFace: 'Aptos',
      fontSize: 8,
      bold: true,
      color: '486581',
      align: 'center',
    });
    milestonePreviewRows.forEach((milestone, index) => {
      const rowY = 2.9 + (index * 0.34);
      drawStatusDot({
        tone: milestone.tone,
        x: 9.02,
        y: rowY + 0.05,
        size: 0.09,
      });
      slide.addText(milestone.title, {
        x: 9.16,
        y: rowY,
        w: 2.04,
        h: 0.2,
        fontFace: 'Aptos',
        fontSize: 7.5,
        color: '243B53',
        margin: 0.01,
        fit: 'shrink',
      });
      slide.addText(milestone.plannedDateLabel || '-', {
        x: 11.28,
        y: rowY,
        w: 0.54,
        h: 0.2,
        fontFace: 'Aptos',
        fontSize: 7.4,
        color: '243B53',
        align: 'center',
        margin: 0.01,
      });
      slide.addText(milestone.actualDateLabel || '-', {
        x: 11.9,
        y: rowY,
        w: 0.56,
        h: 0.2,
        fontFace: 'Aptos',
        fontSize: 7.4,
        color: '243B53',
        align: 'center',
        margin: 0.01,
      });
    });

    drawPanel({ x: 0.6, y: 4.82, w: 5.9, h: 1.05, title: 'DECISIONS NEEDED FROM LEADERSHIP' });
    slide.addText(decisionsNeededText, {
      x: 0.84,
      y: 5.18,
      w: 5.36,
      h: 0.44,
      fontFace: 'Aptos',
      fontSize: 10.8,
      color: '243B53',
      margin: 0.01,
      fit: 'shrink',
      valign: 'top',
    });
    drawPanel({ x: 6.8, y: 4.82, w: 5.9, h: 1.05, title: 'HELP NEEDED' });
    slide.addText(helpNeededText, {
      x: 7.04,
      y: 5.18,
      w: 5.36,
      h: 0.44,
      fontFace: 'Aptos',
      fontSize: 10.8,
      color: '243B53',
      margin: 0.01,
      fit: 'shrink',
      valign: 'top',
    });

    drawPanelOnSlide(commitmentsSlide, { x: 0.6, y: 1.08, w: 5.9, h: 3.15, title: 'RISKS' });
    commitmentsSlide.addText(renderBullets(riskLines), {
      x: 0.9,
      y: 1.52,
      w: 5.15,
      h: 2.2,
      fontFace: 'Aptos',
      fontSize: 12.5,
      color: '243B53',
      breakLine: true,
      margin: 0.02,
      fit: 'shrink',
      valign: 'top',
    });
    drawPanelOnSlide(commitmentsSlide, { x: 6.8, y: 1.08, w: 5.9, h: 3.15, title: 'NEXT MONTH\'S COMMITMENTS' });
    commitmentsSlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.56,
      y: 0.35,
      w: 0.44,
      h: 0.44,
      line: { color: getHealthColor(exportOverallTone), pt: 1 },
      fill: { color: getHealthColor(exportOverallTone) },
    });
    commitmentsSlide.addText(`${initiative.id} | ${initiative.title}`, {
      x: 1.08,
      y: 0.4,
      w: 7.98,
      h: 0.34,
      fontFace: 'Aptos',
      fontSize: 20,
      bold: true,
      color: '102A43',
    });
    commitmentsSlide.addText(progressPeriodLabel, {
      x: 10.1,
      y: 0.38,
      w: 2.6,
      h: 0.2,
      fontFace: 'Aptos',
      fontSize: 12,
      bold: true,
      color: '486581',
      align: 'right',
    });
    commitmentsSlide.addText(`Owner: ${ownersText}`, {
      x: 9.45,
      y: 0.7,
      w: 3.25,
      h: 0.2,
      fontFace: 'Aptos',
      fontSize: 10.5,
      color: '627D98',
      align: 'right',
    });
    commitmentsSlide.addText(renderBullets(commitmentBullets), {
      x: 7.1,
      y: 1.52,
      w: 5.1,
      h: 2.35,
      fontFace: 'Aptos',
      fontSize: 14,
      color: '243B53',
      breakLine: true,
      margin: 0.02,
      fit: 'shrink',
      valign: 'top',
    });
    drawPanelOnSlide(commitmentsSlide, { x: 0.6, y: 4.45, w: 12.1, h: 1.45, title: 'ADDITIONAL NOTES' });
    commitmentsSlide.addText(additionalNotesText, {
      x: 0.9,
      y: 4.88,
      w: 11.2,
      h: 0.72,
      fontFace: 'Aptos',
      fontSize: 11.5,
      color: '243B53',
      margin: 0.01,
      fit: 'shrink',
      valign: 'top',
    });

    const safePeriod = String(exportUpdate?.month || 'latest').replace(/[^0-9A-Za-z-]/g, '-');
    try {
      await pptx.writeFile({ fileName: `${initiative.id}-initiative-summary-${safePeriod}.pptx` });
    } catch (error) {
      console.error('Initiative slide export failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      window.alert(`Unable to export initiative slide deck: ${message}`);
    }
  }

  const overlay =
    typeof document !== 'undefined'
        ? createPortal(
          <div
            className={`drawer-overlay ${activeOverlay ? 'open' : ''} ${(activeOverlay === 'progress-update' || activeOverlay === 'progress-view') ? 'modal-overlay' : ''}`}
            onClick={() => setActiveOverlay(null)}
          >
            <aside
              className={`drawer-panel ${activeOverlay ? 'open' : ''} ${(activeOverlay === 'progress-update' || activeOverlay === 'progress-view') ? 'progress-update-modal' : ''} ${activeOverlay === 'milestones-edit' ? 'milestone-edit-drawer' : ''}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="drawer-header">
                <h2>
                  {activeOverlay === 'milestones-edit'
                    ? 'Edit Milestones'
                    : activeOverlay === 'owner-edit'
                      ? 'Edit Owner'
                      : activeOverlay === 'progress-view'
                        ? `Progress Update | ${progressPresentation.progressPeriodLabel}`
                        : selectedProgressUpdate?.month
                          ? `Edit Progress Update | ${formatMonthYearLabel(selectedProgressUpdate.month)}`
                          : 'Progress Update'}
                </h2>
                <button type="button" className="icon-btn" onClick={() => setActiveOverlay(null)}>
                  x
                </button>
              </div>

              {activeOverlay === 'progress-update' ? (
                <form
                  className="risk-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitProgressUpdate();
                  }}
                >
                  <div className="form-grid single-column">
                    <label>
                      Reporting Month
                      <input
                        type="month"
                        value={progressForm.month}
                        readOnly
                      />
                    </label>
                    <p className="muted">
                      {selectedProgressUpdate?.month
                        ? 'You are editing a saved monthly update. Save again to keep working on the same reporting month.'
                        : 'Progress updates are limited to one entry per month. The next available month is selected automatically.'}
                    </p>

                    <label className="ppm-status-featured-field">
                      Overall Project Status
                      <select
                        className={`${getStatusSelectClass(progressForm.overallStatus)} ppm-status-featured-select`}
                        style={getStatusSelectStyle(progressForm.overallStatus)}
                        value={progressForm.overallStatus}
                        onChange={(event) => setProgressForm((current) => ({
                          ...current,
                          overallStatus: event.target.value,
                        }))}
                      >
                        {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>

                    <div className="two-col-row">
                      <label>
                        Scope
                        <select
                          className={getStatusSelectClass(progressForm.scopeStatus)}
                          style={getStatusSelectStyle(progressForm.scopeStatus)}
                          value={progressForm.scopeStatus}
                          onChange={(event) => setProgressForm((current) => ({
                            ...current,
                            scopeStatus: event.target.value,
                          }))}
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label>
                        Schedule
                        <select
                          className={getStatusSelectClass(progressForm.scheduleStatus)}
                          style={getStatusSelectStyle(progressForm.scheduleStatus)}
                          value={progressForm.scheduleStatus}
                          onChange={(event) => setProgressForm((current) => ({
                            ...current,
                            scheduleStatus: event.target.value,
                          }))}
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="two-col-row">
                      <label>
                        Cost
                        <select
                          className={getStatusSelectClass(progressForm.costStatus)}
                          style={getStatusSelectStyle(progressForm.costStatus)}
                          value={progressForm.costStatus}
                          onChange={(event) => setProgressForm((current) => ({
                            ...current,
                            costStatus: event.target.value,
                          }))}
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label>
                        Risk
                        <select
                          className={getStatusSelectClass(progressForm.riskStatus)}
                          style={getStatusSelectStyle(progressForm.riskStatus)}
                          value={progressForm.riskStatus}
                          onChange={(event) => setProgressForm((current) => ({
                            ...current,
                            riskStatus: event.target.value,
                          }))}
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="two-col-row">
                      <label>
                        Quality
                        <select
                          className={getStatusSelectClass(progressForm.qualityStatus)}
                          style={getStatusSelectStyle(progressForm.qualityStatus)}
                          value={progressForm.qualityStatus}
                          onChange={(event) => setProgressForm((current) => ({
                            ...current,
                            qualityStatus: event.target.value,
                          }))}
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    </div>

                    <label>
                      Status Explanation
                      <textarea
                        rows={4}
                        value={progressForm.statusExplanation}
                        onChange={(event) => setProgressForm((current) => ({
                          ...current,
                          statusExplanation: event.target.value,
                        }))}
                      />
                    </label>

                    <div className="two-col-row progress-reference-row">
                      <div className="detail-block progress-reference-block">
                        <h3>{priorCommitmentsReferenceLabel}</h3>
                        {priorCommitmentsReference.length ? (
                          <div className="progress-reference-list" aria-label={priorCommitmentsReferenceLabel}>
                            {priorCommitmentsReference.map((item, index) => (
                              <div key={`prior-commitment-${index}`} className="progress-reference-item">
                                <span className="progress-reference-bullet" aria-hidden="true" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted">No commitments from the last reported month.</p>
                        )}
                      </div>

                      <div className="detail-block">
                        <h3>Top 3 Accomplishments This Month</h3>
                        {progressForm.accomplishments.map((value, index) => (
                          <label key={`accomplishment-${index}`}>
                            <textarea
                              rows={2}
                              value={value}
                              onChange={(event) => handleListFieldChange('accomplishments', index, event.target.value)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="detail-block">
                      <h3>Top 3 Commitments For Next Month</h3>
                      {progressForm.commitments.map((value, index) => (
                        <label key={`commitment-${index}`}>
                          <textarea
                            rows={2}
                            value={value}
                            onChange={(event) => handleListFieldChange('commitments', index, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>

                    <label>
                      Narrative Explanation On Any Changes To Milestones
                      <textarea
                        rows={3}
                        value={progressForm.milestoneChanges}
                        onChange={(event) => setProgressForm((current) => ({
                          ...current,
                          milestoneChanges: event.target.value,
                        }))}
                      />
                    </label>

                    <label>
                      Decisions Needed
                      <textarea
                        rows={3}
                        value={progressForm.decisionsNeeded}
                        onChange={(event) => setProgressForm((current) => ({
                          ...current,
                          decisionsNeeded: event.target.value,
                        }))}
                      />
                    </label>

                    <label>
                      Help Needed
                      <textarea
                        rows={3}
                        value={progressForm.helpNeeded}
                        onChange={(event) => setProgressForm((current) => ({
                          ...current,
                          helpNeeded: event.target.value,
                        }))}
                      />
                    </label>

                    <label>
                      Notes
                      <textarea
                        rows={4}
                        value={progressForm.notes}
                        onChange={(event) => setProgressForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))}
                      />
                    </label>
                  </div>

                  <div className="drawer-actions">
                    <button type="button" className="secondary-btn" onClick={() => setActiveOverlay(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      {selectedProgressUpdate?.month ? 'Save Changes' : 'Save Update'}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeOverlay === 'progress-view' ? (
                <div className="risk-form progress-view-sheet">
                  <div className="form-grid single-column progress-view-grid">
                    <section className="detail-block progress-view-hero">
                      <div className="progress-view-hero-row">
                        <div className="progress-view-title-block">
                          <div className="progress-view-kicker">Monthly Progress Update</div>
                          <div className="progress-view-title-row">
                            <span
                              className={`status-indicator-dot ${progressPresentation.exportOverallTone} progress-view-title-dot`}
                              aria-hidden="true"
                            />
                            <div>
                              <h3>{initiative.title}</h3>
                              <div className="progress-view-title-meta">
                                <span>{initiative.id}</span>
                                <span className="progress-view-title-divider">|</span>
                                <span className="status-indicator-cell">
                                  <span className={`status-indicator-dot ${progressPresentation.exportOverallTone}`} aria-hidden="true" />
                                  <span>{getHealthLabel(progressPresentation.exportOverallTone)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="progress-view-meta">
                          <div className="progress-view-meta-item">
                            <span className="progress-view-meta-label">Reporting Period</span>
                            <span className="progress-view-meta-value">{progressPresentation.progressPeriodLabel}</span>
                          </div>
                          <div className="progress-view-meta-item">
                            <span className="progress-view-meta-label">Owner</span>
                            <span className="progress-view-meta-value">{progressPresentation.ownersText}</span>
                          </div>
                        </div>
                      </div>
                      <div className="progress-status-row">
                        {progressPresentation.statusDimensions.map((dimension) => (
                          <div key={dimension.label} className="ppm-status-featured-field progress-status-card">
                            <span className="project-health-header">
                              <span className={`status-indicator-dot ${dimension.tone}`} aria-hidden="true" />
                              <span>{dimension.label}</span>
                            </span>
                            <div className={`project-health-value tone-${dimension.tone}`}>
                              {getHealthLabel(dimension.tone)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="progress-view-summary">
                        <div className="progress-view-section-label">Summary</div>
                        <p className="ppm-field-note">{progressPresentation.overallStatusSummary}</p>
                      </div>
                    </section>

                    <div className="two-col-row progress-reference-row progress-view-pair">
                      <section className="detail-block progress-reference-block progress-view-card">
                        <div className="progress-view-section-label">Reference</div>
                        <h3>Commitments Made Last Month</h3>
                        <div className="progress-reference-list">
                          {progressPresentation.priorCommitmentBullets.map((item, index) => (
                            <div key={`prior-progress-${index}`} className="progress-reference-item">
                              <span className="progress-reference-bullet" aria-hidden="true" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="detail-block progress-view-card">
                        <div className="progress-view-section-label">Delivery</div>
                        <h3>Progress This Month</h3>
                        <div className="progress-reference-list">
                          {progressPresentation.progressBullets.map((item, index) => (
                            <div key={`progress-${index}`} className="progress-reference-item">
                              <span className="progress-reference-bullet" aria-hidden="true" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="two-col-row progress-reference-row progress-view-pair">
                      <section className="detail-block progress-view-card">
                        <div className="progress-view-section-label">Risk</div>
                        <h3>Risks</h3>
                        <div className="progress-reference-list">
                          {progressPresentation.riskLines.map((item, index) => (
                            <div key={`risk-line-${index}`} className="progress-reference-item">
                              <span className="progress-reference-bullet" aria-hidden="true" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="detail-block progress-view-card">
                        <div className="progress-view-section-label">Forward Look</div>
                        <h3>Next Month&apos;s Commitments</h3>
                        <div className="progress-reference-list">
                          {progressPresentation.commitmentBullets.map((item, index) => (
                            <div key={`commitment-line-${index}`} className="progress-reference-item">
                              <span className="progress-reference-bullet" aria-hidden="true" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <section className="detail-block progress-view-card">
                      <div className="progress-view-section-label">Milestones</div>
                      <h3>Milestone Snapshot</h3>
                      <div className="table-wrap progress-view-table-wrap">
                        <table className="simple-table">
                          <thead>
                            <tr>
                              <th aria-label="Status" />
                              <th>Milestone</th>
                              <th>Due</th>
                              <th>Actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {progressPresentation.milestonePreviewRows.map((milestone) => (
                              <tr key={milestone.id}>
                                <td className="progress-view-milestone-status-cell">
                                  <span
                                    className={`status-indicator-dot ${milestone.tone} progress-view-milestone-dot`}
                                    aria-label={`${getHealthLabel(milestone.tone)} status`}
                                  />
                                </td>
                                <td>{milestone.title}</td>
                                <td>{milestone.plannedDateLabel}</td>
                                <td>{milestone.actualDateLabel}</td>
                              </tr>
                            ))}
                            {progressPresentation.milestonePreviewRows.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="muted">No milestone snapshot is available.</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <div className="two-col-row progress-reference-row progress-view-pair">
                      <section className="detail-block progress-view-card">
                        <div className="progress-view-section-label">Decision</div>
                        <h3>Decisions Needed</h3>
                        <p className="ppm-field-note">{progressPresentation.decisionsNeededText}</p>
                      </section>
                      <section className="detail-block progress-view-card">
                        <div className="progress-view-section-label">Support</div>
                        <h3>Help Needed</h3>
                        <p className="ppm-field-note">{progressPresentation.helpNeededText}</p>
                      </section>
                    </div>

                    <section className="detail-block progress-view-card">
                      <div className="progress-view-section-label">Notes</div>
                      <h3>Additional Notes</h3>
                      <p className="ppm-field-note">{progressPresentation.additionalNotesText}</p>
                    </section>
                  </div>

                  <div className="drawer-actions">
                    <button type="button" className="secondary-btn" onClick={() => setActiveOverlay(null)}>
                      Close
                    </button>
                    {progressPresentation.exportUpdate?.id ? (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openProgressEditor(progressPresentation.exportUpdate)}
                      >
                        Edit Update
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => void exportInitiativeSlide(progressPresentation.exportUpdate ?? null)}
                    >
                      Export Slide
                    </button>
                  </div>
                </div>
              ) : null}

              {activeOverlay === 'milestones-edit' ? (
                <form
                  className="risk-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitMilestones();
                  }}
                >
                  <div className="detail-actions-row milestone-form-actions">
                    <p className="muted">
                      Add initiative milestones, change planned dates, and record completion dates.
                    </p>
                    <button type="button" className="secondary-btn" onClick={addMilestoneFormRow}>
                      <Icon name="plus" />
                      Add Milestone
                    </button>
                  </div>

                  <div className="form-grid single-column">
                    {milestoneFormRows.map((milestone) => (
                      <div key={milestone.id} className="detail-block milestone-editor-card">
                        {milestone.originalPlannedDate && milestone.plannedDate && milestone.plannedDate !== milestone.originalPlannedDate ? (
                          <div className="detail-actions-row">
                            <span className="pill changed">Planned date changed</span>
                          </div>
                        ) : null}

                        <div className="milestone-editor-row">
                          <label>
                            Title
                            <input
                              value={milestone.title}
                              onChange={(event) => updateMilestoneFormRow(milestone.id, 'title', event.target.value)}
                              placeholder="Enter milestone title"
                            />
                          </label>

                          <label>
                            Description
                            <input
                              value={milestone.description}
                              onChange={(event) => updateMilestoneFormRow(milestone.id, 'description', event.target.value)}
                              placeholder="Enter milestone description"
                            />
                          </label>

                          <label>
                            Planned Date
                            <input
                              type="date"
                              value={milestone.plannedDate}
                              onChange={(event) => updateMilestoneFormRow(milestone.id, 'plannedDate', event.target.value)}
                            />
                          </label>

                          <label>
                            Actual Date
                            <input
                              type="date"
                              value={milestone.actualDate}
                              onChange={(event) => updateMilestoneFormRow(milestone.id, 'actualDate', event.target.value)}
                            />
                          </label>
                        </div>
                      </div>
                    ))}

                    {milestoneFormRows.length === 0 ? (
                      <p className="muted">No linked milestones yet. Add one and assign it to a major project.</p>
                    ) : null}
                  </div>

                  <div className="drawer-actions">
                    <button type="button" className="secondary-btn" onClick={() => setActiveOverlay(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      Save Milestones
                    </button>
                  </div>
                </form>
              ) : null}

              {activeOverlay === 'owner-edit' ? (
                <form
                  className="risk-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitOwner();
                  }}
                >
                  <div className="form-grid single-column">
                    <label>
                      Initiative Owner
                      <input
                        value={ownerFormText}
                        onChange={(event) => setOwnerFormText(event.target.value)}
                        placeholder="Enter initiative owner"
                      />
                    </label>
                    <p className="muted">
                      Leave blank to fall back to the owners rolled up from linked major projects.
                    </p>
                  </div>

                  <div className="drawer-actions">
                    <button type="button" className="secondary-btn" onClick={() => setActiveOverlay(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      Save Owner
                    </button>
                  </div>
                </form>
              ) : null}
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <AppFrame
      title={initiative.title}
      description={initiative.description || 'Operational initiative detail and linked major project rollup.'}
      detailLabel={(
        <span className="project-title-with-status">
          <span className={`status-indicator-dot ${overallTone}`} aria-hidden="true" />
          <span>{initiative.id}</span>
        </span>
      )}
      topNavActions={(
        <div className="project-header-meta">
          <div className="project-header-meta-item">
            <div className="project-header-meta-label">Year</div>
            <div className="project-header-meta-value">{initiative.year || '-'}</div>
          </div>
          <div className="project-header-meta-item">
            <div className="project-header-meta-label">Owner</div>
            <div className="project-header-meta-value">{owners.length ? owners.join(', ') : '-'}</div>
          </div>
          <div className="project-header-meta-item">
            <button type="button" className="secondary-btn" onClick={openOwnerEditor}>
              Edit Owner
            </button>
          </div>
        </div>
      )}
    >
      <section className="panel">
        <div className="project-health-grid">
          {healthCards.map((card) => (
            <article key={card.label} className="card project-health-card">
              <div className="project-health-header">
                <span className={`status-indicator-dot ${card.tone}`} aria-hidden="true" />
                <div className="label">{card.label}</div>
              </div>
              <div className={`value project-health-value tone-${card.tone}`}>
                {getHealthLabel(card.tone)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="project-tab-row" role="tablist" aria-label="Initiative detail tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'key-info'}
            className={`project-tab ${activeTab === 'key-info' ? 'active' : ''}`}
            onClick={() => setActiveTab('key-info')}
          >
            Key Information
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'outcomes'}
            className={`project-tab ${activeTab === 'outcomes' ? 'active' : ''}`}
            onClick={() => setActiveTab('outcomes')}
          >
            Outcomes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'team'}
            className={`project-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'documents'}
            className={`project-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Project Documents
          </button>
        </div>

        {activeTab === 'key-info' ? (
          <>
            <div className="project-info-card-row">
              <article className="card project-info-card">
                <div className="label">Initiative Overview</div>
                <div className="value">{initiative.description || '-'}</div>
              </article>
              <article className="card project-info-card">
                <div className="label">Strategic Priority</div>
                <div className="value">{initiative.strategicPriorityTitle || '-'}</div>
              </article>
              <article className="card project-info-card">
                <div className="label">Rolled-Up Budget</div>
                <div className="value">{formatMillions(costTrackingTotals.budget)}</div>
              </article>
            </div>
          </>
        ) : null}

        {activeTab === 'outcomes' ? (
          <>
            <div className="detail-block">
              <ul className="ppm-inline-list">
                {initiativeOutcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {activeTab === 'team' ? (
          <>
            <div className="detail-block">
              <ul className="ppm-inline-list">
                {initiativeTeam.map((member) => (
                  <li key={member}>{member}</li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {activeTab === 'documents' ? (
          <>
            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>File Name</th>
                    <th>Comments</th>
                    <th>Version</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {initiativeDocuments.map((document) => (
                    <tr key={`${document.id}-${document.fileName}`}>
                      <td>{document.category}</td>
                      <td>{document.fileName}</td>
                      <td>{document.comments || '-'}</td>
                      <td>v{document.versionNumber}</td>
                      <td>{document.sourceProjectName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="review" />Monthly Updates</h2>
          <button type="button" className="secondary-btn" onClick={openProgressUpdate}>
            Progress Update
          </button>
        </div>

        <div className="table-wrap">
          <table className="simple-table weekly-update-table">
            <thead>
              <tr>
                <th>Month Of</th>
                <th>Plan</th>
                <th>Progress</th>
                <th>Overall Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthlyUpdates.map((update) => (
                <tr key={`${update.weekStart}-${update.sourceProjectName}`}>
                  <td className="weekly-update-week-cell">{update.monthLabel || formatMonthYearLabel(String(update.weekStart).slice(0, 7))}</td>
                  <td>{update.plan || 'No monthly plan defined yet.'}</td>
                  <td>{update.progress || 'Monthly progress has not been recorded yet.'}</td>
                  <td>{update.overallStatus || 'Overall status has not been recorded yet.'}</td>
                  <td>
                    {(() => {
                      const rowKey = `${update.weekStart}-${update.sourceProjectName}`;
                      const actionTarget = buildRowProgressActionTarget(update, overallTone);
                      const isMenuOpen = openProgressActionsRow === rowKey;

                      return (
                        <div
                          className="progress-row-actions-menu"
                          ref={isMenuOpen ? progressActionsMenuRef : null}
                        >
                          <button
                            type="button"
                            className="secondary-btn primary-btn-compact progress-row-actions-trigger"
                            onClick={() => toggleProgressActionsRow(rowKey)}
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                          >
                            Actions
                            <Icon name="chevronDown" className={isMenuOpen ? 'progress-row-actions-chevron open' : 'progress-row-actions-chevron'} />
                          </button>
                          {isMenuOpen ? (
                            <div className="progress-row-actions-dropdown" role="menu" aria-label="Progress update actions">
                              <button
                                type="button"
                                className="progress-row-actions-item"
                                role="menuitem"
                                onClick={() => openProgressView(actionTarget)}
                              >
                                View
                              </button>
                              {update.sourceUpdate?.id ? (
                                <button
                                  type="button"
                                  className="progress-row-actions-item"
                                  role="menuitem"
                                  onClick={() => openProgressEditor(update.sourceUpdate)}
                                >
                                  Edit
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="progress-row-actions-item"
                                role="menuitem"
                                onClick={() => {
                                  setOpenProgressActionsRow(null);
                                  void exportInitiativeSlide(update.sourceUpdate ?? null);
                                }}
                              >
                                Export
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {overlay}

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="dashboard" />Milestones</h2>
          <div className="detail-actions-row">
            <div className="muted">{milestoneRows.length} milestone(s)</div>
            <button type="button" className="secondary-btn" onClick={openMilestoneEditor}>
              Edit Milestones
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Milestone title</th>
                <th>Description</th>
                <th>Planned Date</th>
                <th>Actual Date</th>
              </tr>
            </thead>
            <tbody>
              {milestoneRows.map((milestone) => (
                <tr key={milestone.id}>
                  <td>{milestone.title}</td>
                  <td>{milestone.description}</td>
                  <td className={milestone.plannedDateChanged ? 'milestone-date-cell changed' : 'milestone-date-cell'}>
                    <span>{milestone.plannedDate}</span>
                    {milestone.plannedDateChanged ? <span className="pill changed">Changed</span> : null}
                  </td>
                  <td>{milestone.actualDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="risk" />ERM Risks</h2>
          <div className="detail-actions-row">
            <div className="muted">{sortedInitiativeRisks.length} linked risk(s)</div>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowRiskDrawer(true)}
            >
              Add New Risk
            </button>
          </div>
        </div>

        {initiativeRisksLoading ? <p>Loading initiative risks...</p> : null}
        {initiativeRisksError ? <p className="error">{initiativeRisksError}</p> : null}

        {!initiativeRisksLoading && !initiativeRisksError ? (
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Risk ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Risk Level</th>
                  <th>Owner</th>
                  <th>Next Review</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {sortedInitiativeRisks.map((risk) => (
                  <tr key={risk.risk_id}>
                    <td>{risk.risk_id}</td>
                    <td>{risk.title}</td>
                    <td>{risk.category}</td>
                    <td>{risk.status}</td>
                    <td>
                      <span className={`pill ${getRiskBand(risk.inherent_score)}`}>
                        {getRiskBand(risk.inherent_score)}
                      </span>
                    </td>
                    <td>{risk.owner_name || '-'}</td>
                    <td>{risk.next_review_due ? String(risk.next_review_due).slice(0, 10) : '-'}</td>
                    <td>
                      <Link className="link-btn" to={`/risks/${risk.risk_id}`}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {sortedInitiativeRisks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="muted">No ERM risks are linked to this initiative yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <PmoRiskDrawer
        isOpen={showRiskDrawer}
        onClose={() => setShowRiskDrawer(false)}
        onCreated={handleRiskCreated}
        category="Initiative"
        ownerName={owners.length ? owners.join(', ') : ''}
        ownerEmail=""
        linkId={initiative.id}
        contextLabel="initiative"
      />

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="assessment" />Cost Tracking</h2>
          <div className="muted">{costTrackingRows.length} cost item(s)</div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Breakdown of Initiative Cost Items</th>
                <th>Budget</th>
                <th>Actual to date</th>
                <th>Estimate at completion</th>
              </tr>
            </thead>
            <tbody>
              {costTrackingRows.map((row) => (
                <tr key={row.item}>
                  <td>{row.item}</td>
                  <td>{formatMillions(row.budget)}</td>
                  <td>{formatMillions(row.actualToDate)}</td>
                  <td>{formatMillions(row.estimateAtCompletion)}</td>
                </tr>
              ))}
              <tr className="cost-tracking-total-row">
                <td>Total</td>
                <td>{formatMillions(costTrackingTotals.budget)}</td>
                <td>{formatMillions(costTrackingTotals.actualToDate)}</td>
                <td>{formatMillions(costTrackingTotals.estimateAtCompletion)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2><Icon name="portfolio" />Linked Major Projects</h2>
          <div className="muted">{relatedProjects.length} project(s)</div>
        </div>

        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Scope</th>
                <th>Schedule</th>
                <th>Cost</th>
                <th>Quality</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {relatedProjects.map((project) => {
                const health = getProjectHealth(project);
                const overallProjectTone = getOverallHealthTone(health);

                return (
                  <tr key={project.id}>
                    <td>
                      <Link className="table-link" to={`/ppm/projects/${project.id}`}>
                        {project.name}
                      </Link>
                    </td>
                    <td>{project.businessOwner || '-'}</td>
                    <td>{renderHealthCell(overallProjectTone)}</td>
                    <td>{renderHealthCell(health.scope)}</td>
                    <td>{renderHealthCell(health.schedule)}</td>
                    <td>{renderHealthCell(health.cost)}</td>
                    <td>{renderHealthCell(health.quality)}</td>
                    <td>{renderHealthCell(health.risk)}</td>
                  </tr>
                );
              })}
              {!relatedProjects.length ? (
                <tr>
                  <td colSpan={8} className="muted">No major projects are linked to this initiative yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}
