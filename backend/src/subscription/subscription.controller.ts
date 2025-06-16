import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";

@Controller("subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Plan endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("plans")
  createPlan(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createPlan(createSubscriptionPlanDto);
  }

  @Get("plans")
  findAllPlans() {
    return this.subscriptionService.findAllPlans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("plans/admin")
  findAllPlansAdmin() {
    return this.subscriptionService.findAllPlansAdmin();
  }

  @Get("plans/:id")
  findPlanById(@Param("id") id: string) {
    return this.subscriptionService.findPlanById(id);
  }

  // Subscription endpoints
  @UseGuards(JwtAuthGuard)
  @Post()
  createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req
  ) {
    // JWT stratejisinde kullanıcı kimliği 'sub' veya 'id' olarak saklanıyor olabilir
    const userId = req.user.id || req.user.sub;
    const tenantId = req.tenantId;

    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    if (!tenantId) {
      throw new BadRequestException("Tenant ID not found in request");
    }

    // Only admins can create subscriptions for other users
    if (
      createSubscriptionDto.userId !== userId &&
      req.user.role !== UserRole.ADMIN
    ) {
      throw new BadRequestException(
        "You can only create subscriptions for yourself"
      );
    }

    // Eğer userId belirtilmemişse, mevcut kullanıcının ID'sini kullan
    if (!createSubscriptionDto.userId) {
      createSubscriptionDto.userId = userId;
    }

    // Add tenant ID to subscription
    createSubscriptionDto.tenantId = tenantId;

    return this.subscriptionService.createSubscription(createSubscriptionDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAllSubscriptions() {
    return this.subscriptionService.findAllSubscriptions();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  findMySubscription(@Request() req) {
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    return this.subscriptionService.findSubscriptionByUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(":id")
  findSubscriptionById(@Param("id") id: string) {
    return this.subscriptionService.findSubscriptionById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  updateSubscription(
    @Param("id") id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Request() req
  ) {
    // JWT stratejisinde kullanıcı kimliği 'sub' veya 'id' olarak saklanıyor olabilir
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    // Check if the subscription belongs to the user or if the user is an admin
    const subscription = this.subscriptionService.findSubscriptionById(id);
    if (subscription["userId"] !== userId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        "You can only update your own subscriptions"
      );
    }

    return this.subscriptionService.updateSubscription(
      id,
      updateSubscriptionDto
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel")
  cancelSubscription(@Param("id") id: string, @Request() req) {
    // JWT stratejisinde kullanıcı kimliği 'sub' veya 'id' olarak saklanıyor olabilir
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    // Check if the subscription belongs to the user or if the user is an admin
    const subscription = this.subscriptionService.findSubscriptionById(id);
    if (subscription["userId"] !== userId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        "You can only cancel your own subscriptions"
      );
    }

    return this.subscriptionService.cancelSubscription(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("trial/:planId")
  startTrial(@Param("planId") planId: string, @Request() req) {
    // JWT stratejisinde kullanıcı kimliği 'sub' veya 'id' olarak saklanıyor olabilir
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    return this.subscriptionService.startTrial(userId, planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("custom-request")
  requestCustomPlan(@Body() details: Record<string, any>, @Request() req) {
    // JWT stratejisinde kullanıcı kimliği 'sub' veya 'id' olarak saklanıyor olabilir
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      throw new BadRequestException("User ID not found in token");
    }

    return this.subscriptionService.requestCustomPlan(userId, details);
  }
}
