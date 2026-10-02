import { Controller, Get, Post, Param, Query, Req, UseGuards, Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { EntitlementGuard, ModuleAccess } from '../../common/guards/entitlement.guard';
import { ContentService } from '../theory/content.service';
import { db } from '../../database/prisma';
@Controller('manual') @UseGuards(AuthGuard, EntitlementGuard) @ModuleAccess('MANUAL_PROFESIONAL') @Throttle({ default: { limit: 40, ttl: 60000 } })
export class ManualController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}
  @Get() list(@Query() q: unknown) { return this.content.list('MANUAL', q); }
  @Get(':slug') get(@Param('slug') slug: string, @Req() r: AuthRequest) { return this.content.get('MANUAL', slug, r.user.id); }
  @Post(':slug/favorite') async favorite(@Param('slug') slug: string, @Req() r: AuthRequest) { const c = await this.content.get('MANUAL', slug, r.user.id); const where = { userId_contentId: { userId: r.user.id, contentId: c.id } }; if (await db.favorite.findUnique({ where })) { await db.favorite.delete({ where }); return { favorite: false }; } await db.favorite.create({ data: { userId: r.user.id, contentId: c.id } }); return { favorite: true }; }
}
