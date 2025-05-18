import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { OrderModule } from "../order/order.module";
import { PaymentModule } from "../payment/payment.module";
import { AuthModule } from "../auth/auth.module";
import { TableModule } from "../table/table.module";
import { StockModule } from "../stock/stock.module";
import { MenuModule } from "../menu/menu.module";
import { Order } from "../order/entities/order.entity";
import { OrderItem } from "../order/entities/order-item.entity";
import { Payment } from "../payment/entities/payment.entity";
import { Table } from "../table/entities/table.entity";
import { Stock } from "../stock/entities/stock.entity";
import { User } from "../auth/entities/user.entity";
import { MenuItem } from "../menu/entities/menu-item.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      Table,
      Stock,
      User,
      MenuItem,
    ]),
    OrderModule,
    PaymentModule,
    AuthModule,
    TableModule,
    StockModule,
    MenuModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
