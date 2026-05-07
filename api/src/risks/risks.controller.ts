import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { RisksService } from './risks.service';
import type {
  CreateAssessmentInput,
  CreateMitigationInput,
  CreateRiskInput,
  UpdateAssessmentInput,
  UpdateMitigationInput,
} from './risks.service';

// Thin HTTP layer delegating validation/business logic to RisksService.
@Controller('risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Get()
  findAll() {
    return this.risksService.findAll();
  }

  @Post()
  create(@Body() body: CreateRiskInput) {
    return this.risksService.createRisk(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.risksService.findOne(id);
  }

  @Post(':id/mitigations')
  createMitigation(
    @Param('id') id: string,
    @Body() body: CreateMitigationInput,
  ) {
    return this.risksService.createMitigation(id, body);
  }

  @Get(':id/mitigations')
  findMitigations(@Param('id') id: string) {
    return this.risksService.findMitigations(id);
  }

  @Put(':id/mitigations/:mitigationId')
  updateMitigation(
    @Param('id') id: string,
    @Param('mitigationId') mitigationId: string,
    @Body() body: UpdateMitigationInput,
  ) {
    return this.risksService.updateMitigation(id, mitigationId, body);
  }

  @Post(':id/assessments')
  createAssessment(
    @Param('id') id: string,
    @Body() body: CreateAssessmentInput,
  ) {
    return this.risksService.createAssessment(id, body);
  }

  @Get(':id/assessments')
  findAssessments(@Param('id') id: string) {
    return this.risksService.findAssessments(id);
  }

  @Put(':id/assessments/:assessmentId')
  updateAssessment(
    @Param('id') id: string,
    @Param('assessmentId') assessmentId: string,
    @Body() body: UpdateAssessmentInput,
  ) {
    return this.risksService.updateAssessment(id, assessmentId, body);
  }

  @Get(':id/detail')
  findDetail(@Param('id') id: string) {
    return this.risksService.findDetail(id);
  }
}
