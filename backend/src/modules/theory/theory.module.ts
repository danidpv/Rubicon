import { Module } from '@nestjs/common';
import { TheoryController } from './theory.controller';
import { CasesController } from '../practical-cases/cases.controller';
import { AttemptService } from '../practical-cases/attempt.service';
@Module({ controllers: [TheoryController, CasesController], providers: [AttemptService] })
export class StudyModule {}
