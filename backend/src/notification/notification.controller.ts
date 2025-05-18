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
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { CreateNotificationPreferenceDto } from "./dto/create-notification-preference.dto";
import { UpdateNotificationPreferenceDto } from "./dto/update-notification-preference.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    // Set the tenant ID from the authenticated user
    createNotificationDto.tenantId = req.user.tenantId;
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.notificationService.findAll(req.user.id, req.user.tenantId);
  }

  @Get("unread")
  findUnread(@Request() req) {
    return this.notificationService.findUnread(req.user.id, req.user.tenantId);
  }

  // Notification Preferences - moved here to avoid route conflict
  @Get("preferences")
  getPreferences(@Request() req) {
    return this.notificationService.getPreferences(
      req.user.id,
      req.user.tenantId
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    return this.notificationService.findOne(id, req.user.id, req.user.tenantId);
  }

  @Patch(":id/read")
  markAsRead(@Param("id") id: string, @Request() req) {
    return this.notificationService.markAsRead(
      id,
      req.user.id,
      req.user.tenantId
    );
  }

  @Post("read-all")
  markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(
      req.user.id,
      req.user.tenantId
    );
  }

  @Patch(":id/archive")
  archive(@Param("id") id: string, @Request() req) {
    return this.notificationService.archive(id, req.user.id, req.user.tenantId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req
  ) {
    return this.notificationService.update(
      id,
      updateNotificationDto,
      req.user.id,
      req.user.tenantId
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.notificationService.remove(id, req.user.id, req.user.tenantId);
  }

  // Notification Preferences

  @Post("preferences")
  createPreference(
    @Body() createPreferenceDto: CreateNotificationPreferenceDto,
    @Request() req
  ) {
    // Set the user ID and tenant ID from the authenticated user
    createPreferenceDto.userId = req.user.id;
    createPreferenceDto.tenantId = req.user.tenantId;
    return this.notificationService.createPreference(createPreferenceDto);
  }

  @Patch("preferences/:id")
  updatePreference(
    @Param("id") id: string,
    @Body() updatePreferenceDto: UpdateNotificationPreferenceDto,
    @Request() req
  ) {
    return this.notificationService.updatePreference(
      id,
      updatePreferenceDto,
      req.user.id,
      req.user.tenantId
    );
  }

  @Post("preferences/default")
  createDefaultPreferences(@Request() req) {
    return this.notificationService.createDefaultPreferences(
      req.user.id,
      req.user.tenantId
    );
  }
}
