import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { PaymentController } from "./payment.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { PaymentService } from "./payment.service";
import { PaymentGatewayService } from "./services/payment-gateway.service";
import { PaymentStateService } from "./services/payment-state.service";
import { PaymentIdempotencyService } from "./services/payment-idempotency.service";
import { StripeService } from "./services/stripe.service";
import { IyzicoService } from "./services/iyzico.service";
import { PayPalService } from "./services/paypal.service";
import { Payment } from "./entities/payment.entity";
import { PaymentStateTransition } from "./entities/payment-state.entity";
import { OrderModule } from "../order/order.module";
import { TableModule } from "../table/table.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentStateTransition]),
    OrderModule,
    TableModule, // Import TableModule to use TableService
    ConfigModule, // Import ConfigModule for PaymentGatewayService
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    PaymentGatewayService,
    PaymentStateService,
    PaymentIdempotencyService,
    StripeService,
    IyzicoService,
    PayPalService,
  ],
  exports: [
    PaymentService,
    PaymentGatewayService,
    PaymentStateService,
    PaymentIdempotencyService,
    StripeService,
    IyzicoService,
    PayPalService,
  ],
})
export class PaymentModule {}
