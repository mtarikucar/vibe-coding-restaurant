import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportController } from "./report.controller";
import { ReportService } from "./report.service";
import { Report } from "./entities/report.entity";
import { ReportTemplate } from "./entities/report-template.entity";
import { ReportSchedule } from "./entities/report-schedule.entity";
import { Order } from "../order/entities/order.entity";
import { OrderItem } from "../order/entities/order-item.entity";
import { Payment } from "../payment/entities/payment.entity";
import { MenuItem } from "../menu/entities/menu-item.entity";
import { Stock } from "../stock/entities/stock.entity";
import { User } from "../auth/entities/user.entity";
import { OrderModule } from "../order/order.module";
import { PaymentModule } from "../payment/payment.module";
import { MenuModule } from "../menu/menu.module";
import { StockModule } from "../stock/stock.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      ReportTemplate,
      ReportSchedule,
      Order,
      OrderItem,
      Payment,
      MenuItem,
      Stock,
      User,
    ]),
    OrderModule,
    PaymentModule,
    MenuModule,
    StockModule,
    AuthModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
