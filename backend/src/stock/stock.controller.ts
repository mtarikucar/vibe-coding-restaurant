import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import { StockService } from "./stock.service";
import { CreateStockDto } from "./dto/create-stock.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";

@Controller("stock")
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createStockDto: CreateStockDto) {
    return this.stockService.create(createStockDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.stockService.findAll();
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.stockService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param("id") id: string, @Body() updateStockDto: UpdateStockDto) {
    return this.stockService.update(id, updateStockDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.stockService.remove(id);
  }

  @Patch(":id/adjust")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  adjustStock(@Param("id") id: string, @Body() adjustStockDto: AdjustStockDto) {
    return this.stockService.adjustStock(id, adjustStockDto);
  }

  @Get("menu-item/:menuItemId")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findByMenuItem(@Param("menuItemId") menuItemId: string) {
    return this.stockService.findByMenuItem(menuItemId);
  }

  @Get("low-stock")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findLowStock() {
    return this.stockService.findLowStock();
  }

  @Get(":id/history")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getStockHistory(@Param("id") id: string) {
    return this.stockService.getStockHistory(id);
  }

  @Get("critical-stock")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findCriticalStock() {
    return this.stockService.findCriticalStock();
  }

  @Get(":id/usage")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getStockUsage(
    @Param("id") id: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.stockService.getStockUsage(id, start, end);
  }

  @Get(":id/forecast")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getStockForecast(@Param("id") id: string, @Query("days") days: string) {
    return this.stockService.getStockForecast(id, days ? parseInt(days) : 30);
  }

  @Get("valuation")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getStockValuation() {
    return this.stockService.getStockValuation();
  }

  @Get("purchase-suggestions")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  suggestPurchaseOrders(@Request() req) {
    return this.stockService.suggestPurchaseOrders(req.user.tenantId);
  }
}
