import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, Inject } from '@nestjs/common';
import { idSchema } from 'shared';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { EntitlementGuard, ModuleAccess } from '../../common/guards/entitlement.guard';
import { ContentService } from '../theory/content.service';
import { ExamService } from './exam.service';
@Controller() @UseGuards(AuthGuard)
export class ExamController {
  constructor(@Inject(ExamService) private readonly exams: ExamService, @Inject(ContentService) private readonly content: ContentService) {}
  @Get('exams') list(@Query() q: unknown) { return this.content.list('EXAM', q); }
  @Get('exams/:id') get(@Param('id') id: string, @Req() r: AuthRequest) { return this.exams.template(idSchema.parse(id), r.user.id); }
  @Post('exams/:id/start') @UseGuards(EntitlementGuard) @ModuleAccess('SUPUESTOS') start(@Param('id') id: string, @Req() r: AuthRequest) { return this.exams.start(idSchema.parse(id), r.user.id); }
  @Get('exam-attempts/:id') attempt(@Param('id') id: string, @Req() r: AuthRequest) { return this.exams.get(idSchema.parse(id), r.user.id); }
  @Patch('exam-attempts/:id/answers') save(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.exams.save(idSchema.parse(id), r.user.id, b); }
  @Post('exam-attempts/:id/submit') submit(@Param('id') id: string, @Req() r: AuthRequest) { return this.exams.submit(idSchema.parse(id), r.user.id); }
}
