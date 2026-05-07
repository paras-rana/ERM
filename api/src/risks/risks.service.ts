import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MITIGATION_STATUSES = [
  'Planned',
  'In Progress',
  'Implemented',
  'On Hold',
  'Cancelled',
] as const;

const ASSESSMENT_TYPES = ['INHERENT', 'RESIDUAL'] as const;

const RISK_STATUSES = ['Open', 'Monitoring', 'Mitigating', 'Accepted', 'Closed'] as const;

const DEFAULT_DEPARTMENT_BY_CATEGORY: Record<string, string> = {
  Clinical: 'Clinical Operations',
  Compliance: 'Compliance',
  Operations: 'Operations',
  Finance: 'Finance',
  Workforce: 'People',
  Safety: 'Safety',
  IT: 'Technology',
  Facilities: 'Facilities',
};

const SEEDED_PROJECT_RISKS: CreateRiskInput[] = [
  {
    title: 'Digital adoption lags in pilot clinics',
    description:
      'Patient self-service enrollment could trail plan and reduce the expected access improvement from the digital front door launch.',
    category: 'Clinical',
    owner_name: 'Alicia Gomez',
    owner_email: 'alicia.gomez@riskapp.local',
    site_or_program: 'PRJ-201',
    status: 'Mitigating',
    inherent_severity: 4,
    inherent_probability: 4,
    residual_severity: 3,
    residual_probability: 3,
    residual_notes: 'Pilot training and targeted clinic support are in flight.',
    next_review_due: '2026-04-10',
  },
  {
    title: 'Scheduling integration defects delay cutover',
    description:
      'Integration gaps between intake, scheduling, and downstream systems could push back the pilot launch.',
    category: 'IT',
    owner_name: 'Alicia Gomez',
    owner_email: 'alicia.gomez@riskapp.local',
    site_or_program: 'PRJ-201',
    status: 'Open',
    inherent_severity: 5,
    inherent_probability: 3,
    residual_severity: 4,
    residual_probability: 2,
    residual_notes: 'Interface testing is planned before pilot cutover.',
    next_review_due: '2026-04-17',
  },
  {
    title: 'Frontline staffing model adoption is inconsistent',
    description:
      'Ambulatory leaders may apply redesigned staffing templates unevenly, reducing expected labor productivity gains.',
    category: 'Workforce',
    owner_name: 'M. Patel',
    owner_email: 'm.patel@riskapp.local',
    site_or_program: 'PRJ-214',
    status: 'Monitoring',
    inherent_severity: 4,
    inherent_probability: 3,
    residual_severity: 3,
    residual_probability: 2,
    residual_notes: 'Weekly site review cadence is in place.',
    next_review_due: '2026-04-08',
  },
  {
    title: 'Analytics data quality weakens staffing recommendations',
    description:
      'Source schedule and labor data inconsistencies could undermine confidence in optimization outputs.',
    category: 'Operations',
    owner_name: 'M. Patel',
    owner_email: 'm.patel@riskapp.local',
    site_or_program: 'PRJ-214',
    status: 'Mitigating',
    inherent_severity: 4,
    inherent_probability: 4,
    residual_severity: 3,
    residual_probability: 3,
    residual_notes: 'Data validation checks are being added before broader rollout.',
    next_review_due: '2026-04-15',
  },
  {
    title: 'Premium labor savings are not realized on schedule',
    description:
      'Even with new staffing workflows, sites may continue overtime and agency usage above plan for multiple quarters.',
    category: 'Finance',
    owner_name: 'M. Patel',
    owner_email: 'm.patel@riskapp.local',
    site_or_program: 'PRJ-214',
    status: 'Open',
    inherent_severity: 3,
    inherent_probability: 4,
    residual_severity: 2,
    residual_probability: 3,
    residual_notes: 'Savings tracking dashboard will be reviewed monthly.',
    next_review_due: '2026-04-22',
  },
  {
    title: 'AI exception routing misclassifies high-value claims',
    description:
      'Automation logic could route claims incorrectly and create avoidable denials or delayed collections.',
    category: 'Finance',
    owner_name: 'Jordan Lee',
    owner_email: 'jordan.lee@riskapp.local',
    site_or_program: 'PRJ-223',
    status: 'Mitigating',
    inherent_severity: 5,
    inherent_probability: 3,
    residual_severity: 3,
    residual_probability: 2,
    residual_notes: 'Exception thresholds and human review gates are being tuned.',
    next_review_due: '2026-04-12',
  },
  {
    title: 'Collector workflow redesign stalls user adoption',
    description:
      'Revenue cycle teams may keep legacy workqueue habits and limit the value of AI-assisted triage.',
    category: 'Operations',
    owner_name: 'Jordan Lee',
    owner_email: 'jordan.lee@riskapp.local',
    site_or_program: 'PRJ-223',
    status: 'Monitoring',
    inherent_severity: 3,
    inherent_probability: 4,
    residual_severity: 2,
    residual_probability: 3,
    residual_notes: 'Super-user training and adoption tracking are planned.',
    next_review_due: '2026-04-19',
  },
  {
    title: 'Vendor model transparency is insufficient for compliance review',
    description:
      'Opaque AI decision logic could slow approval and limit use in production denial-prevention workflows.',
    category: 'Compliance',
    owner_name: 'Jordan Lee',
    owner_email: 'jordan.lee@riskapp.local',
    site_or_program: 'PRJ-223',
    status: 'Open',
    inherent_severity: 4,
    inherent_probability: 3,
    residual_severity: 3,
    residual_probability: 2,
    residual_notes: 'Model review artifacts are being requested from the vendor.',
    next_review_due: '2026-04-26',
  },
  {
    title: 'Supply master data gaps reduce visibility accuracy',
    description:
      'Inconsistent item and vendor master records could weaken the reliability of the new supply chain operating view.',
    category: 'Operations',
    owner_name: 'Rina Shah',
    owner_email: 'rina.shah@riskapp.local',
    site_or_program: 'PRJ-230',
    status: 'Open',
    inherent_severity: 4,
    inherent_probability: 4,
    residual_severity: 3,
    residual_probability: 3,
    residual_notes: 'Data normalization requirements are being defined in discovery.',
    next_review_due: '2026-04-11',
  },
  {
    title: 'Shortage alerting arrives too late to avoid disruption',
    description:
      'If inbound signals are delayed or incomplete, clinical teams may still face preventable supply interruptions.',
    category: 'Clinical',
    owner_name: 'Rina Shah',
    owner_email: 'rina.shah@riskapp.local',
    site_or_program: 'PRJ-230',
    status: 'Monitoring',
    inherent_severity: 4,
    inherent_probability: 3,
    residual_severity: 3,
    residual_probability: 2,
    residual_notes: 'Escalation workflows are being designed with operations leaders.',
    next_review_due: '2026-04-18',
  },
  {
    title: 'Privileged access remediation slips past committed windows',
    description:
      'Core platform owners may not complete privileged identity remediation in time to reduce cyber exposure materially.',
    category: 'IT',
    owner_name: 'Chris Nolan',
    owner_email: 'chris.nolan@riskapp.local',
    site_or_program: 'PRJ-233',
    status: 'Mitigating',
    inherent_severity: 5,
    inherent_probability: 4,
    residual_severity: 4,
    residual_probability: 2,
    residual_notes: 'Wave planning and executive checkpoints have been established.',
    next_review_due: '2026-04-09',
  },
  {
    title: 'Recovery testing exposes unresolved resilience gaps',
    description:
      'Planned recovery exercises may reveal material dependencies that require more funding or sequencing changes.',
    category: 'IT',
    owner_name: 'Chris Nolan',
    owner_email: 'chris.nolan@riskapp.local',
    site_or_program: 'PRJ-233',
    status: 'Open',
    inherent_severity: 5,
    inherent_probability: 3,
    residual_severity: 4,
    residual_probability: 2,
    residual_notes: 'Recovery scope and fallback procedures are under review.',
    next_review_due: '2026-04-16',
  },
  {
    title: 'Audit evidence is insufficient for control uplift claims',
    description:
      'Control implementation may outpace evidence capture, creating residual compliance and audit exposure.',
    category: 'Compliance',
    owner_name: 'Chris Nolan',
    owner_email: 'chris.nolan@riskapp.local',
    site_or_program: 'PRJ-233',
    status: 'Monitoring',
    inherent_severity: 4,
    inherent_probability: 3,
    residual_severity: 2,
    residual_probability: 2,
    residual_notes: 'Evidence standards are being documented before rollout accelerates.',
    next_review_due: '2026-04-23',
  },
];

type RiskRow = {
  risk_id: string;
  title: string;
  description: string | null;
  category: string;
  department: string | null;
  status: string;
  site_or_program: string | null;
  inherent_severity: number;
  inherent_probability: number;
  inherent_score: number;
  residual_severity: number | null;
  residual_probability: number | null;
  residual_score: number | null;
  last_reassessed_at: Date | null;
};

// Row returned immediately after risk creation.
type CreatedRiskRow = {
  risk_id: string;
  title: string;
  category: string;
  department: string | null;
  status: string;
  owner_name: string | null;
  site_or_program: string | null;
  inherent_severity: number;
  inherent_probability: number;
  inherent_score: number;
  residual_severity: number | null;
  residual_probability: number | null;
  residual_score: number | null;
  last_reassessed_at: Date | null;
  next_review_due: Date | null;
};

export type CreateRiskInput = {
  title?: string;
  description?: string;
  category?: string;
  department?: string;
  owner_name?: string;
  owner_email?: string;
  site_or_program?: string;
  status?: string;
  inherent_severity?: number | string;
  inherent_probability?: number | string;
  residual_severity?: number | string | null;
  residual_probability?: number | string | null;
  residual_notes?: string;
  next_review_due?: string | null;
};

// Request payload for mitigation create endpoint.
export type CreateMitigationInput = {
  title?: string;
  status?: string;
  mitigation_owner_name?: string;
  start_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  impacts_severity?: boolean;
  impacts_probability?: boolean;
  confidence_level?: string;
  control_type?: string;
  estimated_cost?: number | string | null;
  plan_url?: string;
  notes?: string;
};

// Request payload for assessment create endpoint.
export type CreateAssessmentInput = {
  assessment_type?: string; // INHERENT | RESIDUAL
  severity?: number | string;
  probability?: number | string;
  assessed_by?: string;
  notes?: string;
};

// Request payload for mitigation update endpoint.
export type UpdateMitigationInput = {
  title?: string;
  status?: string;
  mitigation_owner_name?: string;
  start_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  impacts_severity?: boolean;
  impacts_probability?: boolean;
  confidence_level?: string;
  control_type?: string;
  estimated_cost?: number | string | null;
  plan_url?: string;
  notes?: string;
};

// Request payload for assessment update endpoint.
export type UpdateAssessmentInput = {
  assessment_type?: string; // INHERENT | RESIDUAL
  severity?: number | string;
  probability?: number | string;
  assessed_by?: string;
  notes?: string;
};

type MitigationRow = {
  mitigation_id: string;
  risk_id: string;
  title: string;
  status: string;
  mitigation_owner_name: string | null;
  start_date: Date | null;
  due_date: Date | null;
  completed_date: Date | null;
  impacts_severity: boolean;
  impacts_probability: boolean;
  confidence_level: string | null;
  control_type: string | null;
  estimated_cost: number | null;
  plan_url: string | null;
  notes: string | null;
};

type AssessmentRow = {
  assessment_id: string;
  risk_id: string;
  assessment_type: string;
  severity: number;
  probability: number;
  score: number;
  assessed_by: string;
  assessed_at: Date;
  notes: string | null;
};

@Injectable()
export class RisksService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeededProjectRisks();
  }

  // Returns up to 500 risks for register/dashboard pages.
  async findAll() {
    return this.prisma.$queryRaw`
      SELECT
        risk_id,
        title,
        description,
        category,
        COALESCE(
          department,
          CASE category
            WHEN 'Clinical' THEN 'Clinical Operations'
            WHEN 'Compliance' THEN 'Compliance'
            WHEN 'Operations' THEN 'Operations'
            WHEN 'Finance' THEN 'Finance'
            WHEN 'Workforce' THEN 'People'
            WHEN 'Safety' THEN 'Safety'
            WHEN 'IT' THEN 'Technology'
            WHEN 'Facilities' THEN 'Facilities'
            ELSE NULL
          END
        ) AS department,
        status,
        owner_name,
        site_or_program,
        inherent_severity,
        inherent_probability,
        inherent_score,
        residual_severity,
        residual_probability,
        residual_score,
        last_reassessed_at,
        next_review_due
      FROM erm.risks
      ORDER BY risk_id
      LIMIT 500
    `;
  }

  async findOne(riskId: string) {
    const rows = await this.prisma.$queryRaw<RiskRow[]>`
      SELECT
        risk_id,
        title,
        category,
        COALESCE(
          department,
          CASE category
            WHEN 'Clinical' THEN 'Clinical Operations'
            WHEN 'Compliance' THEN 'Compliance'
            WHEN 'Operations' THEN 'Operations'
            WHEN 'Finance' THEN 'Finance'
            WHEN 'Workforce' THEN 'People'
            WHEN 'Safety' THEN 'Safety'
            WHEN 'IT' THEN 'Technology'
            WHEN 'Facilities' THEN 'Facilities'
            ELSE NULL
          END
        ) AS department,
        status,
        site_or_program,
        inherent_severity,
        inherent_probability,
        inherent_score,
        residual_severity,
        residual_probability,
        residual_score,
        last_reassessed_at
      FROM erm.risks
      WHERE risk_id = ${riskId}
      LIMIT 1
    `;

    const risk = rows[0];
    if (!risk) {
      throw new NotFoundException(`Risk ${riskId} not found`);
    }

    return risk;
  }

  async findMitigations(riskId: string) {
    return this.prisma.$queryRaw`
      SELECT
        mitigation_id,
        risk_id,
        title,
        status,
        mitigation_owner_name,
        start_date,
        due_date,
        completed_date,
        impacts_severity,
        impacts_probability,
        confidence_level,
        control_type,
        estimated_cost,
        plan_url,
        notes
      FROM erm.mitigations
      WHERE risk_id = ${riskId}
      ORDER BY
        CASE status
          WHEN 'In Progress' THEN 1
          WHEN 'Planned' THEN 2
          WHEN 'Implemented' THEN 3
          WHEN 'On Hold' THEN 4
          WHEN 'Cancelled' THEN 5
          ELSE 9
        END,
        due_date NULLS LAST,
        mitigation_id
    `;
  }

  async findAssessments(riskId: string) {
    return this.prisma.$queryRaw`
      SELECT
        assessment_id::text AS assessment_id,
        risk_id,
        assessment_type,
        severity,
        probability,
        score,
        assessed_by,
        assessed_at,
        notes
      FROM erm.risk_assessments
      WHERE risk_id = ${riskId}
      ORDER BY assessed_at DESC, assessment_id DESC
    `;
  }

  async findDetail(riskId: string) {
    const [risk, mitigations, assessments] = await Promise.all([
      this.findOne(riskId),
      this.findMitigations(riskId),
      this.findAssessments(riskId),
    ]);

    return {
      risk,
      mitigations,
      assessments,
    };
  }

  async createMitigation(
    riskId: string,
    input: CreateMitigationInput,
  ): Promise<MitigationRow> {
    await this.findOne(riskId); // ensures risk exists

    const title = input.title?.trim();
    if (!title) {
      throw new BadRequestException('Mitigation title is required');
    }

    const status = input.status?.trim() || 'Planned';
    if (!MITIGATION_STATUSES.includes(status as (typeof MITIGATION_STATUSES)[number])) {
      throw new BadRequestException(
        `Mitigation status must be one of: ${MITIGATION_STATUSES.join(', ')}`,
      );
    }

    const mitigationOwnerName = input.mitigation_owner_name?.trim() || null;
    const confidenceLevel = input.confidence_level?.trim() || null;
    const controlType = input.control_type?.trim() || null;
    const planUrl = input.plan_url?.trim() || null;
    const notes = input.notes?.trim() || null;

    const startDate =
      input.start_date && input.start_date.trim() !== ''
        ? input.start_date.trim()
        : null;

    const dueDate =
      input.due_date && input.due_date.trim() !== ''
        ? input.due_date.trim()
        : null;

    const completedDate =
      input.completed_date && input.completed_date.trim() !== ''
        ? input.completed_date.trim()
        : null;

    const impactsSeverity = Boolean(input.impacts_severity);
    const impactsProbability = Boolean(input.impacts_probability);

    const estimatedCost =
      input.estimated_cost === '' ||
      input.estimated_cost == null ||
      Number.isNaN(Number(input.estimated_cost))
        ? null
        : Number(input.estimated_cost);

    return this.prisma.$transaction(async (tx): Promise<MitigationRow> => {
      const nextRows = await tx.$queryRaw<{ mitigation_id: string }[]>`
        WITH max_num AS (
          SELECT COALESCE(
            MAX(CAST(SUBSTRING(mitigation_id FROM '(\\d+)$') AS INTEGER)),
            0
          ) AS n
          FROM erm.mitigations
          WHERE mitigation_id ~ '\\d+$'
        )
        SELECT 'M-' || LPAD((n + 1)::text, 4, '0') AS mitigation_id
        FROM max_num
      `;

      const mitigationId = nextRows[0]?.mitigation_id;
      if (!mitigationId) {
        throw new BadRequestException('Failed to generate mitigation ID');
      }

      const inserted = await tx.$queryRaw<MitigationRow[]>`
        INSERT INTO erm.mitigations (
          mitigation_id,
          risk_id,
          title,
          status,
          mitigation_owner_name,
          start_date,
          due_date,
          completed_date,
          impacts_severity,
          impacts_probability,
          confidence_level,
          control_type,
          estimated_cost,
          plan_url,
          notes
        )
        VALUES (
          ${mitigationId},
          ${riskId},
          ${title},
          ${status},
          ${mitigationOwnerName},
          CAST(${startDate} AS DATE),
          CAST(${dueDate} AS DATE),
          CAST(${completedDate} AS DATE),
          ${impactsSeverity},
          ${impactsProbability},
          ${confidenceLevel},
          ${controlType},
          ${estimatedCost},
          ${planUrl},
          ${notes}
        )
        RETURNING
          mitigation_id,
          risk_id,
          title,
          status,
          mitigation_owner_name,
          start_date,
          due_date,
          completed_date,
          impacts_severity,
          impacts_probability,
          confidence_level,
          control_type,
          estimated_cost,
          plan_url,
          notes
      `;

      await tx.$executeRaw`
        UPDATE erm.risks
        SET updated_at = NOW()
        WHERE risk_id = ${riskId}
      `;

      return inserted[0];
    });
  }

  async updateMitigation(
    riskId: string,
    mitigationId: string,
    input: UpdateMitigationInput,
  ): Promise<MitigationRow> {
    await this.findOne(riskId);

    const existingRows = await this.prisma.$queryRaw<MitigationRow[]>`
      SELECT
        mitigation_id,
        risk_id,
        title,
        status,
        mitigation_owner_name,
        start_date,
        due_date,
        completed_date,
        impacts_severity,
        impacts_probability,
        confidence_level,
        control_type,
        estimated_cost,
        plan_url,
        notes
      FROM erm.mitigations
      WHERE mitigation_id = ${mitigationId}
        AND risk_id = ${riskId}
      LIMIT 1
    `;

    const existing = existingRows[0];
    if (!existing) {
      throw new NotFoundException(
        `Mitigation ${mitigationId} not found for risk ${riskId}`,
      );
    }

    const title =
      input.title === undefined ? existing.title : input.title.trim();
    if (!title) {
      throw new BadRequestException('Mitigation title is required');
    }

    const status = input.status === undefined ? existing.status : (input.status.trim() || '');
    if (!MITIGATION_STATUSES.includes(status as (typeof MITIGATION_STATUSES)[number])) {
      throw new BadRequestException(
        `Mitigation status must be one of: ${MITIGATION_STATUSES.join(', ')}`,
      );
    }

    const mitigationOwnerName =
      input.mitigation_owner_name === undefined
        ? existing.mitigation_owner_name
        : (input.mitigation_owner_name.trim() || null);
    const confidenceLevel =
      input.confidence_level === undefined
        ? existing.confidence_level
        : (input.confidence_level.trim() || null);
    const controlType =
      input.control_type === undefined
        ? existing.control_type
        : (input.control_type.trim() || null);
    const planUrl =
      input.plan_url === undefined ? existing.plan_url : (input.plan_url.trim() || null);
    const notes =
      input.notes === undefined ? existing.notes : (input.notes.trim() || null);

    const startDate =
      input.start_date === undefined
        ? existing.start_date
        : input.start_date && input.start_date.trim() !== ''
          ? input.start_date.trim()
          : null;

    const dueDate =
      input.due_date === undefined
        ? existing.due_date
        : input.due_date && input.due_date.trim() !== ''
          ? input.due_date.trim()
          : null;

    const completedDate =
      input.completed_date === undefined
        ? existing.completed_date
        : input.completed_date && input.completed_date.trim() !== ''
          ? input.completed_date.trim()
          : null;

    const impactsSeverity =
      input.impacts_severity === undefined
        ? existing.impacts_severity
        : Boolean(input.impacts_severity);

    const impactsProbability =
      input.impacts_probability === undefined
        ? existing.impacts_probability
        : Boolean(input.impacts_probability);

    const estimatedCost =
      input.estimated_cost === undefined
        ? existing.estimated_cost
        : input.estimated_cost === '' ||
            input.estimated_cost == null ||
            Number.isNaN(Number(input.estimated_cost))
          ? null
          : Number(input.estimated_cost);

    return this.prisma.$transaction(async (tx): Promise<MitigationRow> => {
      const updated = await tx.$queryRaw<MitigationRow[]>`
        UPDATE erm.mitigations
        SET
          title = ${title},
          status = ${status},
          mitigation_owner_name = ${mitigationOwnerName},
          start_date = CAST(${startDate} AS DATE),
          due_date = CAST(${dueDate} AS DATE),
          completed_date = CAST(${completedDate} AS DATE),
          impacts_severity = ${impactsSeverity},
          impacts_probability = ${impactsProbability},
          confidence_level = ${confidenceLevel},
          control_type = ${controlType},
          estimated_cost = ${estimatedCost},
          plan_url = ${planUrl},
          notes = ${notes}
        WHERE mitigation_id = ${mitigationId}
          AND risk_id = ${riskId}
        RETURNING
          mitigation_id,
          risk_id,
          title,
          status,
          mitigation_owner_name,
          start_date,
          due_date,
          completed_date,
          impacts_severity,
          impacts_probability,
          confidence_level,
          control_type,
          estimated_cost,
          plan_url,
          notes
      `;

      await tx.$executeRaw`
        UPDATE erm.risks
        SET updated_at = NOW()
        WHERE risk_id = ${riskId}
      `;

      return updated[0];
    });
  }

  async createAssessment(
    riskId: string,
    input: CreateAssessmentInput,
  ): Promise<AssessmentRow> {
    await this.findOne(riskId); // ensures risk exists

    const assessmentType = input.assessment_type?.trim() || 'RESIDUAL';
    if (!ASSESSMENT_TYPES.includes(assessmentType as (typeof ASSESSMENT_TYPES)[number])) {
      throw new BadRequestException(
        `Assessment type must be one of: ${ASSESSMENT_TYPES.join(', ')}`,
      );
    }

    const severity = Number(input.severity);
    const probability = Number(input.probability);

    if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
      throw new BadRequestException(
        'Assessment severity must be an integer from 1 to 5',
      );
    }

    if (!Number.isInteger(probability) || probability < 1 || probability > 5) {
      throw new BadRequestException(
        'Assessment probability must be an integer from 1 to 5',
      );
    }

    const assessedBy = input.assessed_by?.trim() || 'Risk Owner';
    const notes = input.notes?.trim() || null;

    return this.prisma.$transaction(async (tx): Promise<AssessmentRow> => {
      if (assessmentType === 'INHERENT') {
        await tx.$executeRaw`
          UPDATE erm.risks
          SET
            inherent_severity = ${severity},
            inherent_probability = ${probability},
            updated_at = NOW()
          WHERE risk_id = ${riskId}
        `;
      }

      if (assessmentType === 'RESIDUAL') {
        await tx.$executeRaw`
          UPDATE erm.risks
          SET
            residual_severity = ${severity},
            residual_probability = ${probability},
            residual_notes = COALESCE(${notes}, residual_notes),
            last_reassessed_at = NOW(),
            updated_at = NOW()
          WHERE risk_id = ${riskId}
        `;
      }

      const inserted = await tx.$queryRaw<AssessmentRow[]>`
        INSERT INTO erm.risk_assessments (
          risk_id,
          assessment_type,
          severity,
          probability,
          assessed_by,
          notes
        )
        VALUES (
          ${riskId},
          ${assessmentType},
          ${severity},
          ${probability},
          ${assessedBy},
          ${notes}
        )
        RETURNING
          assessment_id::text AS assessment_id,
          risk_id,
          assessment_type,
          severity,
          probability,
          score,
          assessed_by,
          assessed_at,
          notes
      `;

      return inserted[0];
    });
  }

  async updateAssessment(
    riskId: string,
    assessmentId: string,
    input: UpdateAssessmentInput,
  ): Promise<AssessmentRow> {
    await this.findOne(riskId);

    const existingRows = await this.prisma.$queryRaw<AssessmentRow[]>`
      SELECT
        assessment_id::text AS assessment_id,
        risk_id,
        assessment_type,
        severity,
        probability,
        score,
        assessed_by,
        assessed_at,
        notes
      FROM erm.risk_assessments
      WHERE assessment_id::text = ${assessmentId}
        AND risk_id = ${riskId}
      LIMIT 1
    `;

    const existing = existingRows[0];
    if (!existing) {
      throw new NotFoundException(
        `Assessment ${assessmentId} not found for risk ${riskId}`,
      );
    }

    const assessmentType =
      input.assessment_type === undefined
        ? existing.assessment_type
        : (input.assessment_type.trim() || '');
    if (!ASSESSMENT_TYPES.includes(assessmentType as (typeof ASSESSMENT_TYPES)[number])) {
      throw new BadRequestException(
        `Assessment type must be one of: ${ASSESSMENT_TYPES.join(', ')}`,
      );
    }

    const severity =
      input.severity === undefined ? existing.severity : Number(input.severity);
    const probability =
      input.probability === undefined
        ? existing.probability
        : Number(input.probability);

    if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
      throw new BadRequestException(
        'Assessment severity must be an integer from 1 to 5',
      );
    }

    if (!Number.isInteger(probability) || probability < 1 || probability > 5) {
      throw new BadRequestException(
        'Assessment probability must be an integer from 1 to 5',
      );
    }

    const assessedBy =
      input.assessed_by === undefined
        ? existing.assessed_by
        : (input.assessed_by.trim() || 'Risk Owner');
    const notes =
      input.notes === undefined ? existing.notes : (input.notes.trim() || null);

    return this.prisma.$transaction(async (tx): Promise<AssessmentRow> => {
      if (assessmentType === 'INHERENT') {
        await tx.$executeRaw`
          UPDATE erm.risks
          SET
            inherent_severity = ${severity},
            inherent_probability = ${probability},
            updated_at = NOW()
          WHERE risk_id = ${riskId}
        `;
      }

      if (assessmentType === 'RESIDUAL') {
        await tx.$executeRaw`
          UPDATE erm.risks
          SET
            residual_severity = ${severity},
            residual_probability = ${probability},
            residual_notes = COALESCE(${notes}, residual_notes),
            last_reassessed_at = NOW(),
            updated_at = NOW()
          WHERE risk_id = ${riskId}
        `;
      }

      const updated = await tx.$queryRaw<AssessmentRow[]>`
        UPDATE erm.risk_assessments
        SET
          assessment_type = ${assessmentType},
          severity = ${severity},
          probability = ${probability},
          assessed_by = ${assessedBy},
          notes = ${notes}
        WHERE assessment_id::text = ${assessmentId}
          AND risk_id = ${riskId}
        RETURNING
          assessment_id::text AS assessment_id,
          risk_id,
          assessment_type,
          severity,
          probability,
          score,
          assessed_by,
          assessed_at,
          notes
      `;

      return updated[0];
    });
  }

  async createRisk(input: CreateRiskInput): Promise<CreatedRiskRow> {
    const title = input.title?.trim();
    const category = input.category?.trim();
    const department = input.department?.trim() || null;
    const description = input.description?.trim() || null;
    const ownerName = input.owner_name?.trim() || null;
    const ownerEmail = input.owner_email?.trim() || null;
    const siteOrProgram = input.site_or_program?.trim() || null;
    const residualNotes = input.residual_notes?.trim() || null;
    const status = input.status?.trim() || 'Open';

    const inherentSeverity = Number(input.inherent_severity);
    const inherentProbability = Number(input.inherent_probability);

    const residualSeverity =
      input.residual_severity === '' || input.residual_severity == null
        ? null
        : Number(input.residual_severity);

    const residualProbability =
      input.residual_probability === '' || input.residual_probability == null
        ? null
        : Number(input.residual_probability);

    if (!title) throw new BadRequestException('Title is required');
    if (!category) throw new BadRequestException('Category is required');

    if (
      !Number.isInteger(inherentSeverity) ||
      inherentSeverity < 1 ||
      inherentSeverity > 5
    ) {
      throw new BadRequestException(
        'Inherent severity must be an integer from 1 to 5',
      );
    }

    if (
      !Number.isInteger(inherentProbability) ||
      inherentProbability < 1 ||
      inherentProbability > 5
    ) {
      throw new BadRequestException(
        'Inherent probability must be an integer from 1 to 5',
      );
    }

    if (!RISK_STATUSES.includes(status as (typeof RISK_STATUSES)[number])) {
      throw new BadRequestException(
        `Status must be one of: ${RISK_STATUSES.join(', ')}`,
      );
    }

    const residualProvided =
      residualSeverity !== null || residualProbability !== null;
    if (residualProvided) {
      if (
        !Number.isInteger(residualSeverity) ||
        !Number.isInteger(residualProbability) ||
        (residualSeverity as number) < 1 ||
        (residualSeverity as number) > 5 ||
        (residualProbability as number) < 1 ||
        (residualProbability as number) > 5
      ) {
        throw new BadRequestException(
          'Residual severity and probability must both be integers from 1 to 5 when provided',
        );
      }
    }

    const resolvedDepartment =
      department ?? (category ? DEFAULT_DEPARTMENT_BY_CATEGORY[category] ?? null : null);

    const nextReviewDue =
      input.next_review_due && input.next_review_due.trim() !== ''
        ? input.next_review_due.trim()
        : null;

    return this.prisma.$transaction(async (tx): Promise<CreatedRiskRow> => {
      const nextIdRows = await tx.$queryRaw<{ risk_id: string }[]>`
        WITH max_num AS (
          SELECT COALESCE(MAX(CAST(SUBSTRING(risk_id FROM 'R-(\\d+)$') AS INTEGER)), 0) AS n
          FROM erm.risks
        )
        SELECT 'R-' || LPAD((n + 1)::text, 3, '0') AS risk_id
        FROM max_num
      `;

      const riskId = nextIdRows[0]?.risk_id;
      if (!riskId) throw new BadRequestException('Failed to generate risk ID');

      const insertedRows = await tx.$queryRaw<CreatedRiskRow[]>`
        INSERT INTO erm.risks (
          risk_id,
          title,
          description,
          category,
          department,
          owner_name,
          owner_email,
          status,
          site_or_program,
          inherent_severity,
          inherent_probability,
          residual_severity,
          residual_probability,
          residual_notes,
          last_reassessed_at,
          next_review_due,
          updated_at
        )
        VALUES (
          ${riskId},
          ${title},
          ${description},
          ${category},
          ${resolvedDepartment},
          ${ownerName},
          ${ownerEmail},
          ${status},
          ${siteOrProgram},
          ${inherentSeverity},
          ${inherentProbability},
          ${residualSeverity},
          ${residualProbability},
          ${residualNotes},
          ${residualProvided ? new Date() : null},
          CAST(${nextReviewDue} AS DATE),
          NOW()
        )
        RETURNING
          risk_id,
          title,
          category,
          department,
          status,
          owner_name,
          site_or_program,
          inherent_severity,
          inherent_probability,
          inherent_score,
          residual_severity,
          residual_probability,
          residual_score,
          last_reassessed_at,
          next_review_due
      `;

      await tx.$executeRaw`
        INSERT INTO erm.risk_assessments (
          risk_id,
          assessment_type,
          severity,
          probability,
          assessed_by,
          notes
        )
        VALUES (
          ${riskId},
          'INHERENT',
          ${inherentSeverity},
          ${inherentProbability},
          ${ownerName ?? 'System'},
          ${'Risk created'}
        )
      `;

      if (residualProvided) {
        await tx.$executeRaw`
          INSERT INTO erm.risk_assessments (
            risk_id,
            assessment_type,
            severity,
            probability,
            assessed_by,
            notes
          )
          VALUES (
            ${riskId},
            'RESIDUAL',
            ${residualSeverity as number},
            ${residualProbability as number},
            ${ownerName ?? 'Risk Owner'},
            ${residualNotes ?? 'Initial residual assessment'}
          )
        `;
      }

      return insertedRows[0];
    });
  }

  private async ensureSeededProjectRisks(): Promise<void> {
    for (const risk of SEEDED_PROJECT_RISKS) {
      const existingRows = await this.prisma.$queryRaw<{ risk_id: string }[]>`
        SELECT risk_id
        FROM erm.risks
        WHERE title = ${risk.title ?? ''}
          AND site_or_program = ${risk.site_or_program ?? null}
        LIMIT 1
      `;

      if (existingRows[0]?.risk_id) {
        continue;
      }

      await this.createRisk(risk);
    }
  }
}
