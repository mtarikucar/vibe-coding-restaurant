import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { Notification } from "./entities/notification.entity";
import { NotificationPreference } from "./entities/notification-preference.entity";
import { PushSubscription } from "./entities/push-subscription.entity";
import { PushNotificationService } from "./services/push-notification.service";
import { PushNotificationController } from "./controllers/push-notification.controller";
import { EventsModule } from "../events/events.module";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      PushSubscription,
    ]),
    EventsModule,
    SharedModule,
  ],
  controllers: [NotificationController, PushNotificationController],
  providers: [NotificationService, PushNotificationService],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationModule {}
