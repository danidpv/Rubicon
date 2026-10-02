import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottleStorage } from './common/security/redis-throttle';
import { CoreModule } from './common/core.module';
import { HealthController } from './modules/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { StudyModule } from './modules/theory/theory.module';
import { AiModule } from './modules/ai/ai.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SupportModule } from './modules/support/support.module';
import { ManualModule } from './modules/manual/manual.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
@Module({
  imports: [CoreModule, ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60000, limit: 180 }], storage: new RedisThrottleStorage() }), AuthModule, StudyModule, AiModule, ExamsModule, ProgressModule, SupportModule, ManualModule, SubscriptionsModule, AdminModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
