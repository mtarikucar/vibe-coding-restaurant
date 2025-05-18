import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth/auth.service";
import { MenuService } from "./menu/menu.service";
import { TableService } from "./table/table.service";
import { StockService } from "./stock/stock.service";
import { SubscriptionService } from "./subscription/subscription.service";
import { TenantService } from "./tenant/tenant.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Set global prefix for API routes
  app.setGlobalPrefix("api");

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get("PORT", 3000);

  // Initialize data
  await initializeData(app);

  // Start server
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

async function initializeData(app: any) {
  try {
    // Create initial tenant
    const tenantService = app.get(TenantService);
    await tenantService.createInitialTenant();
    console.log("Initial tenant created");

    // Create initial users
    const authService = app.get(AuthService);
    await authService.createInitialUsers();
    console.log("Initial users created");

    // Create initial menu items
    const menuService = app.get(MenuService);
    await menuService.createInitialMenuItems();
    console.log("Initial menu items created");

    // Create initial tables
    const tableService = app.get(TableService);
    await tableService.createInitialTables();
    console.log("Initial tables created");

    // Create initial stocks
    const stockService = app.get(StockService);
    await stockService.createInitialStocks();
    console.log("Initial stocks created");

    // Create initial subscription plans
    const subscriptionService = app.get(SubscriptionService);
    await subscriptionService.createInitialPlans();
    console.log("Initial subscription plans created");
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}

bootstrap();
