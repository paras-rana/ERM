/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import {
  CURRENT_PROJECT_CLASSIFICATION_OPTIONS,
  EXECUTIVE_SPONSOR_OPTIONS,
  PROJECT_CATEGORY_OPTIONS,
  SEEDED_OPERATIONAL_INITIATIVES,
  SEEDED_STRATEGIC_PRIORITY_PERIODS,
} from './ppmConfig';

const PROJECTS_STORAGE_KEY = 'riskapp.ppm.projects';
const PRIORITIES_STORAGE_KEY = 'riskapp.ppm.priorities';
const OPERATIONAL_INITIATIVES_STORAGE_KEY = 'riskapp.ppm.operational-initiatives';
const PROJECTS_DATA_VERSION_STORAGE_KEY = 'riskapp.ppm.projects-data-version';
const PROJECTS_DATA_VERSION = '2026-04-18-major-project-import-initiative-ids-1';
const REFERENCE_DATA_VERSION_STORAGE_KEY = 'riskapp.ppm.reference-data-version';
const REFERENCE_DATA_VERSION = '2026-04-23-initiative-seed-updates-1';

const DOCUMENT_CATEGORY_CONFIG = [
  {
    key: 'costEstimateBreakdownFiles',
    category: 'Cost Estimate Breakdown',
  },
  {
    key: 'scopeStatementFiles',
    category: 'Scope Statement',
  },
];

const LEGACY_EXECUTIVE_SPONSOR_MAP = {
  'Sarah Chen': 'CEO',
  'Michael Torres': 'CFO',
  'Danielle Brooks': 'COO',
};

const SEEDED_MAJOR_PROJECTS = [
  {
    id: 'PRJ-301',
    name: 'CMMC Compliance Readiness Program',
    executiveSponsor: 'COO',
    businessOwner: 'Diana',
    estimatedCost: '$2.8M',
    targetStartQuarter: 'Q2 2026',
    category: 'Compliance',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.4.4',
    operationalInitiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization',
    strategicPriorityId: 'SP-204',
    strategicPriorityTitle: 'Build a supportive ecosystem that fosters innovation',
    strategicAlignment: 'Build a supportive ecosystem that fosters innovation',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'yellow',
    summary: 'Advance security controls, documentation, and operating discipline needed for CMMC readiness.',
    projectPurpose: 'Prepare enterprise technology and security practices for CMMC-aligned compliance expectations.',
    scopeStatement: 'Includes control remediation, policy updates, readiness assessments, and audit preparation support for covered environments.',
    expectedStartMonth: '2026-04',
    durationMonths: '9',
    costEstimateBreakdownFiles: ['cmmc-readiness-cost-estimate.xlsx'],
    scopeStatementFiles: ['cmmc-readiness-scope.pdf'],
    teamMembers: ['Diana', 'Security Architect', 'Infrastructure Lead', 'Compliance Analyst'],
    expectedOutcomes: [
      'Improve compliance posture against target controls',
      'Reduce audit preparation effort',
      'Strengthen enterprise security governance',
    ],
    potentialRisks: [
      'Control owners may not complete remediation on schedule',
      'Third-party dependencies could delay evidence collection',
    ],
    assumptions: [
      'Required security tooling remains funded through FY2026',
      'Business units provide timely policy and evidence input',
    ],
    milestones: [
      { id: 'MS-301-1', name: 'Gap assessment and remediation plan', quarter: '2026-05' },
      { id: 'MS-301-2', name: 'Control implementation waves', quarter: '2026-08' },
      { id: 'MS-301-3', name: 'Readiness review and closeout', quarter: '2026-11' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Finalize scope, owners, and evidence requirements for the first remediation wave.',
        progress: 'Core control domains and remediation owners have been confirmed.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-01',
    reviewNotes: 'Prioritized as a strategic compliance and contract-readiness initiative.',
  },
  {
    id: 'PRJ-302',
    name: 'Food Services Growth Business Plan',
    executiveSponsor: 'CFO',
    businessOwner: 'VP Innovation',
    estimatedCost: '$1.4M',
    targetStartQuarter: 'Q2 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.3.2',
    operationalInitiativeTitle: 'Expand and diversify our food services enterprise',
    strategicPriorityId: 'SP-203',
    strategicPriorityTitle: 'Build strong financial resilience',
    strategicAlignment: 'Build strong financial resilience',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'green',
    summary: 'Build a multi-year business plan for food services growth, capacity, and market expansion.',
    projectPurpose: 'Define the investment, operating, and demand model for scaling food services sustainably.',
    scopeStatement: 'Includes market sizing, operational model design, financial modeling, and phased expansion recommendations.',
    expectedStartMonth: '2026-04',
    durationMonths: '7',
    costEstimateBreakdownFiles: ['food-services-business-plan-estimate.xlsx'],
    scopeStatementFiles: ['food-services-business-plan-scope.pdf'],
    teamMembers: ['VP Innovation', 'Finance Manager', 'Food Services Lead', 'Market Analyst'],
    expectedOutcomes: [
      'Deliver a validated five-year growth plan',
      'Clarify investment priorities and expected returns',
      'Identify near-term market expansion opportunities',
    ],
    potentialRisks: [
      'Demand assumptions may be overstated for target segments',
      'Operational scaling constraints could limit speed to market',
    ],
    assumptions: [
      'Leadership will support phased investment decisions',
      'Key market and customer data can be accessed during planning',
    ],
    milestones: [
      { id: 'MS-302-1', name: 'Market and demand assessment', quarter: '2026-05' },
      { id: 'MS-302-2', name: 'Operating and financial model', quarter: '2026-07' },
      { id: 'MS-302-3', name: 'Board-ready business plan', quarter: '2026-09' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Complete market scan and confirm planning assumptions with finance and operations.',
        progress: 'Initial market hypotheses and planning assumptions have been documented.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-01',
    reviewNotes: 'Approved to support enterprise diversification and investment sequencing.',
  },
  {
    id: 'PRJ-303',
    name: 'Building Asset Optimization Plan',
    executiveSponsor: 'CFO',
    businessOwner: 'Sandra',
    estimatedCost: '$1.1M',
    targetStartQuarter: 'Q2 2026',
    category: 'Efficiency',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.3.4',
    operationalInitiativeTitle: 'Optimize building assets to support mission and financial performance',
    strategicPriorityId: 'SP-203',
    strategicPriorityTitle: 'Build strong financial resilience',
    strategicAlignment: 'Build strong financial resilience',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'green',
    summary: 'Develop a portfolio plan for improving facility utilization, mission fit, and long-term value.',
    projectPurpose: 'Align real-estate use and investment decisions with program needs and financial outcomes.',
    scopeStatement: 'Includes facility inventory review, utilization analysis, scenario planning, and recommended asset actions.',
    expectedStartMonth: '2026-04',
    durationMonths: '8',
    costEstimateBreakdownFiles: ['asset-optimization-estimate.xlsx'],
    scopeStatementFiles: ['asset-optimization-scope.pdf'],
    teamMembers: ['Sandra', 'Facilities Director', 'Finance Analyst', 'Program Operations Lead'],
    expectedOutcomes: [
      'Improve utilization visibility across properties',
      'Identify opportunities to reduce underused space',
      'Create a prioritized facilities action plan',
    ],
    potentialRisks: [
      'Incomplete space data may slow recommendations',
      'Stakeholder alignment on property changes may take longer than planned',
    ],
    assumptions: [
      'Facilities and finance data are available for all major locations',
      'Leadership will review and prioritize recommended actions in phases',
    ],
    milestones: [
      { id: 'MS-303-1', name: 'Facility inventory and utilization baseline', quarter: '2026-05' },
      { id: 'MS-303-2', name: 'Scenario analysis and options', quarter: '2026-08' },
      { id: 'MS-303-3', name: 'Portfolio action plan', quarter: '2026-10' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Gather occupancy, cost, and mission-use data for priority assets.',
        progress: 'Baseline templates and the priority site list are in place.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-02',
    reviewNotes: 'Approved to support near-term cost discipline and long-range facilities planning.',
  },
  {
    id: 'PRJ-304',
    name: 'Client Management Requirements Program',
    executiveSponsor: 'COO',
    businessOwner: 'Hilary',
    estimatedCost: '$1.9M',
    targetStartQuarter: 'Q2 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.1.1',
    operationalInitiativeTitle: 'Build organizational alignment around the Theory of Change',
    strategicPriorityId: 'SP-201',
    strategicPriorityTitle: 'Create sustainable program impact',
    strategicAlignment: 'Create sustainable program impact',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'yellow',
    summary: 'Define business, reporting, and data requirements for a modern client management platform.',
    projectPurpose: 'Establish a clear future-state requirements set for client management and impact reporting.',
    scopeStatement: 'Includes process discovery, requirements definition, reporting needs, and data governance inputs.',
    expectedStartMonth: '2026-04',
    durationMonths: '6',
    costEstimateBreakdownFiles: ['client-management-requirements-estimate.xlsx'],
    scopeStatementFiles: ['client-management-requirements-scope.pdf'],
    teamMembers: ['Hilary', 'Program Director', 'Data Lead', 'Business Analyst'],
    expectedOutcomes: [
      'Deliver a complete future-state requirements package',
      'Standardize reporting expectations across programs',
      'Reduce ambiguity ahead of platform selection or build',
    ],
    potentialRisks: [
      'Programs may have conflicting process and reporting needs',
      'Data standards may require additional governance decisions',
    ],
    assumptions: [
      'Program leaders can participate in requirements workshops',
      'Reporting use cases can be prioritized for an MVP scope',
    ],
    milestones: [
      { id: 'MS-304-1', name: 'Process discovery and stakeholder interviews', quarter: '2026-05' },
      { id: 'MS-304-2', name: 'Requirements and reporting specification', quarter: '2026-07' },
      { id: 'MS-304-3', name: 'Leadership approval of target-state package', quarter: '2026-09' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Launch stakeholder interviews and map current reporting pain points.',
        progress: 'Initial workshop schedule is locked and discovery has started.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-03',
    reviewNotes: 'Approved as a foundational enabler for future client management modernization.',
  },
  {
    id: 'PRJ-305',
    name: 'Theory of Change Pilot Execution',
    executiveSponsor: 'COO',
    businessOwner: 'Hilary',
    estimatedCost: '$2.2M',
    targetStartQuarter: 'Q2 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.1.1',
    operationalInitiativeTitle: 'Build organizational alignment around the Theory of Change',
    strategicPriorityId: 'SP-201',
    strategicPriorityTitle: 'Create sustainable program impact',
    strategicAlignment: 'Create sustainable program impact',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'yellow',
    summary: 'Run pilot implementations that test Theory of Change alignment in live program settings.',
    projectPurpose: 'Validate how the Theory of Change can guide program design, performance expectations, and reporting.',
    scopeStatement: 'Includes pilot site selection, operating model definition, training, measurement setup, and pilot evaluation.',
    expectedStartMonth: '2026-04',
    durationMonths: '8',
    costEstimateBreakdownFiles: ['toc-pilot-estimate.xlsx'],
    scopeStatementFiles: ['toc-pilot-scope.pdf'],
    teamMembers: ['Hilary', 'Pilot Program Manager', 'Learning Lead', 'Data Analyst'],
    expectedOutcomes: [
      'Validate pilot pathways and measures',
      'Improve program consistency around impact delivery',
      'Generate lessons for broader organizational rollout',
    ],
    potentialRisks: [
      'Pilot sites may apply the model inconsistently',
      'Measurement changes may create temporary reporting disruption',
    ],
    assumptions: [
      'Pilot teams will dedicate staff to change adoption',
      'Core performance indicators can be tracked during the pilot period',
    ],
    milestones: [
      { id: 'MS-305-1', name: 'Pilot design and site readiness', quarter: '2026-05' },
      { id: 'MS-305-2', name: 'Pilot launch and adoption support', quarter: '2026-08' },
      { id: 'MS-305-3', name: 'Pilot evaluation and scale recommendation', quarter: '2026-11' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Confirm pilot sites, operating model, and baseline measures.',
        progress: 'Pilot selection criteria and adoption materials are under review.',
        overallStatus: 'Watch',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-03',
    reviewNotes: 'Approved as the first implementation wave for Theory of Change adoption.',
  },
  {
    id: 'PRJ-306',
    name: 'Box Lunch Venture Launch',
    executiveSponsor: 'CFO',
    businessOwner: 'VP Innovation',
    estimatedCost: '$1.7M',
    targetStartQuarter: 'Q3 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.3.2',
    operationalInitiativeTitle: 'Expand and diversify our food services enterprise',
    strategicPriorityId: 'SP-203',
    strategicPriorityTitle: 'Build strong financial resilience',
    strategicAlignment: 'Build strong financial resilience',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'yellow',
    summary: 'Launch a box lunch offering to expand food services revenue and test new market demand.',
    projectPurpose: 'Create a new food services line that broadens revenue opportunities and brand reach.',
    scopeStatement: 'Includes menu design, production planning, channel setup, launch marketing, and early performance management.',
    expectedStartMonth: '2026-06',
    durationMonths: '6',
    costEstimateBreakdownFiles: ['box-lunch-launch-estimate.xlsx'],
    scopeStatementFiles: ['box-lunch-launch-scope.pdf'],
    teamMembers: ['VP Innovation', 'Food Services Manager', 'Marketing Lead', 'Operations Coordinator'],
    expectedOutcomes: [
      'Launch a market-ready box lunch offering',
      'Generate incremental enterprise revenue',
      'Validate a repeatable operating model for scaled delivery',
    ],
    potentialRisks: [
      'Demand may ramp more slowly than forecast',
      'Production and fulfillment processes may need iteration after launch',
    ],
    assumptions: [
      'Initial launch partners can be secured before go-live',
      'Kitchen capacity can support the new line without major disruption',
    ],
    milestones: [
      { id: 'MS-306-1', name: 'Offering design and launch readiness', quarter: '2026-07' },
      { id: 'MS-306-2', name: 'Pilot launch to first customers', quarter: '2026-08' },
      { id: 'MS-306-3', name: 'Post-launch optimization and scale plan', quarter: '2026-10' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-06-01',
        cadence: 'weekly',
        plan: 'Finalize launch menu, pricing, and fulfillment workflow.',
        progress: 'Core offer design is complete and launch operations are being tested.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-04',
    reviewNotes: 'Approved as a priority growth experiment within food services diversification.',
  },
  {
    id: 'PRJ-307',
    name: 'Skagit Diversion Launch',
    executiveSponsor: 'COO',
    businessOwner: 'Clint',
    estimatedCost: '$3.6M',
    targetStartQuarter: 'Q2 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.1.2',
    operationalInitiativeTitle: 'Establish Pioneer as the leading diversion provider in priority regions',
    strategicPriorityId: 'SP-201',
    strategicPriorityTitle: 'Create sustainable program impact',
    strategicAlignment: 'Create sustainable program impact',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'red',
    summary: 'Stand up a new diversion program in Skagit County with the required partnerships, staffing, and referral model.',
    projectPurpose: 'Launch a fully operational diversion program in a priority region and validate a repeatable expansion playbook.',
    scopeStatement: 'Includes partner setup, referral process design, staffing, operational launch, and early performance monitoring.',
    expectedStartMonth: '2026-04',
    durationMonths: '9',
    costEstimateBreakdownFiles: ['skagit-diversion-estimate.xlsx'],
    scopeStatementFiles: ['skagit-diversion-scope.pdf'],
    teamMembers: ['Clint', 'Regional Launch Lead', 'Program Manager', 'Partnerships Coordinator'],
    expectedOutcomes: [
      'Launch the Skagit diversion program on schedule',
      'Establish referral partnerships and intake processes',
      'Create an expansion template for additional regions',
    ],
    potentialRisks: [
      'Partner alignment could delay referral activation',
      'Hiring and onboarding timelines may slip in early launch phases',
    ],
    assumptions: [
      'Core partner agencies remain committed through launch',
      'Program staffing can be completed before referral volume ramps',
    ],
    milestones: [
      { id: 'MS-307-1', name: 'Partner agreements and site readiness', quarter: '2026-05' },
      { id: 'MS-307-2', name: 'Staffing and referral workflow activation', quarter: '2026-08' },
      { id: 'MS-307-3', name: 'Program go-live and stabilization', quarter: '2026-11' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Close key partnership decisions and lock the staffing model for launch.',
        progress: 'Regional partners are engaged and operating assumptions are being finalized.',
        overallStatus: 'Watch',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-04',
    reviewNotes: 'Approved as the flagship regional expansion effort for diversion services.',
  },
  {
    id: 'PRJ-308',
    name: 'Pioneer Industries Diversification Plan',
    executiveSponsor: 'CFO',
    businessOwner: 'Alex',
    estimatedCost: '$2.5M',
    targetStartQuarter: 'Q2 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.3.1',
    operationalInitiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries',
    strategicPriorityId: 'SP-203',
    strategicPriorityTitle: 'Build strong financial resilience',
    strategicAlignment: 'Build strong financial resilience',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'yellow',
    summary: 'Create and begin executing a growth and diversification plan for Pioneer Industries.',
    projectPurpose: 'Expand customer reach, diversify revenue, and define investment priorities for the enterprise portfolio.',
    scopeStatement: 'Includes growth strategy, customer targeting, capex planning, and commercial activation priorities.',
    expectedStartMonth: '2026-04',
    durationMonths: '9',
    costEstimateBreakdownFiles: ['pi-diversification-estimate.xlsx'],
    scopeStatementFiles: ['pi-diversification-scope.pdf'],
    teamMembers: ['Alex', 'Business Development Lead', 'Finance Partner', 'Operations Lead'],
    expectedOutcomes: [
      'Deliver a practical diversification roadmap',
      'Expand customer acquisition activity',
      'Align growth investments with expected returns',
    ],
    potentialRisks: [
      'Commercial assumptions may not hold across target markets',
      'Capital requirements may exceed near-term funding appetite',
    ],
    assumptions: [
      'Commercial and capex planning can progress in parallel',
      'Leadership is prepared to phase investments based on market evidence',
    ],
    milestones: [
      { id: 'MS-308-1', name: 'Growth strategy and customer targeting', quarter: '2026-05' },
      { id: 'MS-308-2', name: 'Investment and commercialization plan', quarter: '2026-08' },
      { id: 'MS-308-3', name: 'Execution kickoff and KPI tracking', quarter: '2026-11' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Finalize target growth segments and define the initial business development playbook.',
        progress: 'Commercial opportunity framing and capex planning assumptions are underway.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-05',
    reviewNotes: 'Approved as a core enterprise growth and diversification initiative.',
  },
  {
    id: 'PRJ-309',
    name: 'Quarterly Impact Reporting Program',
    executiveSponsor: 'CEO',
    businessOwner: 'Hilary',
    estimatedCost: '$0.9M',
    targetStartQuarter: 'Q2 2026',
    category: 'Growth',
    currentProjectClassification: 'Major project',
    operationalInitiativeId: '2026.5.4',
    operationalInitiativeTitle: 'Elevate visibility of Pioneer\'s impact',
    strategicPriorityId: 'SP-205',
    strategicPriorityTitle: 'Champion systemic changes within the criminal justice system',
    strategicAlignment: 'Champion systemic changes within the criminal justice system',
    strategicPriorityPeriodId: 'SPP-2024-2029',
    strategicPriorityPeriodLabel: 'Strategic Priorities 2024-2029',
    deliveryStatus: 'green',
    summary: 'Stand up a quarterly impact reporting cycle that communicates outcomes, learning, and visibility externally.',
    projectPurpose: 'Create a repeatable publication process that strengthens stakeholder understanding of Pioneer’s impact.',
    scopeStatement: 'Includes reporting design, data sourcing, editorial workflow, publication cadence, and distribution planning.',
    expectedStartMonth: '2026-04',
    durationMonths: '5',
    costEstimateBreakdownFiles: ['impact-reporting-estimate.xlsx'],
    scopeStatementFiles: ['impact-reporting-scope.pdf'],
    teamMembers: ['Hilary', 'Communications Lead', 'Data Analyst', 'Design Partner'],
    expectedOutcomes: [
      'Publish quarterly impact reports on a repeatable cadence',
      'Improve visibility of outcomes and innovation',
      'Support external engagement with stronger evidence and storytelling',
    ],
    potentialRisks: [
      'Data quality or timeliness may affect publication readiness',
      'Editorial approvals may compress release timelines',
    ],
    assumptions: [
      'Reporting data can be validated within each quarter',
      'Communications support remains available for production and release',
    ],
    milestones: [
      { id: 'MS-309-1', name: 'Report framework and content model', quarter: '2026-05' },
      { id: 'MS-309-2', name: 'First quarterly report production', quarter: '2026-07' },
      { id: 'MS-309-3', name: 'Cadence stabilization and distribution plan', quarter: '2026-09' },
    ],
    weeklyUpdates: [
      {
        weekStart: '2026-04-06',
        cadence: 'weekly',
        plan: 'Confirm the report structure, data sources, and editorial workflow.',
        progress: 'Draft structure and publication roles are in place for the first report cycle.',
        overallStatus: 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-05',
    reviewNotes: 'Approved to improve external visibility of Pioneer’s impact and policy relevance.',
  },
];

const OPERATIONAL_PROJECT_SPREADSHEET_ROWS = [
  { initiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries', title: 'Complete 5-year capex investment plan at 1% of gross revenue per year', businessOwner: 'Alex' },
  { initiativeTitle: 'Ensure equity is reflected in how Pioneer recruits, develops and advances talent', title: 'Conduct equity review of hiring, promotion and performance outcomes and implement corrective actions where disparities exist', businessOwner: 'Debbie' },
  { initiativeTitle: 'Shift HR capacity toward higher-value strategic work', title: 'Conduct HR process audit and eliminate low-value administrative work', businessOwner: 'Debbie' },
  { initiativeTitle: 'Elevate visibility of Pioneer\'s impact', title: 'Conference presentations', businessOwner: 'Hilary' },
  { initiativeTitle: 'Ensure the organization has the leadership capacity to sustain long-term growth', title: 'Develop workforce growth model and strategic hiring plans for diversion expansion, enterprise growth and pilot programs', businessOwner: 'Debbie' },
  { initiativeTitle: 'Strengthen financial sustainability across program operations', title: 'Diversify revenue for BH', businessOwner: 'Sandra' },
  { initiativeTitle: 'Strengthen and scale Pioneer\'s reentry service model', title: 'Enhance services in federal reentry programs', businessOwner: 'Clint' },
  { initiativeTitle: 'Elevate visibility of Pioneer\'s impact', title: 'Execute marketing plan, including social media campaign', businessOwner: 'Hilary' },
  { initiativeTitle: 'Identify and advance new mission-aligned enterprise opportunities', title: 'Explore and vet 2-3 new business opportunities', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Ensure the organization has the leadership capacity to sustain long-term growth', title: 'Identify mission-critical roles and succession plans for key leadership positions', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure Pioneer can attract and retain the talent needed to support growth', title: 'Implement quarterly talent dashboard tracking pipeline strength, diversity, time-to-fill and early retention', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure equity is reflected in how Pioneer recruits, develops and advances talent', title: 'Implement workforce equity dashboard tracking representation, promotion and retention outcomes', businessOwner: 'Debbie' },
  { initiativeTitle: 'Strengthen financial sustainability across program operations', title: 'Improve RRC contracts in Spokane and Seattle', businessOwner: 'Clint' },
  { initiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization', title: 'Key activity: Advance CMMC readiness to strengthen cybersecurity practices and ensure Pioneer can maintain and expand enterprise contracts that require federal security standards.', businessOwner: 'Diana' },
  { initiativeTitle: 'Strengthen and scale Pioneer\'s reentry service model', title: 'Key activity: Advance expansion opportunities with the Department of Corrections by promoting Pioneer\'s reentry model and demonstrating its outcomes and impact in supporting successful reentry.', businessOwner: 'Clint' },
  { initiativeTitle: 'Expand housing access for justice-involved individuals', title: 'Key activity: Advance policy and community engagement efforts that reduce housing barriers for individuals with conviction histories.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Ensure the organization has the leadership capacity to sustain long-term growth', title: 'Key activity: Align workforce planning with Pioneer\'s program and enterprise growth strategy by anticipating staffing needs and ensuring hiring plans support sustainable expansion.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure the organization has the leadership capacity to sustain long-term growth', title: 'Key activity: Build leadership capability across the organization through the Pioneer Leadership Academy, preparing leaders to manage growth, lead innovation and strengthen operational performance.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Expand housing access for justice-involved individuals', title: 'Key activity: Build partnerships with housing providers, community stakeholders and policymakers to support adoption of fair chance housing practices.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Advance policy reforms that reduce unnecessary incarceration', title: 'Key activity: Build support among policymakers, system partners and advocacy organizations in preparation for introduction during the 2027 legislative session.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Shift HR capacity toward higher-value strategic work', title: 'Key activity: Clarify responsibilities between HR and managers through a redesigned service delivery model, enabling HR to focus more capacity on strategic workforce initiatives that support organizational growth.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure continuity of healthcare coverage for justice-involved populations', title: 'Key activity: Collaborate with state and national partners and coalitions to protect policies that support treatment access and successful reentry.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Elevate visibility of Pioneer\'s impact', title: 'Key activity: Communicate Pioneer\'s outcomes and impact through regular publications, presentations and public engagement.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Build organizational alignment around the Theory of Change', title: 'Key activity: Define the business, reporting, and data requirements necessary to support a modern client management system and ensure consistent measurement of program outcomes and impact.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Advance policy reforms that reduce unnecessary incarceration', title: 'Key activity: Develop a policy proposal aimed at reducing pre-conviction incarceration through research, stakeholder engagement and policy design.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Optimize building assets to support mission and financial performance', title: 'Key activity: Develop a strategic plan for Pioneer\'s real estate portfolio that maximizes utilization of building assets while supporting program operations, enterprise activity and long-term financial sustainability.', businessOwner: 'Sandra' },
  { initiativeTitle: 'Strengthen financial sustainability across program operations', title: 'Key activity: Diversify revenue sources to reduce reliance on single funding stream and improve financial resilience.', businessOwner: 'Sandra' },
  { initiativeTitle: 'Build organizational alignment around the Theory of Change', title: 'Key activity: Drive organization-wide adoption of the Theory of Change by aligning programs to TOC pathways and establishing clear performance expectations tied to those pathways.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Strengthen and scale Pioneer\'s reentry service model', title: 'Key activity: Elevate service delivery across federal reentry programs by strengthening program design, improving service standards, and reinforcing clear outcomes and program impact.', businessOwner: 'Clint' },
  { initiativeTitle: 'Ensure continuity of healthcare coverage for justice-involved populations', title: 'Key activity: Engage in legislative and policy advocacy to maintain Medicaid eligibility and continuity of coverage for justice-involved individuals.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Expand and diversify our food services enterprise', title: 'Key activity: Establish a clear long-term growth strategy through a comprehensive business plan that identifies new market opportunities and operational investments.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Establish a structured process for capturing and evaluating new ideas', title: 'Key activity: Establish a clear process for capturing new ideas from across the organization and external partners.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Identify and advance new mission-aligned enterprise opportunities', title: 'Key activity: Establish a structured process for assessing feasibility, market demand, operational capacity and mission alignment before advancing new opportunities.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Strengthen financial sustainability across program operations', title: 'Key activity: Establish program rate structures to better reflect the cost of service delivery and support long-term sustainability of program operations.', businessOwner: 'Clint' },
  { initiativeTitle: 'Test a transitional jobs model in landscaping services', title: 'Key activity: Evaluate operational feasibility, workforce outcomes and market demand to determine whether the model should be expanded or integrated into Pioneer\'s enterprise portfolio.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Establish Pioneer as the leading diversion provider in priority regions', title: 'Key activity: Expand Pioneer\'s presence in Seattle and King County through strategic marketing, relationship development with justice system partners, and alignment with regional diversion priorities while reinforcing the measurable impact of diversion services.', businessOwner: 'Clint' },
  { initiativeTitle: 'Identify and advance new mission-aligned enterprise opportunities', title: 'Key activity: Identify and evaluate new enterprise opportunities that align with Pioneer\'s mission and workforce development model while strengthening long-term revenue diversification.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Establish a structured process for capturing and evaluating new ideas', title: 'Key activity: Implement a structured review process to evaluate ideas based on mission alignment, feasibility, impact potential and resource requirements before advancing them for further development.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization', title: 'Key activity: Improve collaboration and communication reliability through upgrades to enterprise communication systems.', businessOwner: 'Diana' },
  { initiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries', title: 'Key activity: Increase market visibility and customer acquisition through targeted marketing efforts that support growth and diversification of the enterprise portfolio.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Elevate visibility of Pioneer\'s impact', title: 'Key activity: Increase Pioneer\'s visibility in policy, community and national justice reform conversations by sharing evidence-based results and program innovations.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Establish Pioneer as the leading diversion provider in priority regions', title: 'Key activity: Launch a fully operational diversion program in Skagit County, including partnerships, staffing, and referral pathways necessary to support successful program implementation.', businessOwner: 'Clint' },
  { initiativeTitle: 'Expand and diversify our food services enterprise', title: 'Key activity: Launch the box lunch business to expand revenue opportunities and diversify offerings.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Test a transitional jobs model in landscaping services', title: 'Key activity: Launch the Conservation Corps pilot to test a transitional employment model focused on landscaping and environmental restoration work.', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Establish Pioneer as the leading diversion provider in priority regions', title: 'Key activity: Position Pioneer as the preferred diversion provider in Tacoma and Pierce County through targeted outreach, stakeholder engagement, and demonstration of strong outcomes and program impact.', businessOwner: 'Clint' },
  { initiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries', title: 'Key activity: Position the enterprise for sustainable growth by establishing a multi-year capital investment plan that supports modernization, operational efficiency and long-term competitiveness.', businessOwner: 'Alex' },
  { initiativeTitle: 'Ensure equity is reflected in how Pioneer recruits, develops and advances talent', title: 'Key activity: Provide leadership with clear visibility into workforce equity trends through a dashboard tracking representation, promotion and retention outcomes, supporting ongoing accountability and informed decision-making.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure Pioneer can attract and retain the talent needed to support growth', title: 'Key activity: Provide leadership with consistent visibility into workforce trends through a quarterly talent dashboard, enabling more strategic hiring decisions and early identification of recruitment or retention risk', businessOwner: 'Debbie' },
  { initiativeTitle: 'Strengthen financial sustainability across program operations', title: 'Key activity: Secure contract rates and rate structures for RRCs in Spokane and Seattle that better reflect the cost of service delivery and provide greater financial stability within census-driven programs.', businessOwner: 'Clint' },
  { initiativeTitle: 'Ensure Pioneer can attract and retain the talent needed to support growth', title: 'Key activity: Shift Pioneer from reactive hiring to a proactive talent pipeline approach that ensures the organization can staff new programs, enterprise growth and emerging initiatives quickly and competitively.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Shift HR capacity toward higher-value strategic work', title: 'Key activity: Streamline HR processes to reduce low-value administrative work and improve efficiency across core HR functions.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure equity is reflected in how Pioneer recruits, develops and advances talent', title: 'Key activity: Strengthen equitable talent practices by reviewing hiring, promotion and performance outcomes and addressing disparities where they exist.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Ensure the organization has the leadership capacity to sustain long-term growth', title: 'Key activity: Strengthen leadership continuity by identifying mission-critical roles and establishing succession plans for key leadership positions.', businessOwner: 'Debbie' },
  { initiativeTitle: 'Expand and diversify our food services enterprise', title: 'Key activity: Strengthen market presence and customer demand through targeted marketing that supports sustainable enterprise growth.', businessOwner: 'Hilary' },
  { initiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization', title: 'Key activity: Strengthen network security and operational stability through targeted infrastructure improvements, including physical access and network upgrades.', businessOwner: 'Diana' },
  { initiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries', title: 'Key activity: Strengthen Pioneer Industries\' revenue base by diversifying the customer portfolio and expanding business development efforts to secure new contracts and customers.', businessOwner: 'Alex' },
  { initiativeTitle: 'Expand housing access for justice-involved individuals', title: 'Launch a Fair Chance Housing campaign in Spokane', businessOwner: 'Hilary' },
  { initiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries', title: 'Launch biz development strategy (goal: 2 new customers, $500,000 in new sales)', businessOwner: 'Alex' },
  { initiativeTitle: 'Test a transitional jobs model in landscaping services', title: 'Launch Conservation Corps pilot and evaluate expansion', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Ensure the organization has the leadership capacity to sustain long-term growth', title: 'Launch Pioneer Leadership Academy focused on growth, innovation and leadership effectiveness', businessOwner: 'Debbie' },
  { initiativeTitle: 'Establish Pioneer as the leading diversion provider in priority regions', title: 'Market diversion programs to Seattle and King County', businessOwner: 'Clint' },
  { initiativeTitle: 'Establish Pioneer as the leading diversion provider in priority regions', title: 'Market diversion programs to Tacoma and Pierce County', businessOwner: 'Clint' },
  { initiativeTitle: 'Strengthen and scale Pioneer\'s reentry service model', title: 'Market reentry services to DOC', businessOwner: 'Clint' },
  { initiativeTitle: 'Strengthen the scale and diversification of Pioneer Industries', title: 'Marketing to support growth & diversification', businessOwner: 'Hilary' },
  { initiativeTitle: 'Expand and diversify our food services enterprise', title: 'Marketing to support growth & diversification', businessOwner: 'Hilary' },
  { initiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization', title: 'Physical access upgrades', businessOwner: 'Diana' },
  { initiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization', title: 'PI network upgrades', businessOwner: 'Diana' },
  { initiativeTitle: 'Advance policy reforms that reduce unnecessary incarceration', title: 'Prepare state-level bill for 2027 to reduce pre-conviction incarceration', businessOwner: 'Hilary' },
  { initiativeTitle: 'Ensure continuity of healthcare coverage for justice-involved populations', title: 'Preserve Medicaid coverage for justice-involved individuals', businessOwner: 'Hilary' },
  { initiativeTitle: 'Shift HR capacity toward higher-value strategic work', title: 'Redesign HR service delivery model and clarify manager vs HR responsibilities', businessOwner: 'Debbie' },
  { initiativeTitle: 'Establish a structured process for capturing and evaluating new ideas', title: 'Reinvent R&D program including innovative idea review process', businessOwner: 'VP Innovation' },
  { initiativeTitle: 'Strengthen financial sustainability across program operations', title: 'Stabilization rate structure', businessOwner: 'Clint' },
  { initiativeTitle: 'Ensure Pioneer can attract and retain the talent needed to support growth', title: 'Stand up proactive talent sourcing program and candidate pipelines for priority roles', businessOwner: 'Debbie' },
  { initiativeTitle: 'Strengthen technology infrastructure, security and collaboration across the organization', title: 'Zoom unified communications implementation', businessOwner: 'Diana' },
];

const EXECUTIVE_SPONSOR_BY_OWNER = {
  Alex: 'CFO',
  Clint: 'COO',
  Debbie: 'COO',
  Diana: 'COO',
  Hilary: 'CEO',
  Sandra: 'CFO',
  'VP Innovation': 'CEO',
};

const DELIVERY_STATUS_SEQUENCE = ['red', 'yellow', 'green', 'green'];

function stripKeyActivityPrefix(value) {
  return String(value ?? '').replace(/^Key activity:\s*/i, '').trim();
}

function slugifyProjectTitle(value) {
  return stripKeyActivityPrefix(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function inferProjectCategory(initiative, title) {
  const text = `${initiative?.title ?? ''} ${initiative?.strategicPriorityTitle ?? ''} ${title}`.toLowerCase();
  if (text.includes('security') || text.includes('compliance') || text.includes('medicaid')) {
    return 'Compliance';
  }

  if (
    text.includes('growth')
    || text.includes('marketing')
    || text.includes('launch')
    || text.includes('customer')
    || text.includes('visibility')
    || text.includes('housing')
    || text.includes('reentry')
    || text.includes('diversion')
  ) {
    return 'Growth';
  }

  if (text.includes('equity') || text.includes('talent') || text.includes('leadership') || text.includes('hr')) {
    return 'Efficiency';
  }

  return 'Efficiency';
}

function formatMonthValue(monthIndex) {
  const year = 2026 + Math.floor((monthIndex - 1) / 12);
  const month = ((monthIndex - 1) % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function buildOperationalProjectMilestones(projectId, cleanTitle, startMonthIndex) {
  return [
    {
      id: `MS-${projectId.slice(4)}-1`,
      name: `Plan ${cleanTitle}`,
      quarter: formatMonthValue(startMonthIndex),
    },
    {
      id: `MS-${projectId.slice(4)}-2`,
      name: `Execute ${cleanTitle}`,
      quarter: formatMonthValue(startMonthIndex + 2),
    },
    {
      id: `MS-${projectId.slice(4)}-3`,
      name: `Confirm outcomes for ${cleanTitle}`,
      quarter: formatMonthValue(startMonthIndex + 4),
    },
  ];
}

function buildSeededOperationalProject(row, index) {
  const initiative = SEEDED_OPERATIONAL_INITIATIVES.find(
    (candidate) => candidate.title === row.initiativeTitle,
  );
  const projectId = `PRJ-${401 + index}`;
  const cleanTitle = stripKeyActivityPrefix(row.title);
  const startMonthIndex = 4 + (index % 4);
  const estimatedCostValue = 0.35 + ((index % 6) * 0.12);
  const estimatedCost = `$${estimatedCostValue.toFixed(2)}M`;
  const category = inferProjectCategory(initiative, cleanTitle);
  const slug = slugifyProjectTitle(cleanTitle) || `operational-project-${index + 1}`;

  return {
    id: projectId,
    name: cleanTitle,
    executiveSponsor: EXECUTIVE_SPONSOR_BY_OWNER[row.businessOwner] ?? 'COO',
    businessOwner: row.businessOwner,
    estimatedCost,
    targetStartQuarter: `Q${Math.floor(((startMonthIndex - 1) % 12) / 3) + 1} 2026`,
    category,
    currentProjectClassification: 'Operational project',
    operationalInitiativeId: initiative?.id ?? '',
    operationalInitiativeTitle: initiative?.title ?? row.initiativeTitle,
    strategicPriorityId: initiative?.strategicPriorityId ?? '',
    strategicPriorityTitle: initiative?.strategicPriorityTitle ?? '',
    strategicAlignment: initiative?.strategicPriorityTitle ?? '',
    strategicPriorityPeriodId: initiative?.strategicPriorityPeriodId ?? 'SPP-2024-2029',
    strategicPriorityPeriodLabel: initiative?.strategicPriorityPeriodLabel ?? 'Strategic Priorities 2024-2029',
    summary: `${cleanTitle}.`,
    deliveryStatus: DELIVERY_STATUS_SEQUENCE[index % DELIVERY_STATUS_SEQUENCE.length],
    projectPurpose: `Deliver ${cleanTitle.toLowerCase()} under the 2026 operational initiative "${initiative?.title ?? row.initiativeTitle}".`,
    scopeStatement: `Includes planning, execution, stakeholder coordination, and reporting needed to complete ${cleanTitle.toLowerCase()} within the 2026 operating plan.`,
    expectedStartMonth: formatMonthValue(startMonthIndex),
    durationMonths: String(4 + (index % 3)),
    costEstimateBreakdownFiles: [`${slug}-estimate.xlsx`],
    scopeStatementFiles: [`${slug}-scope.pdf`],
    teamMembers: [
      row.businessOwner,
      'Program Lead',
      'Operations Analyst',
      'Functional Partner',
    ],
    expectedOutcomes: [
      `Complete ${cleanTitle.toLowerCase()}`,
      `Support measurable progress for ${initiative?.title ?? row.initiativeTitle}`,
      'Provide a clear update against the 2026 operational plan',
    ],
    potentialRisks: [
      `Dependencies or approvals could delay ${cleanTitle.toLowerCase()}`,
      'Competing operational priorities may reduce delivery capacity',
    ],
    assumptions: [
      'Functional owners remain available through delivery',
      'Required budget and stakeholder support stay in place',
    ],
    milestones: buildOperationalProjectMilestones(projectId, cleanTitle, startMonthIndex),
    weeklyUpdates: [
      {
        weekStart: '2026-03-01',
        cadence: 'monthly',
        plan: `Finalize the near-term execution plan for ${cleanTitle.toLowerCase()}.`,
        progress: `Initial coordination and planning are underway for ${cleanTitle.toLowerCase()}.`,
        overallStatus:
          DELIVERY_STATUS_SEQUENCE[index % DELIVERY_STATUS_SEQUENCE.length] === 'red'
            ? 'At risk'
            : DELIVERY_STATUS_SEQUENCE[index % DELIVERY_STATUS_SEQUENCE.length] === 'yellow'
              ? 'Watch'
              : 'On track',
      },
    ],
    stage: 'current',
    status: 'active',
    submittedAt: '2026-04-12',
    reviewNotes: 'Imported from the operational project spreadsheet and aligned to the 2026 operating plan.',
  };
}

const SEEDED_PROJECTS = [
  ...SEEDED_MAJOR_PROJECTS,
  ...OPERATIONAL_PROJECT_SPREADSHEET_ROWS.map(buildSeededOperationalProject),
];

function normalizeProject(project) {
  const normalizedClassification = project.currentProjectClassification === 'Operations Initiative'
    ? 'Operational project'
    : project.currentProjectClassification;
  const category = PROJECT_CATEGORY_OPTIONS.includes(project.category)
    ? project.category
    : PROJECT_CATEGORY_OPTIONS[0];
  const currentProjectClassification =
    CURRENT_PROJECT_CLASSIFICATION_OPTIONS.includes(normalizedClassification)
      ? normalizedClassification
      : '';
  const executiveSponsor = LEGACY_EXECUTIVE_SPONSOR_MAP[project.executiveSponsor]
    ?? LEGACY_EXECUTIVE_SPONSOR_MAP[project.sponsor]
    ?? (EXECUTIVE_SPONSOR_OPTIONS.includes(project.executiveSponsor)
      ? project.executiveSponsor
      : EXECUTIVE_SPONSOR_OPTIONS[0]);

  const documentVersions = Array.isArray(project.documentVersions)
    ? project.documentVersions.map((document, index) => ({
        id: document.id ?? `DOC-${project.id ?? 'NEW'}-${index + 1}`,
        category: document.category ?? 'Project Document',
        versionNumber: Number(document.versionNumber) || 1,
        fileName: document.fileName ?? '',
        comments: document.comments ?? '',
        uploadedAt: document.uploadedAt ?? project.submittedAt ?? '',
        isCurrent: document.isCurrent !== false,
      }))
    : DOCUMENT_CATEGORY_CONFIG.flatMap(({ key, category }) =>
        (Array.isArray(project[key]) ? project[key] : []).map((fileName, index) => ({
          id: `DOC-${project.id ?? 'NEW'}-${key}-${index + 1}`,
          category,
          versionNumber: 1,
          fileName,
          comments: 'Initial version',
          uploadedAt: project.submittedAt ?? '',
          isCurrent: true,
        })),
      );

  return {
    ...project,
    proposalId: project.proposalId ?? project.id ?? '',
    executiveSponsor,
    businessOwner: project.businessOwner ?? project.owner ?? '',
    estimatedCost: project.estimatedCost ?? project.budget ?? '',
    targetStartQuarter: project.targetStartQuarter ?? project.targetQuarter ?? '',
    category,
    currentProjectClassification,
    operationalInitiativeId: project.operationalInitiativeId ?? '',
    operationalInitiativeTitle: project.operationalInitiativeTitle ?? '',
    strategicPriorityId: project.strategicPriorityId ?? '',
    strategicPriorityTitle: project.strategicPriorityTitle ?? '',
    strategicAlignment: project.strategicAlignment ?? '',
    projectPurpose: project.projectPurpose ?? project.summary ?? '',
    scopeStatement: project.scopeStatement ?? '',
    expectedStartMonth: project.expectedStartMonth ?? '',
    durationMonths: project.durationMonths ?? '',
    strategicPriorityPeriodId: project.strategicPriorityPeriodId ?? '',
    strategicPriorityPeriodLabel: project.strategicPriorityPeriodLabel ?? '',
    costEstimateBreakdownFiles: project.costEstimateBreakdownFiles ?? [],
    scopeStatementFiles: project.scopeStatementFiles ?? [],
    documentVersions,
    teamMembers: Array.isArray(project.teamMembers)
      ? project.teamMembers
      : String(project.teamMembers ?? '')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    expectedOutcomes: Array.isArray(project.expectedOutcomes)
      ? project.expectedOutcomes
      : String(project.expectedOutcomes ?? '')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    potentialRisks: Array.isArray(project.potentialRisks)
      ? project.potentialRisks
      : String(project.potentialRisks ?? '')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    assumptions: Array.isArray(project.assumptions)
      ? project.assumptions
      : String(project.assumptions ?? '')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    milestones: Array.isArray(project.milestones)
      ? project.milestones.map((milestone, index) => ({
          id: milestone.id ?? `MS-${project.id ?? 'NEW'}-${index + 1}`,
          name: milestone.name ?? '',
          description: milestone.description ?? '',
          quarter: milestone.quarter ?? milestone.plannedDate ?? '',
          originalQuarter:
            milestone.originalQuarter
            ?? milestone.originalPlannedDate
            ?? milestone.quarter
            ?? milestone.plannedDate
            ?? '',
          actualDate: milestone.actualDate ?? '',
        }))
      : [],
    proposalStatus: project.stage === 'submitted'
      ? (project.proposalStatus ?? (project.status === 'wip' ? 'wip' : 'new_submission'))
      : '',
    weeklyUpdates: Array.isArray(project.weeklyUpdates)
      ? project.weeklyUpdates.map((entry) => ({
          weekStart: entry.weekStart ?? '',
          cadence: entry.cadence === 'monthly' ? 'monthly' : 'weekly',
          plan: entry.plan ?? '',
          progress: entry.progress ?? '',
          overallStatus: entry.overallStatus ?? '',
        }))
      : [],
  };
}

function mergeSeededProjectDefaults(project) {
  const seededProject = SEEDED_PROJECTS.find((candidate) => candidate.id === project.id);
  if (!seededProject) return normalizeProject(project);

  const nextProject = { ...project };

  if (seededProject.stage === 'current' && project.stage !== 'current') {
    nextProject.stage = seededProject.stage;
    nextProject.status = seededProject.status;
  }

  if (!project.currentProjectClassification && seededProject.currentProjectClassification) {
    nextProject.currentProjectClassification = seededProject.currentProjectClassification;
  }

  if (seededProject.executiveSponsor && project.executiveSponsor !== seededProject.executiveSponsor) {
    nextProject.executiveSponsor = seededProject.executiveSponsor;
  }

  if (seededProject.strategicPriorityPeriodLabel && !project.strategicPriorityPeriodLabel) {
    nextProject.strategicPriorityPeriodLabel = seededProject.strategicPriorityPeriodLabel;
  }

  if (!project.reviewNotes && seededProject.reviewNotes) {
    nextProject.reviewNotes = seededProject.reviewNotes;
  }

  return normalizeProject(nextProject);
}

function isOperationalProject(project) {
  return project.currentProjectClassification === 'Operational project';
}

function buildNextNumericId(prefix, existingIds) {
  const prefixWithDash = `${prefix}-`;
  const nextNumber = existingIds.reduce((max, value) => {
    const normalizedValue = String(value ?? '');
    if (!normalizedValue.startsWith(prefixWithDash)) return max;

    const suffix = Number(normalizedValue.slice(prefixWithDash.length));
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0) + 1;

  return `${prefix}-${nextNumber}`;
}

function sortPriorityPeriods(periods) {
  return [...periods].sort((left, right) => {
    if (left.status === 'active' && right.status !== 'active') return -1;
    if (left.status !== 'active' && right.status === 'active') return 1;

    if (Number(right.startYear) !== Number(left.startYear)) {
      return Number(right.startYear) - Number(left.startYear);
    }

    if (Number(right.endYear) !== Number(left.endYear)) {
      return Number(right.endYear) - Number(left.endYear);
    }

    return String(right.approvedOn ?? '').localeCompare(String(left.approvedOn ?? ''));
  });
}

function ensureProjectSeedVersion() {
  const currentVersion = window.localStorage.getItem(PROJECTS_DATA_VERSION_STORAGE_KEY);
  if (currentVersion === PROJECTS_DATA_VERSION) return;

  window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
  window.localStorage.setItem(PROJECTS_DATA_VERSION_STORAGE_KEY, PROJECTS_DATA_VERSION);
}

function ensureReferenceDataVersion() {
  const currentVersion = window.localStorage.getItem(REFERENCE_DATA_VERSION_STORAGE_KEY);
  if (currentVersion === REFERENCE_DATA_VERSION) return;

  window.localStorage.removeItem(PRIORITIES_STORAGE_KEY);
  window.localStorage.removeItem(OPERATIONAL_INITIATIVES_STORAGE_KEY);
  window.localStorage.setItem(REFERENCE_DATA_VERSION_STORAGE_KEY, REFERENCE_DATA_VERSION);
}

function buildPriorityPeriodLabel(startYear, endYear) {
  const normalizedStartYear = Number(startYear) || new Date().getFullYear();
  const normalizedEndYear = Number(endYear) || normalizedStartYear;
  return `Strategic Priorities ${normalizedStartYear}-${normalizedEndYear}`;
}

function normalizePriorityPeriod(period, index = 0) {
  const fallbackStartYear = Number(
    String(period.startYear ?? period.effectiveStart ?? '').slice(0, 4),
  ) || (new Date().getFullYear() + index);
  const fallbackEndYear = Number(period.endYear) || fallbackStartYear;
  const normalizedApprovedOn = period.approvedOn
    ?? period.effectiveStart
    ?? `${fallbackStartYear}-01-01`;

  return {
    id: period.id ?? `SPP-${Date.now()}-${index + 1}`,
    label: period.label ?? buildPriorityPeriodLabel(fallbackStartYear, fallbackEndYear),
    approvedOn: normalizedApprovedOn,
    startYear: fallbackStartYear,
    endYear: fallbackEndYear,
    status: period.status === 'active' ? 'active' : 'archived',
    priorities: Array.isArray(period.priorities)
      ? period.priorities.map((priority, priorityIndex) => ({
          id: priority.id ?? `SP-${Date.now()}-${index + 1}-${priorityIndex + 1}`,
          title: priority.title ?? priority.name ?? '',
          description: priority.description ?? '',
        }))
      : [],
  };
}

function normalizeOperationalInitiative(initiative, index = 0) {
  const fallbackYear = Number(initiative.year)
    || Number(String(initiative.approvedOn ?? '').slice(0, 4))
    || new Date().getFullYear();

  return {
    id: initiative.id ?? `AOI-${Date.now()}-${index + 1}`,
    title: initiative.title ?? initiative.name ?? '',
    year: fallbackYear,
    owner: initiative.owner ?? '',
    strategicPriorityId: initiative.strategicPriorityId ?? '',
    strategicPriorityTitle: initiative.strategicPriorityTitle ?? initiative.strategicAlignment ?? '',
    strategicPriorityPeriodId: initiative.strategicPriorityPeriodId ?? '',
    strategicPriorityPeriodLabel: initiative.strategicPriorityPeriodLabel ?? '',
    description: initiative.description ?? '',
    milestones: Array.isArray(initiative.milestones)
      ? initiative.milestones.map((milestone, milestoneIndex) => ({
          id: milestone.id ?? `AOI-MS-${Date.now()}-${index + 1}-${milestoneIndex + 1}`,
          title: milestone.title ?? milestone.name ?? '',
          description: milestone.description ?? '',
          plannedDate: milestone.plannedDate ?? milestone.quarter ?? '',
          originalPlannedDate:
            milestone.originalPlannedDate
            ?? milestone.originalQuarter
            ?? milestone.plannedDate
            ?? milestone.quarter
            ?? '',
          actualDate: milestone.actualDate ?? '',
        }))
      : [],
    monthlyProgressUpdates: Array.isArray(initiative.monthlyProgressUpdates)
      ? initiative.monthlyProgressUpdates.map((update, updateIndex) => ({
          id: update.id ?? `AOI-UPD-${Date.now()}-${index + 1}-${updateIndex + 1}`,
          month: update.month ?? '',
          createdAt: update.createdAt ?? '',
          scopeStatus: update.scopeStatus ?? 'green',
          scheduleStatus: update.scheduleStatus ?? 'green',
          costStatus: update.costStatus ?? 'green',
          riskStatus: update.riskStatus ?? 'green',
          qualityStatus: update.qualityStatus ?? 'green',
          overallStatus: update.overallStatus ?? 'green',
          statusExplanation: update.statusExplanation ?? '',
          accomplishments: Array.isArray(update.accomplishments)
            ? update.accomplishments.map((value) => String(value ?? '').trim()).filter(Boolean)
            : [],
          commitments: Array.isArray(update.commitments)
            ? update.commitments.map((value) => String(value ?? '').trim()).filter(Boolean)
            : [],
          milestoneChanges: update.milestoneChanges ?? '',
          newRisks: Array.isArray(update.newRisks)
            ? update.newRisks.map((value) => String(value ?? '').trim()).filter(Boolean)
            : [],
          decisionsNeeded: update.decisionsNeeded ?? '',
          helpNeeded: update.helpNeeded ?? '',
          notes: update.notes ?? '',
        }))
      : [],
  };
}

function sortOperationalInitiatives(initiatives) {
  return [...initiatives].sort((left, right) => {
    if (Number(right.year) !== Number(left.year)) {
      return Number(right.year) - Number(left.year);
    }

    return String(left.title ?? '').localeCompare(String(right.title ?? ''));
  });
}

function readStoredOperationalInitiatives() {
  const raw = window.localStorage.getItem(OPERATIONAL_INITIATIVES_STORAGE_KEY);
  if (!raw) return sortOperationalInitiatives(SEEDED_OPERATIONAL_INITIATIVES);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return sortOperationalInitiatives(SEEDED_OPERATIONAL_INITIATIVES);
    }

    return sortOperationalInitiatives(parsed.map(normalizeOperationalInitiative));
  } catch {
    window.localStorage.removeItem(OPERATIONAL_INITIATIVES_STORAGE_KEY);
    return sortOperationalInitiatives(SEEDED_OPERATIONAL_INITIATIVES);
  }
}

function findStrategicPriority(priorityPeriods, priorityId, priorityTitle = '') {
  const priorities = priorityPeriods.flatMap((period) => period.priorities ?? []);
  return priorities.find((priority) => priority.id === priorityId)
    ?? priorities.find((priority) => priority.title === priorityTitle)
    ?? null;
}

function hydrateProjectAlignment(project, operationalInitiatives, priorityPeriods) {
  const initiative = operationalInitiatives.find((candidate) => candidate.id === project.operationalInitiativeId)
    ?? operationalInitiatives.find((candidate) => candidate.title === project.operationalInitiativeTitle)
    ?? null;
  const strategicPriority = initiative
    ? findStrategicPriority(priorityPeriods, initiative.strategicPriorityId, initiative.strategicPriorityTitle)
    : findStrategicPriority(priorityPeriods, project.strategicPriorityId, project.strategicPriorityTitle || project.strategicAlignment);

  return {
    ...project,
    operationalInitiativeId: initiative?.id ?? project.operationalInitiativeId ?? '',
    operationalInitiativeTitle: initiative?.title ?? project.operationalInitiativeTitle ?? '',
    strategicPriorityId: strategicPriority?.id
      ?? initiative?.strategicPriorityId
      ?? project.strategicPriorityId
      ?? '',
    strategicPriorityTitle: strategicPriority?.title
      ?? initiative?.strategicPriorityTitle
      ?? project.strategicPriorityTitle
      ?? project.strategicAlignment
      ?? '',
    strategicAlignment: strategicPriority?.title
      ?? initiative?.strategicPriorityTitle
      ?? project.strategicPriorityTitle
      ?? project.strategicAlignment
      ?? '',
    strategicPriorityPeriodId: initiative?.strategicPriorityPeriodId ?? project.strategicPriorityPeriodId ?? '',
    strategicPriorityPeriodLabel: initiative?.strategicPriorityPeriodLabel ?? project.strategicPriorityPeriodLabel ?? '',
  };
}

function readStoredProjects() {
  const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) return SEEDED_PROJECTS;

  try {
    return JSON.parse(raw).map(mergeSeededProjectDefaults);
  } catch {
    window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
    return SEEDED_PROJECTS;
  }
}

function readStoredPriorities() {
  const raw = window.localStorage.getItem(PRIORITIES_STORAGE_KEY);
  if (!raw) return sortPriorityPeriods(SEEDED_STRATEGIC_PRIORITY_PERIODS);

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => Array.isArray(item.priorities))) {
      return sortPriorityPeriods(parsed.map(normalizePriorityPeriod));
    }

    if (Array.isArray(parsed)) {
      return [
        {
          id: 'SPP-LEGACY',
          label: 'Strategic Priorities 2026-2026',
          approvedOn: '2026-01-01',
          startYear: 2026,
          endYear: 2026,
          status: 'active',
          priorities: parsed.map((priority, index) => ({
            id: priority.id ?? `SP-LEGACY-${index + 1}`,
            title: priority.title ?? priority.name ?? '',
            description: priority.description ?? '',
          })),
        },
      ];
    }

    return SEEDED_STRATEGIC_PRIORITY_PERIODS;
  } catch {
    window.localStorage.removeItem(PRIORITIES_STORAGE_KEY);
    return SEEDED_STRATEGIC_PRIORITY_PERIODS;
  }
}

const PpmProjectsContext = createContext(null);

export function PpmProjectsProvider({ children }) {
  ensureProjectSeedVersion();
  ensureReferenceDataVersion();

  const [projects, setProjects] = useState(() => readStoredProjects());
  const [strategicPriorityPeriods, setStrategicPriorityPeriods] = useState(() => readStoredPriorities());
  const [operationalInitiatives, setOperationalInitiatives] = useState(() => readStoredOperationalInitiatives());

  function persist(nextProjects) {
    setProjects(nextProjects);
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nextProjects));
  }

  function persistPriorities(nextPriorities) {
    const normalized = sortPriorityPeriods(nextPriorities.map(normalizePriorityPeriod));
    setStrategicPriorityPeriods(normalized);
    window.localStorage.setItem(PRIORITIES_STORAGE_KEY, JSON.stringify(normalized));
  }

  function persistOperationalInitiatives(nextInitiatives) {
    const normalized = sortOperationalInitiatives(
      nextInitiatives.map(normalizeOperationalInitiative),
    );
    setOperationalInitiatives(normalized);
    window.localStorage.setItem(OPERATIONAL_INITIATIVES_STORAGE_KEY, JSON.stringify(normalized));
  }

  function applyProjectMilestoneUpdates(existingProjects, updatesByProject) {
    const normalizedUpdates = new Map(
      updatesByProject.map(({ projectId, milestones }) => ([
        projectId,
        Array.isArray(milestones)
          ? milestones
            .map((milestone, index) => {
              const name = String(milestone.name ?? '').trim();
              if (!name) return null;
              const description = String(milestone.description ?? '').trim();

              const plannedDate = String(
                milestone.quarter
                ?? milestone.plannedDate
                ?? '',
              ).trim();
              const originalQuarter = String(
                milestone.originalQuarter
                ?? milestone.originalPlannedDate
                ?? plannedDate,
              ).trim() || plannedDate;
              const actualDate = String(milestone.actualDate ?? '').trim();

              return {
                id: milestone.id ?? `MS-${projectId}-${Date.now()}-${index + 1}`,
                name,
                description,
                quarter: plannedDate,
                originalQuarter,
                actualDate,
              };
            })
            .filter(Boolean)
          : [],
      ])),
    );

    return existingProjects.map((project) => (
      normalizedUpdates.has(project.id)
        ? {
            ...project,
            milestones: normalizedUpdates.get(project.id),
          }
        : project
    ));
  }

  function submitProject(project) {
    const proposalId = buildNextNumericId(
      'PRJ',
      projects.map((existingProject) => existingProject.id),
    );
    const nextProject = {
      ...project,
      proposalId,
      currentProjectClassification: '',
      strategicPriorityPeriodId:
        project.strategicPriorityPeriodId ?? activeStrategicPriorityPeriod?.id ?? '',
      strategicPriorityPeriodLabel:
        project.strategicPriorityPeriodLabel ?? activeStrategicPriorityPeriod?.label ?? '',
      id: proposalId,
      stage: 'submitted',
      status: 'pending_review',
      proposalStatus: 'new_submission',
      submittedAt: new Date().toISOString().slice(0, 10),
      reviewNotes: '',
    };

    persist([nextProject, ...projects]);
    return nextProject;
  }

  function addOperationalInitiative(initiative) {
    const strategicPriority = findStrategicPriority(
      strategicPriorityPeriods,
      initiative.strategicPriorityId,
      initiative.strategicPriorityTitle,
    );
    const nextInitiative = {
      id: buildNextNumericId(
        'AOI',
        operationalInitiatives.map((existingInitiative) => existingInitiative.id),
      ),
      title: initiative.title ?? '',
      year: Number(initiative.year) || new Date().getFullYear(),
      strategicPriorityId: strategicPriority?.id ?? initiative.strategicPriorityId ?? '',
      strategicPriorityTitle: strategicPriority?.title ?? initiative.strategicPriorityTitle ?? '',
      strategicPriorityPeriodId:
        initiative.strategicPriorityPeriodId ?? activeStrategicPriorityPeriod?.id ?? '',
      strategicPriorityPeriodLabel:
        initiative.strategicPriorityPeriodLabel ?? activeStrategicPriorityPeriod?.label ?? '',
      description: initiative.description ?? '',
      owner: initiative.owner ?? '',
      milestones: [],
      monthlyProgressUpdates: [],
    };

    persistOperationalInitiatives([nextInitiative, ...operationalInitiatives]);
    return nextInitiative;
  }

  function saveOperationalInitiativeMonthlyUpdate(initiativeId, monthlyUpdate) {
    persistOperationalInitiatives(
      operationalInitiatives.map((initiative) => {
        if (initiative.id !== initiativeId) return initiative;

        const existingUpdates = Array.isArray(initiative.monthlyProgressUpdates)
          ? initiative.monthlyProgressUpdates
          : [];
        const nextMonth = monthlyUpdate.month ?? new Date().toISOString().slice(0, 7);
        const nextUpdate = normalizeOperationalInitiative({
          ...initiative,
          monthlyProgressUpdates: [
            {
              id: monthlyUpdate.id ?? `AOI-UPD-${Date.now()}`,
              month: nextMonth,
              createdAt: monthlyUpdate.createdAt ?? new Date().toISOString(),
              scopeStatus: monthlyUpdate.scopeStatus ?? 'green',
              scheduleStatus: monthlyUpdate.scheduleStatus ?? 'green',
              costStatus: monthlyUpdate.costStatus ?? 'green',
              riskStatus: monthlyUpdate.riskStatus ?? 'green',
              qualityStatus: monthlyUpdate.qualityStatus ?? 'green',
              overallStatus: monthlyUpdate.overallStatus ?? 'green',
              statusExplanation: monthlyUpdate.statusExplanation ?? '',
              accomplishments: monthlyUpdate.accomplishments ?? [],
              commitments: monthlyUpdate.commitments ?? [],
              milestoneChanges: monthlyUpdate.milestoneChanges ?? '',
              newRisks: monthlyUpdate.newRisks ?? [],
              decisionsNeeded: monthlyUpdate.decisionsNeeded ?? '',
              helpNeeded: monthlyUpdate.helpNeeded ?? '',
              notes: monthlyUpdate.notes ?? '',
            },
          ],
        }).monthlyProgressUpdates[0];

        return {
          ...initiative,
          monthlyProgressUpdates: [
            nextUpdate,
            ...existingUpdates.filter((update) => String(update.month ?? '') !== String(nextMonth)),
          ].sort(
            (left, right) => String(right.month ?? '').localeCompare(String(left.month ?? '')),
          ),
        };
      }),
    );
  }

  function saveOperationalInitiativeMilestones(initiativeId, milestones) {
    persistOperationalInitiatives(
      operationalInitiatives.map((initiative) => {
        if (initiative.id !== initiativeId) return initiative;

        const nextMilestones = Array.isArray(milestones)
          ? milestones
            .map((milestone, index) => {
              const title = String(milestone.title ?? milestone.name ?? '').trim();
              if (!title) return null;

              const plannedDate = String(milestone.plannedDate ?? milestone.quarter ?? '').trim();
              const originalPlannedDate = String(
                milestone.originalPlannedDate
                ?? milestone.originalQuarter
                ?? plannedDate,
              ).trim() || plannedDate;

              return {
                id: milestone.id ?? `AOI-MS-${initiativeId}-${Date.now()}-${index + 1}`,
                title,
                description: String(milestone.description ?? '').trim(),
                plannedDate,
                originalPlannedDate,
                actualDate: String(milestone.actualDate ?? '').trim(),
              };
            })
            .filter(Boolean)
          : [];

        return {
          ...initiative,
          milestones: nextMilestones,
        };
      }),
    );
  }

  function saveOperationalInitiativeOwner(initiativeId, owner) {
    persistOperationalInitiatives(
      operationalInitiatives.map((initiative) => (
        initiative.id === initiativeId
          ? {
              ...initiative,
              owner: String(owner ?? '').trim(),
            }
          : initiative
      )),
    );
  }

  function addStrategicPriorityPeriod(period) {
    const nextPeriods = strategicPriorityPeriods.map((existingPeriod) => ({
      ...existingPeriod,
      status: 'archived',
    }));

    const nextPeriod = {
      id: `SPP-${Math.floor(Date.now() / 1000)}`,
      label: buildPriorityPeriodLabel(period.startYear, period.endYear),
      approvedOn: period.approvedOn,
      startYear: Number(period.startYear),
      endYear: Number(period.endYear),
      status: 'active',
      priorities: Array.isArray(period.priorities)
        ? period.priorities.map((priority, index) => ({
            id: priority.id ?? `SP-${Math.floor(Date.now() / 1000)}-${index + 1}`,
            title: priority.title ?? '',
            description: priority.description ?? '',
          }))
        : [],
    };

    persistPriorities([nextPeriod, ...nextPeriods]);
    return nextPeriod;
  }

  function addStrategicPriority(periodId, priority) {
    const nextPriority = {
      id: `SP-${Math.floor(Date.now() / 1000)}`,
      title: priority.title ?? '',
      description: priority.description ?? '',
    };

    persistPriorities(
      strategicPriorityPeriods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              priorities: [nextPriority, ...period.priorities],
            }
          : period,
      ),
    );
    return nextPriority;
  }

  function activateStrategicPriorityPeriod(periodId) {
    persistPriorities(
      strategicPriorityPeriods.map((period) => ({
        ...period,
        status: period.id === periodId ? 'active' : 'archived',
      })),
    );
  }

  function reviewProjectProposal(
    projectId,
    decision,
    reviewNotes = '',
    currentProjectClassification = '',
  ) {
    const normalizedClassification =
      CURRENT_PROJECT_CLASSIFICATION_OPTIONS.includes(currentProjectClassification)
        ? currentProjectClassification
        : '';

    persist(
      projects.map((project) => {
        if (project.id !== projectId) return project;

        if (decision === 'approve') {
          return {
            ...project,
            stage: 'current',
            status: 'active',
            proposalStatus: '',
            currentProjectClassification:
              normalizedClassification || project.currentProjectClassification || '',
            reviewNotes: reviewNotes || project.reviewNotes,
          };
        }

        if (decision === 'deny') {
          return {
            ...project,
            stage: 'archived',
            status: 'denied',
            proposalStatus: '',
            reviewNotes: reviewNotes || project.reviewNotes,
          };
        }

        if (decision === 'hold') {
          return {
            ...project,
            stage: 'future',
            status: 'planned',
            proposalStatus: '',
            reviewNotes: reviewNotes || project.reviewNotes,
          };
        }

        return {
          ...project,
          stage: 'submitted',
          status: 'wip',
          proposalStatus: 'wip',
          reviewNotes: reviewNotes || project.reviewNotes,
        };
      }),
    );
  }

  function updateFutureStatus(projectId, nextStatus, reviewNotes = '', currentProjectClassification = '') {
    const normalizedClassification =
      CURRENT_PROJECT_CLASSIFICATION_OPTIONS.includes(currentProjectClassification)
        ? currentProjectClassification
        : '';

    persist(
      projects.map((project) => {
        if (project.id !== projectId) return project;

        if (nextStatus === 'approved') {
          return {
            ...project,
            stage: 'current',
            status: 'active',
            currentProjectClassification:
              normalizedClassification || project.currentProjectClassification || '',
            reviewNotes: reviewNotes || project.reviewNotes,
          };
        }

        if (nextStatus === 'denied') {
          return {
            ...project,
            stage: 'archived',
            status: 'denied',
            reviewNotes: reviewNotes || project.reviewNotes,
          };
        }

        return {
          ...project,
          stage: 'future',
          status: 'hold',
          reviewNotes: reviewNotes || project.reviewNotes,
        };
      }),
    );
  }

  function saveWeeklyUpdate(projectId, weeklyUpdate) {
    persist(
      projects.map((project) => {
        if (project.id !== projectId) return project;

        const existingEntries = Array.isArray(project.weeklyUpdates) ? project.weeklyUpdates : [];
        const nextEntries = existingEntries.some((entry) => entry.weekStart === weeklyUpdate.weekStart)
          ? existingEntries.map((entry) => (
              entry.weekStart === weeklyUpdate.weekStart ? { ...entry, ...weeklyUpdate } : entry
            ))
          : [...existingEntries, weeklyUpdate];

        return {
          ...project,
          weeklyUpdates: nextEntries.sort((left, right) => left.weekStart.localeCompare(right.weekStart)),
        };
      }),
    );
  }

  function saveTeamMembers(projectId, teamMembers) {
    persist(
      projects.map((project) => (
        project.id === projectId
          ? {
              ...project,
              teamMembers: Array.isArray(teamMembers)
                ? teamMembers.map((member) => String(member).trim()).filter(Boolean)
                : [],
            }
          : project
      )),
    );
  }

  function saveDocumentVersion(projectId, documentInput) {
    persist(
      projects.map((project) => {
        if (project.id !== projectId) return project;

        const existingDocuments = Array.isArray(project.documentVersions) ? project.documentVersions : [];
        const currentDocuments = existingDocuments.map((document) => (
          document.category === documentInput.category
            ? { ...document, isCurrent: false }
            : document
        ));
        const highestVersion = currentDocuments
          .filter((document) => document.category === documentInput.category)
          .reduce((max, document) => Math.max(max, Number(document.versionNumber) || 0), 0);

        const nextDocument = {
          id: `DOC-${projectId}-${Date.now()}`,
          category: documentInput.category,
          versionNumber: highestVersion + 1,
          fileName: documentInput.fileName,
          comments: documentInput.comments ?? '',
          uploadedAt: new Date().toISOString().slice(0, 10),
          isCurrent: true,
        };

        const nextDocuments = [...currentDocuments, nextDocument];

        return {
          ...project,
          documentVersions: nextDocuments,
          costEstimateBreakdownFiles: nextDocuments
            .filter((document) => document.category === 'Cost Estimate Breakdown' && document.isCurrent)
            .map((document) => document.fileName),
          scopeStatementFiles: nextDocuments
            .filter((document) => document.category === 'Scope Statement' && document.isCurrent)
            .map((document) => document.fileName),
        };
      }),
    );
  }

  function saveProjectMilestones(projectId, milestones) {
    persist(
      applyProjectMilestoneUpdates(projects, [{ projectId, milestones }]),
    );
  }

  function saveProjectMilestonesBulk(projectMilestoneUpdates) {
    persist(
      applyProjectMilestoneUpdates(
        projects,
        Array.isArray(projectMilestoneUpdates) ? projectMilestoneUpdates : [],
      ),
    );
  }

  const activeStrategicPriorityPeriod = strategicPriorityPeriods.find((period) => period.status === 'active')
    ?? strategicPriorityPeriods[0]
    ?? null;

  const projectsWithAlignment = projects.map((project) => hydrateProjectAlignment(
    project,
    operationalInitiatives,
    strategicPriorityPeriods,
  ));
  const visibleProjects = projectsWithAlignment.filter((project) => !isOperationalProject(project));

  const value = {
    projects: visibleProjects,
    getProjectById: (projectId) => visibleProjects.find((project) => project.id === projectId) ?? null,
    submittedProjects: visibleProjects.filter((project) => project.stage === 'submitted'),
    futureProjects: visibleProjects.filter(
      (project) => project.stage === 'future' && project.status !== 'denied',
    ),
    archivedProposals: visibleProjects.filter(
      (project) => project.stage === 'archived' || project.status === 'denied',
    ),
    currentProjects: visibleProjects.filter((project) => project.stage === 'current'),
    strategicPriorityPeriods,
    activeStrategicPriorityPeriod,
    strategicPriorities: activeStrategicPriorityPeriod?.priorities ?? [],
    operationalInitiatives,
    submitProject,
    reviewProjectProposal,
    updateFutureStatus,
    saveWeeklyUpdate,
    saveOperationalInitiativeMonthlyUpdate,
    saveOperationalInitiativeMilestones,
    saveOperationalInitiativeOwner,
    saveTeamMembers,
    saveDocumentVersion,
    saveProjectMilestones,
    saveProjectMilestonesBulk,
    addStrategicPriorityPeriod,
    addStrategicPriority,
    addOperationalInitiative,
    activateStrategicPriorityPeriod,
  };

  return (
    <PpmProjectsContext.Provider value={value}>{children}</PpmProjectsContext.Provider>
  );
}

export function usePpmProjects() {
  const context = useContext(PpmProjectsContext);
  if (!context) {
    throw new Error('usePpmProjects must be used within PpmProjectsProvider');
  }

  return context;
}
