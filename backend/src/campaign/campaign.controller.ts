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
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MARKETING, UserRole.MANAGER)
  create(@Body() createCampaignDto: CreateCampaignDto, @Request() req) {
    return this.campaignService.create(
      createCampaignDto, 
      req.user.id,
      req.user.tenantId
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.campaignService.findAll(req.user.tenantId);
  }

  @Get('active')
  findActive(@Request() req) {
    return this.campaignService.findActive(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.campaignService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MARKETING, UserRole.MANAGER)
  update(
    @Param('id') id: string, 
    @Body() updateCampaignDto: UpdateCampaignDto,
    @Request() req
  ) {
    return this.campaignService.update(id, updateCampaignDto, req.user.tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MARKETING)
  remove(@Param('id') id: string, @Request() req) {
    return this.campaignService.remove(id, req.user.tenantId);
  }

  @Post('validate-code')
  validateCode(@Body() body: { code: string }, @Request() req) {
    return this.campaignService.validateCampaignCode(body.code, req.user.tenantId);
  }

  @Post('apply/:id/order/:orderId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAITER, UserRole.CASHIER)
  applyCampaignToOrder(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Request() req
  ) {
    return this.campaignService.applyCampaignToOrder(orderId, id, req.user.tenantId);
  }
}
