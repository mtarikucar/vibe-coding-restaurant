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
  Req,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateOrderItemStatusDto } from "./dto/update-order-item-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { Request } from "express";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAITER)
  @UseGuards(RolesGuard)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll(@Req() req: Request, @Query("status") status?: string) {
    const tenantId = (req as any).tenantId;
    if (status) {
      return this.orderService.findByStatus(status, tenantId);
    }
    return this.orderService.findAll(tenantId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.orderService.findOne(id, tenantId);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.WAITER)
  @UseGuards(RolesGuard)
  update(@Param("id") id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.WAITER)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.orderService.remove(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto.status);
  }

  @Patch(":orderId/items/:itemId/status")
  updateItemStatus(
    @Param("orderId") orderId: string,
    @Param("itemId") itemId: string,
    @Body() updateOrderItemStatusDto: UpdateOrderItemStatusDto
  ) {
    return this.orderService.updateOrderItemStatus(
      orderId,
      itemId,
      updateOrderItemStatusDto.status
    );
  }

  @Get("table/:tableId")
  findByTable(@Param("tableId") tableId: string) {
    return this.orderService.findByTable(tableId);
  }

  @Get("waiter/:waiterId")
  findByWaiter(@Param("waiterId") waiterId: string) {
    return this.orderService.findByWaiter(waiterId);
  }
}
