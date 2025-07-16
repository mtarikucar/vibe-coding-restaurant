import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentStatusDto } from "./dto/update-payment-status.dto";
import { ProcessPaymentDto } from "./dto/process-payment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { Request } from "express";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.paymentService.create(createPaymentDto, user?.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  findAll(@Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.paymentService.findAll(tenantId);
  }

  @Get("order/:orderNumber")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  findByOrderNumber(@Param("orderNumber") orderNumber: string, @Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.paymentService.findByOrderNumber(orderNumber, tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  findOne(@Param("id") id: string, @Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.paymentService.findOne(id, tenantId);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  updateStatus(
    @Param("id") id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto
  ) {
    return this.paymentService.updateStatus(id, updatePaymentStatusDto.status);
  }

  @Get("order/:orderId")
  @Roles(UserRole.ADMIN, UserRole.CASHIER, UserRole.WAITER)
  @UseGuards(RolesGuard)
  findByOrder(@Param("orderId") orderId: string) {
    return this.paymentService.findByOrder(orderId);
  }

  @Post(":id/process")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @UseGuards(RolesGuard)
  processPayment(
    @Param("id") id: string,
    @Body() processPaymentDto: ProcessPaymentDto
  ) {
    return this.paymentService.processPayment(id, processPaymentDto);
  }
}
