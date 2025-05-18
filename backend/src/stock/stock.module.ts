import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StockController } from "./stock.controller";
import { StockService } from "./stock.service";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { PurchaseOrderController } from "./purchase-order.controller";
import { PurchaseOrderService } from "./purchase-order.service";
import { Stock } from "./entities/stock.entity";
import { StockHistory } from "./entities/stock-history.entity";
import { Supplier } from "./entities/supplier.entity";
import { PurchaseOrder } from "./entities/purchase-order.entity";
import { PurchaseOrderItem } from "./entities/purchase-order-item.entity";
import { MenuModule } from "../menu/menu.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      StockHistory,
      Supplier,
      PurchaseOrder,
      PurchaseOrderItem,
    ]),
    MenuModule, // Import MenuModule to use MenuService
  ],
  controllers: [StockController, SupplierController, PurchaseOrderController],
  providers: [StockService, SupplierService, PurchaseOrderService],
  exports: [StockService, SupplierService, PurchaseOrderService],
})
export class StockModule {}
