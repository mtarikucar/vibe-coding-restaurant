import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { UpdateOrderItemStatusDto } from '../order/dto/update-order-item-status.dto';

@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.KITCHEN)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('orders')
  findActiveOrders() {
    return this.kitchenService.findActiveOrders();
  }

  @Patch('orders/:orderId/items/:itemId/status')
  updateOrderItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateOrderItemStatusDto: UpdateOrderItemStatusDto,
  ) {
    return this.kitchenService.updateOrderItemStatus(
      orderId,
      itemId,
      updateOrderItemStatusDto.status,
    );
  }
}
