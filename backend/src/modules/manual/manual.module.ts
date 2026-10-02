import { Module } from '@nestjs/common';
import { ManualController } from './manual.controller';
@Module({ controllers: [ManualController], providers: [] })
export class ManualModule {}
