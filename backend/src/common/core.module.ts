import { Global, Module } from '@nestjs/common';
import { AuthGuard, RolesGuard } from './guards/auth.guard';
import { EntitlementGuard } from './guards/entitlement.guard';
import { SessionService } from '../modules/auth/session.service';
import { EntitlementService } from '../modules/subscriptions/entitlement.service';
import { ContentService } from '../modules/theory/content.service';
import { KnowledgeService } from '../modules/knowledge/knowledge.service';
import { ReviewSchedulingService } from '../modules/error-bank/review-scheduling.service';
const providers = [AuthGuard, RolesGuard, EntitlementGuard, SessionService, EntitlementService, ContentService, KnowledgeService, ReviewSchedulingService];
@Global() @Module({ providers, exports: providers })
export class CoreModule {}
