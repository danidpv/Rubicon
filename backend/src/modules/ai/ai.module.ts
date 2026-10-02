import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { EvaluationWorker } from '../../jobs/evaluation.worker';
@Module({ controllers: [AiController], providers: [EvaluationWorker] })
export class AiModule {}
