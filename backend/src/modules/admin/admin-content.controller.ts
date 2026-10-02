import { Controller, Get, Post, Patch, Param, Query, Body, Req, UseGuards, ConflictException, BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { contentEditSchema, contentDataSchema, idSchema, slugSchema, pageSchema, categories } from 'shared';
import { AuthGuard, RolesGuard, Roles, type AuthRequest } from '../../common/guards/auth.guard';
import { db } from '../../database/prisma';
const kinds = z.enum(['THEORY', 'CASE', 'EXAM', 'MANUAL']);
@Controller('admin/content') @UseGuards(AuthGuard, RolesGuard) @Roles('CONTENT_EDITOR', 'ADMIN', 'SUPERADMIN')
export class AdminContentController {
  @Get() async list(@Query() input: unknown) { const q = pageSchema.extend({ kind: kinds.optional() }).parse(input); const where = { ...(q.kind ? { kind: q.kind } : {}), ...(q.q ? { title: { contains: q.q, mode: 'insensitive' as const } } : {}) }; const [items, total] = await Promise.all([db.content.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit }), db.content.count({ where })]); return { items, total, page: q.page, limit: q.limit }; }
  @Post() async create(@Body() input: unknown, @Req() r: AuthRequest) { const data = z.object({ kind: kinds, slug: slugSchema, title: z.string().min(3).max(200), summary: z.string().min(5).max(1000), body: z.string().min(10).max(80000), category: z.enum(categories) }).strict().parse(input); return db.$transaction(async tx => { const content = await tx.content.create({ data: { ...data, data: contentDataSchema.parse({}), sourceAttribution: 'Creado por el equipo editorial', status: 'DRAFT', isDemo: true } }); await tx.adminAuditLog.create({ data: { actorId: r.user.id, action: 'CONTENT_CREATED', entityId: content.id, after: { title: content.title } } }); return content; }); }
  @Patch(':id') async edit(@Param('id') id: string, @Body() input: unknown, @Req() r: AuthRequest) {
    idSchema.parse(id); const data = contentEditSchema.parse(input);
    return db.$transaction(async tx => {
      const before = await tx.content.findUniqueOrThrow({ where: { id } });
      if (before.kind === 'CASE' && before.format === 'DEVELOPMENT' && data.status === 'PUBLISHED' && !data.data.rubric) throw new BadRequestException({ code: 'RUBRIC_REQUIRED', message: 'El desarrollo necesita una rúbrica válida.' });
      if (['CASE', 'EXAM'].includes(before.kind) && before.format === 'MCQ' && data.status === 'PUBLISHED' && data.data.questions.length === 0) throw new BadRequestException({ code: 'QUESTIONS_REQUIRED', message: 'Añade preguntas antes de publicar.' });
      const { version, ...changes } = data;
      const changed = await tx.content.updateMany({ where: { id, version }, data: { ...changes, version: { increment: 1 }, reviewerId: r.user.id, reviewedAt: new Date() } }); if (!changed.count) throw new ConflictException({ code: 'VERSION_CONFLICT', message: 'Otro editor modificó este contenido. Recarga antes de guardar.' });
      const after = await tx.content.findUniqueOrThrow({ where: { id } });
      await tx.contentRevision.create({ data: { contentId: id, version: after.version, snapshot: JSON.parse(JSON.stringify(after)) } });
      await tx.adminAuditLog.create({ data: { actorId: r.user.id, action: 'CONTENT_UPDATED', entityId: id, before: { version: before.version, status: before.status }, after: { version: after.version, status: after.status } } }); return after;
    });
  }
}
@Controller('admin/sources') @UseGuards(AuthGuard, RolesGuard) @Roles('CONTENT_EDITOR', 'ADMIN', 'SUPERADMIN')
export class AdminSourcesController {
  @Get() async list(@Query() input: unknown) { const q = pageSchema.parse(input); const [items, total] = await Promise.all([db.knowledgeSource.findMany({ take: q.limit, skip: (q.page - 1) * q.limit, orderBy: { title: 'asc' } }), db.knowledgeSource.count()]); return { items, total, page: q.page, limit: q.limit }; }
  @Patch(':id') async edit(@Param('id') id: string, @Req() r: AuthRequest, @Body() input: unknown) {
    idSchema.parse(id); const data = z.object({ status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'EXPIRED', 'REJECTED']), body: z.string().min(20).max(80000), validFrom: z.iso.datetime().nullable(), validTo: z.iso.datetime().nullable(), article: z.string().min(1).max(100) }).strict().parse(input);
    if (data.status === 'APPROVED' && data.validTo && new Date(data.validTo) <= new Date()) throw new BadRequestException();
    return db.$transaction(async tx => {
      const before = await tx.knowledgeSource.findUniqueOrThrow({ where: { id } });
      const after = await tx.knowledgeSource.update({ where: { id }, data: { status: data.status, body: data.body, validFrom: data.validFrom, validTo: data.validTo, reviewedAt: new Date(), reviewerId: r.user.id, version: { increment: 1 }, checksum: createHash('sha256').update(data.body).digest('hex') } });
      await tx.knowledgeChunk.deleteMany({ where: { sourceId: id } }); await tx.knowledgeChunk.create({ data: { sourceId: id, section: data.article, article: data.article, text: data.body } });
      if (data.status !== 'APPROVED') await tx.content.updateMany({ where: { sources: { some: { sourceId: id } }, status: 'PUBLISHED' }, data: { status: 'REVIEW' } });
      await tx.adminAuditLog.create({ data: { actorId: r.user.id, action: 'SOURCE_UPDATED', entityId: id, before: { status: before.status, version: before.version }, after: { status: after.status, version: after.version } } }); return after;
    });
  }
}
