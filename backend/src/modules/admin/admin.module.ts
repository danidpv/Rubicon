import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminSourcesController } from './admin-content.controller';
@Module({ controllers: [AdminUsersController, AdminContentController, AdminSourcesController], providers: [] })
export class AdminModule {}
