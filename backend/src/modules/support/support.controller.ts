import { Controller, Get, Post, Patch, Req, Param, Body, Query, UseGuards, Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { idSchema, messageSchema } from 'shared';
import { db } from '../../database/prisma';
import { AuthGuard, RolesGuard, Roles, type AuthRequest } from '../../common/guards/auth.guard';
import { SupportService } from './support.service';
@Controller('support/threads') @UseGuards(AuthGuard)
export class SupportController {
  constructor(@Inject(SupportService) private readonly support: SupportService) {}
  @Get() list(@Req() r: AuthRequest, @Query() q: unknown) { return this.support.list(r.user.id, q); }
  @Post() @Throttle({ default: { limit: 8, ttl: 60000 } }) create(@Req() r: AuthRequest, @Body() b: unknown) { return this.support.create(r.user.id, b); }
  @Get(':id') get(@Param('id') id: string, @Req() r: AuthRequest) { return this.support.get(idSchema.parse(id), r.user.id); }
  @Post(':id/messages') @Throttle({ default: { limit: 15, ttl: 60000 } }) message(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.support.message(idSchema.parse(id), r.user.id, false, b); }
  @Patch(':id') state(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.support.state(idSchema.parse(id), r.user.id, false, b); }
}
@Controller('admin/support') @UseGuards(AuthGuard, RolesGuard) @Roles('SUPPORT', 'ADMIN', 'SUPERADMIN')
export class AdminSupportController {
  constructor(@Inject(SupportService) private readonly support: SupportService) {}
  @Get() list(@Query() q: unknown) { return this.support.list(null, q); }
  @Get(':id') get(@Param('id') id: string) { return this.support.get(idSchema.parse(id), null); }
  @Post(':id/messages') message(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.support.message(idSchema.parse(id), r.user.id, true, b); }
  @Patch(':id') state(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { return this.support.state(idSchema.parse(id), r.user.id, true, b); }
  @Post(':id/notes') async note(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) { await this.support.own(idSchema.parse(id), null); return db.supportInternalNote.create({ data: { threadId: id, actorId: r.user.id, body: messageSchema.parse(b).body } }); }
}
