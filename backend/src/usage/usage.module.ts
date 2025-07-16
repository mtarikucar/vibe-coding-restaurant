import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageMetric } from './entities/usage-metric.entity';
import { UsageTrackingService } from './services/usage-tracking.service';
import { UsageController } from './controllers/usage.controller';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import { User } from '../auth/entities/user.entity';
import { Table } from '../table/entities/table.entity';
import { Order } from '../order/entities/order.entity';
import { Invoice } from '../invoice/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsageMetric,
      User,
      Table,
      Order,
      Invoice,
    ]),
  ],
  controllers: [UsageController],
  providers: [
    UsageTrackingService,
    UsageTrackingInterceptor,
  ],
  exports: [
    UsageTrackingService,
    UsageTrackingInterceptor,
  ],
})
export class UsageModule {}