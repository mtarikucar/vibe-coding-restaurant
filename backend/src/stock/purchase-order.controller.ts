import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { PurchaseOrderStatus } from './entities/purchase-order.entity';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @Request() req) {
    return this.purchaseOrderService.create({
      ...createPurchaseOrderDto,
      createdById: req.user.id,
      tenantId: req.user.tenantId,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Request() req, @Query('status') status?: PurchaseOrderStatus) {
    return this.purchaseOrderService.findAll(req.user.tenantId, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.purchaseOrderService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Request() req,
  ) {
    return this.purchaseOrderService.update(id, {
      ...updatePurchaseOrderDto,
      lastUpdatedById: req.user.id,
    }, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.purchaseOrderService.remove(id, req.user.tenantId);
  }

  @Patch(':id/receive')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  receiveOrder(
    @Param('id') id: string,
    @Body() receiveItems: { items: { id: string; receivedQuantity: number }[] },
    @Request() req,
  ) {
    return this.purchaseOrderService.receiveOrder(
      id,
      receiveItems.items,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get('supplier/:supplierId')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findBySupplier(@Param('supplierId') supplierId: string, @Request() req) {
    return this.purchaseOrderService.findBySupplier(supplierId, req.user.tenantId);
  }
}
