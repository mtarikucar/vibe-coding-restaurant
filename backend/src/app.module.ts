import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { MenuModule } from "./menu/menu.module";
import { OrderModule } from "./order/order.module";
import { KitchenModule } from "./kitchen/kitchen.module";
import { TableModule } from "./table/table.module";
import { PaymentModule } from "./payment/payment.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { StockModule } from "./stock/stock.module";
import { EventsModule } from "./events/events.module";
import { SharedModule } from "./shared/shared.module";
import { SubscriptionModule } from "./subscription/subscription.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DB_HOST", "localhost"),
        port: +configService.get<string>("DB_PORT", "5432"),
        username: configService.get<string>("DB_USERNAME", "postgres"),
        password: configService.get<string>("DB_PASSWORD", "postgres"),
        database: configService.get<string>("DB_DATABASE", "restaurant"),
        synchronize: configService.get<string>("DB_SYNC", "true") === "true",
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
      }),
    }),

    // Serve static files (frontend)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "frontend", "dist"),
      exclude: ["/api*"],
    }),

    // Application modules
    SharedModule,
    AuthModule,
    MenuModule,
    OrderModule,
    KitchenModule,
    TableModule,
    PaymentModule,
    DashboardModule,
    StockModule,
    EventsModule,
    SubscriptionModule,
  ],
})
export class AppModule {}
