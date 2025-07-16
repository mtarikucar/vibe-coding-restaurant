import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag, FeatureFlagStatus, PlanLevel } from '../entities/feature-flag.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
import * as crypto from 'crypto';

interface FeatureFlagContext {
  userId?: string;
  tenantId?: string;
  planLevel?: PlanLevel;
  subscription?: Subscription;
  userEmail?: string;
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private flagCache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: number = Date.now() + 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
  ) {
    this.initializeCache();
  }

  /**
   * Get feature flag value for a specific context
   */
  async getFeatureFlag(key: string, context: FeatureFlagContext = {}): Promise<any> {
    try {
      const flag = await this.getFlag(key);
      
      if (!flag || flag.status !== FeatureFlagStatus.ACTIVE) {
        return flag?.defaultValue || false;
      }

      // Check rollout percentage
      if (!this.isInRollout(key, context.userId || context.tenantId, flag.rolloutPercentage)) {
        return flag.defaultValue || false;
      }

      // Priority order: user override > tenant override > plan value > default value
      
      // 1. User-specific override
      if (context.userId && flag.userOverrides?.[context.userId] !== undefined) {
        return flag.userOverrides[context.userId];
      }

      // 2. Tenant-specific override
      if (context.tenantId && flag.tenantOverrides?.[context.tenantId] !== undefined) {
        return flag.tenantOverrides[context.tenantId];
      }

      // 3. Plan-based value
      const planLevel = this.determinePlanLevel(context);
      if (flag.planValues?.[planLevel] !== undefined) {
        return flag.planValues[planLevel];
      }

      // 4. Check if plan level meets minimum requirement
      if (!this.planMeetsRequirement(planLevel, flag.planLevel)) {
        return false;
      }

      // 5. Default value
      return flag.defaultValue !== undefined ? flag.defaultValue : true;
    } catch (error) {
      this.logger.error(`Error getting feature flag ${key}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get multiple feature flags at once
   */
  async getFeatureFlags(keys: string[], context: FeatureFlagContext = {}): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.getFeatureFlag(key, context);
      })
    );

    return results;
  }

  /**
   * Get all feature flags for a context
   */
  async getAllFeatureFlags(context: FeatureFlagContext = {}): Promise<Record<string, any>> {
    try {
      await this.refreshCacheIfNeeded();
      const flags = Array.from(this.flagCache.values());
      const results: Record<string, any> = {};

      await Promise.all(
        flags.map(async (flag) => {
          results[flag.key] = await this.getFeatureFlag(flag.key, context);
        })
      );

      return results;
    } catch (error) {
      this.logger.error(`Error getting all feature flags: ${error.message}`, error.stack);
      return {};
    }
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(key: string, context: FeatureFlagContext = {}): Promise<boolean> {
    const value = await this.getFeatureFlag(key, context);
    return !!value;
  }

  /**
   * Set user-specific override
   */
  async setUserOverride(flagKey: string, userId: string, value: any): Promise<void> {
    const flag = await this.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Feature flag ${flagKey} not found`);
    }

    flag.userOverrides = flag.userOverrides || {};
    flag.userOverrides[userId] = value;

    await this.featureFlagRepository.save(flag);
    this.flagCache.set(flagKey, flag);

    this.logger.log(`Set user override for ${flagKey}: ${userId} = ${value}`);
  }

  /**
   * Set tenant-specific override
   */
  async setTenantOverride(flagKey: string, tenantId: string, value: any): Promise<void> {
    const flag = await this.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Feature flag ${flagKey} not found`);
    }

    flag.tenantOverrides = flag.tenantOverrides || {};
    flag.tenantOverrides[tenantId] = value;

    await this.featureFlagRepository.save(flag);
    this.flagCache.set(flagKey, flag);

    this.logger.log(`Set tenant override for ${flagKey}: ${tenantId} = ${value}`);
  }

  /**
   * Remove user override
   */
  async removeUserOverride(flagKey: string, userId: string): Promise<void> {
    const flag = await this.getFlag(flagKey);
    if (!flag || !flag.userOverrides) {
      return;
    }

    delete flag.userOverrides[userId];
    await this.featureFlagRepository.save(flag);
    this.flagCache.set(flagKey, flag);

    this.logger.log(`Removed user override for ${flagKey}: ${userId}`);
  }

  /**
   * Remove tenant override
   */
  async removeTenantOverride(flagKey: string, tenantId: string): Promise<void> {
    const flag = await this.getFlag(flagKey);
    if (!flag || !flag.tenantOverrides) {
      return;
    }

    delete flag.tenantOverrides[tenantId];
    await this.featureFlagRepository.save(flag);
    this.flagCache.set(flagKey, flag);

    this.logger.log(`Removed tenant override for ${flagKey}: ${tenantId}`);
  }

  /**
   * Create or update feature flag
   */
  async upsertFeatureFlag(flagData: Partial<FeatureFlag>): Promise<FeatureFlag> {
    let flag = await this.featureFlagRepository.findOne({
      where: { key: flagData.key },
    });

    if (flag) {
      Object.assign(flag, flagData);
    } else {
      flag = this.featureFlagRepository.create(flagData);
    }

    const savedFlag = await this.featureFlagRepository.save(flag);
    this.flagCache.set(savedFlag.key, savedFlag);

    this.logger.log(`Upserted feature flag: ${savedFlag.key}`);
    return savedFlag;
  }

  /**
   * Initialize default feature flags
   */
  async initializeDefaultFlags(): Promise<void> {
    const defaultFlags: Partial<FeatureFlag>[] = [
      {
        key: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Access to advanced analytics dashboard and reports',
        planLevel: PlanLevel.PREMIUM,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: false,
          [PlanLevel.PREMIUM]: true,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['analytics', 'premium'],
      },
      {
        key: 'unlimited_users',
        name: 'Unlimited Users',
        description: 'Allow unlimited user accounts',
        planLevel: PlanLevel.ENTERPRISE,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: false,
          [PlanLevel.PREMIUM]: false,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['users', 'enterprise'],
      },
      {
        key: 'api_access',
        name: 'API Access',
        description: 'Access to REST API for integrations',
        planLevel: PlanLevel.BASIC,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: true,
          [PlanLevel.PREMIUM]: true,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['api', 'integration'],
      },
      {
        key: 'custom_branding',
        name: 'Custom Branding',
        description: 'Customize branding and theming',
        planLevel: PlanLevel.PREMIUM,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: false,
          [PlanLevel.PREMIUM]: true,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['branding', 'customization'],
      },
      {
        key: 'priority_support',
        name: 'Priority Support',
        description: 'Access to priority customer support',
        planLevel: PlanLevel.PREMIUM,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: false,
          [PlanLevel.PREMIUM]: true,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['support'],
      },
      {
        key: 'white_label',
        name: 'White Label',
        description: 'Remove branding and white label the application',
        planLevel: PlanLevel.ENTERPRISE,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: false,
          [PlanLevel.PREMIUM]: false,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['branding', 'enterprise'],
      },
      {
        key: 'multi_location',
        name: 'Multi-Location Management',
        description: 'Manage multiple restaurant locations',
        planLevel: PlanLevel.PREMIUM,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: false,
          [PlanLevel.PREMIUM]: true,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['locations', 'premium'],
      },
      {
        key: 'data_export',
        name: 'Data Export',
        description: 'Export data in various formats',
        planLevel: PlanLevel.BASIC,
        defaultValue: false,
        planValues: {
          [PlanLevel.FREE]: false,
          [PlanLevel.BASIC]: true,
          [PlanLevel.PREMIUM]: true,
          [PlanLevel.ENTERPRISE]: true,
        },
        tags: ['export', 'data'],
      },
    ];

    for (const flagData of defaultFlags) {
      const existing = await this.featureFlagRepository.findOne({
        where: { key: flagData.key },
      });

      if (!existing) {
        await this.upsertFeatureFlag(flagData);
      }
    }

    this.logger.log('Initialized default feature flags');
  }

  /**
   * Get flag from cache or database
   */
  private async getFlag(key: string): Promise<FeatureFlag | null> {
    await this.refreshCacheIfNeeded();
    
    if (this.flagCache.has(key)) {
      return this.flagCache.get(key);
    }

    const flag = await this.featureFlagRepository.findOne({
      where: { key },
    });

    if (flag) {
      this.flagCache.set(key, flag);
    }

    return flag;
  }

  /**
   * Initialize cache with all flags
   */
  private async initializeCache(): Promise<void> {
    try {
      const flags = await this.featureFlagRepository.find();
      this.flagCache.clear();
      
      for (const flag of flags) {
        this.flagCache.set(flag.key, flag);
      }

      this.cacheExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
      this.logger.log(`Initialized feature flag cache with ${flags.length} flags`);
    } catch (error) {
      this.logger.error(`Failed to initialize feature flag cache: ${error.message}`, error.stack);
    }
  }

  /**
   * Refresh cache if expired
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    if (Date.now() > this.cacheExpiry) {
      await this.initializeCache();
    }
  }

  /**
   * Determine plan level from context
   */
  private determinePlanLevel(context: FeatureFlagContext): PlanLevel {
    if (context.planLevel) {
      return context.planLevel;
    }

    if (context.subscription?.plan?.type) {
      const planType = context.subscription.plan.type.toLowerCase();
      
      switch (planType) {
        case 'monthly':
          return PlanLevel.BASIC;
        case 'yearly':
          return PlanLevel.PREMIUM;
        case 'enterprise':
        case 'custom':
          return PlanLevel.ENTERPRISE;
        default:
          return PlanLevel.FREE;
      }
    }

    return PlanLevel.FREE;
  }

  /**
   * Check if current plan meets minimum requirement
   */
  private planMeetsRequirement(currentLevel: PlanLevel, requiredLevel: PlanLevel): boolean {
    const hierarchy = [PlanLevel.FREE, PlanLevel.BASIC, PlanLevel.PREMIUM, PlanLevel.ENTERPRISE];
    return hierarchy.indexOf(currentLevel) >= hierarchy.indexOf(requiredLevel);
  }

  /**
   * Check if user/tenant is in feature rollout
   */
  private isInRollout(flagKey: string, identifier: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use consistent hashing to determine if user is in rollout
    const hash = crypto.createHash('md5').update(flagKey + identifier).digest('hex');
    const hashNumber = parseInt(hash.substr(0, 8), 16);
    const bucket = hashNumber % 100;

    return bucket < percentage;
  }
}