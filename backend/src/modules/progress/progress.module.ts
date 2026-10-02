import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
@Module({ controllers: [ProgressController], providers: [] })
export class ProgressModule {}
