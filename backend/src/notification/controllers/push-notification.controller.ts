import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PushNotificationService } from '../services/push-notification.service';
import { Request } from 'express';

@Controller('notifications')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  @Get('vapid-public-key')
  @UseGuards(JwtAuthGuard)
  getVapidPublicKey() {
    return { publicKey: this.pushNotificationService.getPublicKey() };
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async saveSubscription(@Req() req: Request, @Body() body: { subscription: string }) {
    const user = req.user as any;
    const subscription = await this.pushNotificationService.saveSubscription(
      user.id,
      user.tenantId,
      body.subscription,
    );
    return { success: true, id: subscription.id };
  }

  @Delete('subscriptions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteSubscription(@Req() req: Request, @Body() body: { subscription: string }) {
    const user = req.user as any;
    const success = await this.pushNotificationService.deleteSubscription(
      user.id,
      body.subscription,
    );
    return { success };
  }

  @Get('subscriptions/status')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStatus(@Req() req: Request) {
    const user = req.user as any;
    const hasSubscription = await this.pushNotificationService.hasActiveSubscription(user.id);
    return { hasSubscription };
  }
}
