import { Controller, Get, Post, Patch, Param, Query, Body, Req, UseGuards, Inject } from '@nestjs/common';
import { idSchema } from 'shared';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { ContentService } from '../theory/content.service';
import { AttemptService } from './attempt.service';
import { db } from '../../database/prisma';
@Controller() @UseGuards(AuthGuard)
export class CasesController {
  constructor(@Inject(ContentService) private readonly content: ContentService, @Inject(AttemptService) private readonly attempts: AttemptService) {}
  @Get('practical-cases') list(@Query() q: unknown) { return this.content.list('CASE', q); }
  @Get('practical-cases/:slug') get(@Param('slug') slug: string, @Req() r: AuthRequest) { return this.content.get('CASE', slug, r.user.id); }
  @Post('practical-cases/:slug/attempts') create(@Param('slug') slug: string, @Req() r: AuthRequest) { return this.attempts.create(slug, r.user.id); }
  @Get('practical-cases/:slug/attempts') async history(@Param('slug') slug: string, @Req() r: AuthRequest) { const c = await this.content.get('CASE', slug, r.user.id); return db.caseAttempt.findMany({ where: { userId: r.user.id, contentId: c.id }, select: { id: true, status: true, score: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }); }
  @Get('case-attempts/:id') attempt(@Param('id') id: string, @Req() r: AuthRequest) { return this.attempts.get(idSchema.parse(id), r.user.id); }
  @Patch('case-attempts/:id') save(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.attempts.save(idSchema.parse(id), r.user.id, b); }
  @Post('case-attempts/:id/submit') submit(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.attempts.submit(idSchema.parse(id), r.user.id, b); }
  @Get('case-attempts/:id/evaluation') evaluation(@Param('id') id: string, @Req() r: AuthRequest) { return this.attempts.get(idSchema.parse(id), r.user.id); }
}
