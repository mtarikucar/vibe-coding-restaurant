import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FeatureFlag, FeatureFlagType, PlanLevel } from '../entities/feature-flag.entity';

interface SetOverrideDto {
  value: any;
}

interface CreateFeatureFlagDto {
  key: string;
  name: string;
  description?: string;
  type?: FeatureFlagType;
  planLevel?: PlanLevel;
  defaultValue?: any;
  planValues?: Record<string, any>;
  tags?: string[];
}

@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  private readonly logger = new Logger(FeatureFlagController.name);

  constructor(private readonly featureFlagService: FeatureFlagService) {}

  /**
   * Get all feature flags for the current user/tenant
   */
  @Get()
  async getFeatureFlags(@Req() req: Request, @Query('keys') keys?: string) {
    try {
      const user = req.user as any;
      const context = {
        userId: user.id,
        tenantId: user.tenant?.id,
        subscription: req.subscription,
        userEmail: user.email,
      };

      let result;
      if (keys) {
        const keyArray = keys.split(',').map(k => k.trim());
        result = await this.featureFlagService.getFeatureFlags(keyArray, context);
      } else {
        result = await this.featureFlagService.getAllFeatureFlags(context);
      }

      this.logger.log(`Retrieved feature flags for user ${user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get feature flags: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve feature flags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific feature flag value
   */
  @Get(':key')
  async getFeatureFlag(@Req() req: Request, @Param('key') key: string) {
    try {
      const user = req.user as any;
      const context = {
        userId: user.id,
        tenantId: user.tenant?.id,
        subscription: req.subscription,
        userEmail: user.email,
      };

      const value = await this.featureFlagService.getFeatureFlag(key, context);

      this.logger.log(`Retrieved feature flag ${key} for user ${user.id}: ${value}`);
      return { key, value, enabled: !!value };
    } catch (error) {
      this.logger.error(`Failed to get feature flag ${key}: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve feature flag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a feature is enabled
   */
  @Get(':key/enabled')
  async isFeatureEnabled(@Req() req: Request, @Param('key') key: string) {
    try {
      const user = req.user as any;
      const context = {
        userId: user.id,
        tenantId: user.tenant?.id,
        subscription: req.subscription,
        userEmail: user.email,
      };

      const enabled = await this.featureFlagService.isFeatureEnabled(key, context);

      this.logger.log(`Checked feature ${key} enabled for user ${user.id}: ${enabled}`);
      return { key, enabled };
    } catch (error) {
      this.logger.error(`Failed to check feature ${key}: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to check feature status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Set user-specific override (admin only)
   */
  @Put(':key/user-override/:userId')
  async setUserOverride(
    @Param('key') key: string,
    @Param('userId') userId: string,
    @Body() setOverrideDto: SetOverrideDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as any;
      
      // Check if user is admin (you might want to use a proper admin guard)
      if (!user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      await this.featureFlagService.setUserOverride(key, userId, setOverrideDto.value);

      this.logger.log(`Set user override for ${key}: ${userId} = ${setOverrideDto.value}`);
      return { success: true, message: 'User override set successfully' };
    } catch (error) {
      this.logger.error(`Failed to set user override: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to set user override',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Set tenant-specific override (admin only)
   */
  @Put(':key/tenant-override/:tenantId')
  async setTenantOverride(
    @Param('key') key: string,
    @Param('tenantId') tenantId: string,
    @Body() setOverrideDto: SetOverrideDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as any;
      
      // Check if user is admin (you might want to use a proper admin guard)
      if (!user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      await this.featureFlagService.setTenantOverride(key, tenantId, setOverrideDto.value);

      this.logger.log(`Set tenant override for ${key}: ${tenantId} = ${setOverrideDto.value}`);
      return { success: true, message: 'Tenant override set successfully' };
    } catch (error) {
      this.logger.error(`Failed to set tenant override: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to set tenant override',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Remove user override (admin only)
   */
  @Delete(':key/user-override/:userId')
  async removeUserOverride(
    @Param('key') key: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      await this.featureFlagService.removeUserOverride(key, userId);

      this.logger.log(`Removed user override for ${key}: ${userId}`);
      return { success: true, message: 'User override removed successfully' };
    } catch (error) {
      this.logger.error(`Failed to remove user override: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to remove user override',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Remove tenant override (admin only)
   */
  @Delete(':key/tenant-override/:tenantId')
  async removeTenantOverride(
    @Param('key') key: string,
    @Param('tenantId') tenantId: string,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      await this.featureFlagService.removeTenantOverride(key, tenantId);

      this.logger.log(`Removed tenant override for ${key}: ${tenantId}`);
      return { success: true, message: 'Tenant override removed successfully' };
    } catch (error) {
      this.logger.error(`Failed to remove tenant override: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to remove tenant override',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create or update feature flag (admin only)
   */
  @Post()
  async createFeatureFlag(
    @Body() createFeatureFlagDto: CreateFeatureFlagDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const flag = await this.featureFlagService.upsertFeatureFlag(createFeatureFlagDto);

      this.logger.log(`Created/updated feature flag: ${flag.key}`);
      return flag;
    } catch (error) {
      this.logger.error(`Failed to create feature flag: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to create feature flag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get feature flags summary (for admin dashboard)
   */
  @Get('admin/summary')
  async getFeatureFlagsSummary(@Req() req: Request) {
    try {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      // This would need to be implemented in the service
      // For now, return a placeholder
      const summary = {
        totalFlags: 8,
        activeFlags: 8,
        inactiveFlags: 0,
        deprecatedFlags: 0,
        flagsByPlan: {
          free: 2,
          basic: 3,
          premium: 5,
          enterprise: 8,
        },
      };

      this.logger.log(`Retrieved feature flags summary for admin ${user.id}`);
      return summary;
    } catch (error) {
      this.logger.error(`Failed to get feature flags summary: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve feature flags summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}