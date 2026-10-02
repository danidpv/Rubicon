import { Controller, Get, Post, Param, Query, Req, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { ContentService } from './content.service';
@Controller('theory') @UseGuards(AuthGuard)
export class TheoryController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}
  @Get() list(@Query() query: unknown) { return this.content.list('THEORY', query); }
  @Get(':slug') get(@Param('slug') slug: string, @Req() req: AuthRequest) { return this.content.get('THEORY', slug, req.user.id); }
  @Post(':slug/complete') complete(@Param('slug') slug: string, @Req() req: AuthRequest) { return this.content.complete(slug, req.user.id); }
}
