import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { PaymentGatewayService } from "./services/payment-gateway.service";
import { StripeService } from "./services/stripe.service";
import { IyzicoService } from "./services/iyzico.service";
import { Payment } from "./entities/payment.entity";
import { OrderModule } from "../order/order.module";
import { TableModule } from "../table/table.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    OrderModule,
    TableModule, // Import TableModule to use TableService
    ConfigModule, // Import ConfigModule for PaymentGatewayService
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentGatewayService,
    StripeService,
    IyzicoService,
  ],
  exports: [
    PaymentService,
    PaymentGatewayService,
    StripeService,
    IyzicoService,
  ],
})
export class PaymentModule {}
