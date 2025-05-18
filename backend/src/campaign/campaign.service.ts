import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Campaign, CampaignStatus, CampaignType, CampaignApplicability } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { MenuService } from '../menu/menu.service';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly menuService: MenuService,
  ) {}

  async create(createCampaignDto: CreateCampaignDto, userId: string, tenantId: string): Promise<Campaign> {
    // Validate campaign data
    await this.validateCampaign(createCampaignDto);

    // Check if code is unique if required
    if (createCampaignDto.requiresCode && createCampaignDto.code) {
      const existingCampaign = await this.campaignRepository.findOne({
        where: { 
          code: createCampaignDto.code,
          isDeleted: false,
          tenantId,
        },
      });

      if (existingCampaign) {
        throw new ConflictException(`Campaign with code ${createCampaignDto.code} already exists`);
      }
    }

    // Create campaign
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      createdById: userId,
      tenantId,
      usageCount: 0,
    });

    return this.campaignRepository.save(campaign);
  }

  async findAll(tenantId: string): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { 
        isDeleted: false,
        tenantId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(tenantId: string): Promise<Campaign[]> {
    const now = new Date();
    
    // Find campaigns that are active and not expired
    return this.campaignRepository.find({
      where: [
        // Active campaigns with no end date
        {
          status: CampaignStatus.ACTIVE,
          isDeleted: false,
          tenantId,
          endDate: null,
        },
        // Active campaigns with end date in the future
        {
          status: CampaignStatus.ACTIVE,
          isDeleted: false,
          tenantId,
          endDate: MoreThanOrEqual(now),
        },
        // Scheduled campaigns that should be active now
        {
          status: CampaignStatus.SCHEDULED,
          isDeleted: false,
          tenantId,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
      ],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { 
        id,
        isDeleted: false,
        tenantId,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto, tenantId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, tenantId);

    // Validate campaign data
    if (Object.keys(updateCampaignDto).length > 0) {
      await this.validateCampaign({ ...campaign, ...updateCampaignDto });
    }

    // Check if code is unique if being updated
    if (updateCampaignDto.requiresCode && updateCampaignDto.code && updateCampaignDto.code !== campaign.code) {
      const existingCampaign = await this.campaignRepository.findOne({
        where: { 
          code: updateCampaignDto.code,
          isDeleted: false,
          tenantId,
        },
      });

      if (existingCampaign) {
        throw new ConflictException(`Campaign with code ${updateCampaignDto.code} already exists`);
      }
    }

    // Update campaign
    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const campaign = await this.findOne(id, tenantId);
    
    // Soft delete
    campaign.isDeleted = true;
    await this.campaignRepository.save(campaign);
  }

  async validateCampaign(campaign: CreateCampaignDto | Campaign): Promise<void> {
    // Validate date range
    if (campaign.startDate && campaign.endDate) {
      if (new Date(campaign.startDate) > new Date(campaign.endDate)) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Validate recurring settings
    if (campaign.isRecurring) {
      if (!campaign.recurringDays || campaign.recurringDays.length === 0) {
        throw new BadRequestException('Recurring days must be specified for recurring campaigns');
      }

      if (!campaign.recurringStartTime || !campaign.recurringEndTime) {
        throw new BadRequestException('Recurring start and end times must be specified for recurring campaigns');
      }

      // Validate recurring days (0-6, where 0 is Sunday)
      for (const day of campaign.recurringDays) {
        if (day < 0 || day > 6) {
          throw new BadRequestException('Recurring days must be between 0 and 6');
        }
      }
    }

    // Validate applicable items if specific items or categories are selected
    if (campaign.applicability !== CampaignApplicability.ALL_ITEMS) {
      if (!campaign.applicableItems || campaign.applicableItems.length === 0) {
        throw new BadRequestException('Applicable items must be specified for specific item or category campaigns');
      }
    }

    // Validate campaign type specific requirements
    if (campaign.type === CampaignType.PERCENTAGE) {
      if (campaign.value < 0 || campaign.value > 100) {
        throw new BadRequestException('Percentage discount must be between 0 and 100');
      }
    } else if (campaign.type === CampaignType.FIXED_AMOUNT) {
      if (campaign.value <= 0) {
        throw new BadRequestException('Fixed amount discount must be greater than 0');
      }
    } else if (campaign.type === CampaignType.BUY_X_GET_Y) {
      if (campaign.value <= 0) {
        throw new BadRequestException('Buy X Get Y value must be greater than 0');
      }
    }

    // Validate code if required
    if (campaign.requiresCode && !campaign.code) {
      throw new BadRequestException('Code must be specified for campaigns that require a code');
    }
  }

  async applyCampaignToOrder(orderId: string, campaignId: string, tenantId: string): Promise<any> {
    // This method would apply a campaign to an order
    // Implementation would depend on the order structure
    // and how discounts are calculated
    return { success: true, message: 'Campaign applied to order' };
  }

  async validateCampaignCode(code: string, tenantId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { 
        code,
        requiresCode: true,
        status: CampaignStatus.ACTIVE,
        isDeleted: false,
        tenantId,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with code ${code} not found or not active`);
    }

    // Check if campaign is expired
    const now = new Date();
    if (campaign.endDate && now > new Date(campaign.endDate)) {
      throw new BadRequestException('Campaign has expired');
    }

    // Check if campaign has reached usage limit
    if (campaign.usageLimit > 0 && campaign.usageCount >= campaign.usageLimit) {
      throw new BadRequestException('Campaign has reached its usage limit');
    }

    return campaign;
  }

  async incrementUsageCount(id: string, tenantId: string): Promise<void> {
    const campaign = await this.findOne(id, tenantId);
    campaign.usageCount += 1;
    await this.campaignRepository.save(campaign);
  }
}
