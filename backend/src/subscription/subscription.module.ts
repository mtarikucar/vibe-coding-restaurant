import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionScheduler } from "./subscription.scheduler";
import { Subscription } from "./entities/subscription.entity";
import { SubscriptionPlan } from "./entities/subscription-plan.entity";
import { User } from "../auth/entities/user.entity";
import { PaymentModule } from "../payment/payment.module";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionPlan, User]),
    PaymentModule,
    SharedModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduler],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
