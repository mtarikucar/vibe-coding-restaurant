import { Controller, Get, UseGuards, Query, Res, Header } from "@nestjs/common";
import { Response } from "express";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getStats(@Query("period") period: string = "day") {
    return this.dashboardService.getStats(period);
  }

  @Get("sales")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getSales(@Query("period") period: string = "day") {
    return this.dashboardService.getSales(period);
  }

  @Get("popular-items")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getPopularItems(@Query("limit") limit: number = 5) {
    return this.dashboardService.getPopularItems(limit);
  }

  @Get("active-orders")
  getActiveOrders() {
    return this.dashboardService.getActiveOrders();
  }

  @Get("active-tables")
  getActiveTables() {
    return this.dashboardService.getActiveTables();
  }

  @Get("low-stock")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getLowStock() {
    return this.dashboardService.getLowStock();
  }

  @Get("custom-report")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getCustomReport(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("type") type: string = "sales"
  ) {
    return this.dashboardService.getCustomReport(startDate, endDate, type);
  }

  @Get("export-sales")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=sales-report.csv")
  async exportSalesReport(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Res() res: Response
  ) {
    const csvData = await this.dashboardService.exportSalesReport(
      startDate,
      endDate
    );
    res.send(csvData);
  }

  @Get("export-inventory")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=inventory-report.csv")
  async exportInventoryReport(@Res() res: Response) {
    const csvData = await this.dashboardService.exportInventoryReport();
    res.send(csvData);
  }
}
