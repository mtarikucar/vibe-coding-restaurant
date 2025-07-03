import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, LessThan, MoreThanOrEqual, In } from "typeorm";
import { ConfigService } from "@nestjs/config";
import {
  Subscription,
  SubscriptionStatus,
  PaymentProvider,
} from "./entities/subscription.entity";
import {
  SubscriptionPlan,
  PlanType,
  PlanStatus,
} from "./entities/subscription-plan.entity";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { User, UserSubscriptionStatus } from "../auth/entities/user.entity";
import { Tenant, TenantStatus } from "../tenant/entities/tenant.entity";
import { EmailService } from "../shared/services/email.service";
import { PaymentGatewayService } from "../payment/services/payment-gateway.service";
import { addDays, format } from "date-fns";

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly paymentGatewayService: PaymentGatewayService
  ) {}

  async createPlan(
    createSubscriptionPlanDto: CreateSubscriptionPlanDto
  ): Promise<SubscriptionPlan> {
    const plan = this.subscriptionPlanRepository.create(
      createSubscriptionPlanDto
    );
    return this.subscriptionPlanRepository.save(plan);
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      where: { isPublic: true, status: PlanStatus.ACTIVE },
      order: { price: "ASC" },
    });
  }

  async findAllPlansAdmin(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      order: { price: "ASC" },
    });
  }

  async findPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto
  ): Promise<Subscription> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists with tenant
      const user = await this.userRepository.findOne({
        where: { id: createSubscriptionDto.userId },
        relations: ["tenant"],
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${createSubscriptionDto.userId} not found`
        );
      }

      if (!user.tenant) {
        throw new BadRequestException("User must belong to a tenant");
      }

      // Check if plan exists
      const plan = await this.subscriptionPlanRepository.findOne({
        where: { id: createSubscriptionDto.planId },
      });

      if (!plan) {
        throw new NotFoundException(
          `Subscription plan with ID ${createSubscriptionDto.planId} not found`
        );
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: {
          userId: user.id,
          status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
        },
      });

      if (existingSubscription) {
        throw new ConflictException(
          "Tenant already has an active subscription"
        );
      }

      // Determine payment provider based on tenant's country
      const paymentProvider = this.getPaymentProvider(user.tenant.country);

      // Create subscription
      const subscription = this.subscriptionRepository.create({
        ...createSubscriptionDto,
        userId: user.id,
        amount: plan.price,
        currency:
          createSubscriptionDto.currency ||
          this.getCurrencyByCountry(user.tenant.country),
        paymentProvider,
      });

      // Save subscription
      const savedSubscription = await queryRunner.manager.save(subscription);

      // Update user subscription status
      user.subscriptionStatus = UserSubscriptionStatus.ACTIVE;
      user.subscriptionId = savedSubscription.id;
      await queryRunner.manager.save(user);

      // Update tenant subscription info
      user.tenant.subscriptionId = savedSubscription.id;
      user.tenant.status = TenantStatus.ACTIVE;
      await queryRunner.manager.save(user.tenant);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Send subscription confirmation email
      try {
        if (user.email && plan) {
          await this.emailService.sendSubscriptionConfirmationEmail(
            user.email,
            plan.name,
            subscription.endDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days if no end date
            subscription.amount,
            subscription.currency
          );
        }
      } catch (emailError) {
        this.logger.error(
          `Failed to send subscription confirmation email: ${emailError.message}`,
          emailError.stack
        );
        // Don't throw the error as the subscription was created successfully
      }

      return savedSubscription;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ["user", "plan"],
      order: { createdAt: "DESC" },
    });
  }

  async findSubscriptionById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ["user", "plan"],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async updateSubscription(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto
  ): Promise<Subscription> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id },
        relations: ["user"],
      });

      if (!subscription) {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }

      // If status is being updated to CANCELED, set canceledAt
      if (
        updateSubscriptionDto.status === SubscriptionStatus.CANCELED &&
        !updateSubscriptionDto.canceledAt
      ) {
        updateSubscriptionDto.canceledAt = new Date();
      }

      // Update subscription
      Object.assign(subscription, updateSubscriptionDto);
      const updatedSubscription = await queryRunner.manager.save(subscription);

      // Update user subscription status if needed
      if (updateSubscriptionDto.status) {
        const user = subscription.user;

        switch (updateSubscriptionDto.status) {
          case SubscriptionStatus.ACTIVE:
            user.subscriptionStatus = UserSubscriptionStatus.ACTIVE;
            break;
          case SubscriptionStatus.CANCELED:
          case SubscriptionStatus.EXPIRED:
            user.subscriptionStatus = UserSubscriptionStatus.CANCELED;
            break;
          case SubscriptionStatus.TRIAL:
            user.subscriptionStatus = UserSubscriptionStatus.TRIAL;
            break;
        }

        await queryRunner.manager.save(user);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      return updatedSubscription;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const subscription = await this.updateSubscription(id, {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
      autoRenew: false,
    });

    // Send cancellation email
    try {
      const user = await this.userRepository.findOne({
        where: { id: subscription.userId },
      });

      const plan = await this.subscriptionPlanRepository.findOne({
        where: { id: subscription.planId },
      });

      if (user && user.email && plan) {
        await this.emailService.sendSubscriptionCanceledEmail(
          user.email,
          plan.name,
          subscription.endDate || new Date()
        );
        this.logger.log(`Subscription canceled email sent to ${user.email}`);
      }
    } catch (emailError) {
      this.logger.error(
        `Failed to send subscription canceled email: ${emailError.message}`,
        emailError.stack
      );
      // Don't throw the error as the subscription was canceled successfully
    }

    return subscription;
  }

  async startTrial(userId: string, planId: string): Promise<Subscription> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if plan exists
      const plan = await this.subscriptionPlanRepository.findOne({
        where: { id: planId },
      });

      if (!plan) {
        throw new NotFoundException(
          `Subscription plan with ID ${planId} not found`
        );
      }

      // Check if user already has an active subscription or trial
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: [
          { userId, status: SubscriptionStatus.ACTIVE },
          { userId, status: SubscriptionStatus.TRIAL },
        ],
      });

      if (existingSubscription) {
        throw new ConflictException(
          "User already has an active subscription or trial"
        );
      }

      // Calculate trial period dates
      const startDate = new Date();
      const endDate = addDays(startDate, plan.trialPeriod);

      // Create subscription
      const subscription = this.subscriptionRepository.create({
        userId,
        planId,
        status: SubscriptionStatus.TRIAL,
        startDate,
        endDate,
        autoRenew: false,
        amount: 0, // Trial is free
        currency: "usd",
      });

      // Save subscription
      const savedSubscription = await queryRunner.manager.save(subscription);

      // Update user subscription status
      user.subscriptionStatus = UserSubscriptionStatus.TRIAL;
      user.trialStartDate = startDate;
      user.trialEndDate = endDate;
      user.subscriptionId = savedSubscription.id;
      await queryRunner.manager.save(user);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Send trial started email
      try {
        if (user.email && plan) {
          await this.emailService.sendTrialStartedEmail(
            user.email,
            endDate,
            plan.name
          );
        }
      } catch (emailError) {
        this.logger.error(
          `Failed to send trial started email: ${emailError.message}`,
          emailError.stack
        );
        // Don't throw the error as the trial was started successfully
      }

      return savedSubscription;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async checkExpiredTrials(): Promise<void> {
    const today = new Date();

    // Find all trial subscriptions that have expired
    const expiredTrials = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        endDate: LessThan(today),
      },
      relations: ["user"],
    });

    for (const subscription of expiredTrials) {
      try {
        // Update subscription status
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(subscription);

        // Update user subscription status
        const user = subscription.user;
        user.subscriptionStatus = UserSubscriptionStatus.EXPIRED;
        await this.userRepository.save(user);

        // Send email notification
        if (user.email) {
          try {
            // Get plan information
            const plan = await this.subscriptionPlanRepository.findOne({
              where: { id: subscription.planId },
            });

            if (plan) {
              await this.emailService.sendTrialExpiredEmail(
                user.email,
                plan.name
              );
              this.logger.log(`Trial expired email sent to ${user.email}`);
            }
          } catch (emailError) {
            this.logger.error(
              `Failed to send trial expired email: ${emailError.message}`,
              emailError.stack
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to process expired trial for subscription ${subscription.id}`,
          error.stack
        );
      }
    }
  }

  async checkExpiringTrials(): Promise<void> {
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    // Find all trial subscriptions that will expire in the next 3 days
    const expiringTrials = await this.subscriptionRepository.find({
      where: [
        {
          status: SubscriptionStatus.TRIAL,
          endDate: LessThan(threeDaysFromNow),
          // Use a separate query to check for endDate >= today
        },
      ],
      relations: ["user", "plan"],
    });

    // Filter out trials that have already expired
    const activeExpiringTrials = expiringTrials.filter(
      (subscription) => subscription.endDate >= today
    );

    for (const subscription of activeExpiringTrials) {
      try {
        const user = subscription.user;
        const daysLeft = Math.ceil(
          (subscription.endDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Send email notification
        if (user.email && subscription.plan) {
          try {
            await this.emailService.sendTrialEndingSoonEmail(
              user.email,
              daysLeft,
              subscription.endDate,
              subscription.plan.name
            );
            this.logger.log(`Trial ending soon email sent to ${user.email}`);
          } catch (emailError) {
            this.logger.error(
              `Failed to send trial ending soon email: ${emailError.message}`,
              emailError.stack
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to process expiring trial notification for subscription ${subscription.id}`,
          error.stack
        );
      }
    }
  }

  async requestCustomPlan(
    userId: string,
    details: Record<string, any>
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get admin email from config
    const adminEmail = this.configService.get<string>(
      "ADMIN_EMAIL",
      "admin@restaurant-management.com"
    );

    // Send email to admin
    try {
      if (user.email) {
        await this.emailService.sendCustomPlanRequestEmail(
          adminEmail,
          user.email,
          JSON.stringify(details, null, 2)
        );
        this.logger.log(
          `Custom plan request email sent to admin for user ${userId}`
        );
      }
    } catch (emailError) {
      this.logger.error(
        `Failed to send custom plan request email: ${emailError.message}`,
        emailError.stack
      );
      // Still return success as the request was recorded
    }
  }

  async createInitialPlans(): Promise<void> {
    const existingPlans = await this.subscriptionPlanRepository.find();

    if (existingPlans.length === 0) {
      // Create monthly plan
      await this.createPlan({
        name: "Monthly Plan",
        description: "Basic monthly subscription plan",
        price: 29.99,
        type: PlanType.MONTHLY,
        duration: 30,
        trialPeriod: 15,
        isPublic: true,
        features: {
          tables: "unlimited",
          users: "up to 10",
          support: "email",
          analytics: "basic",
        },
      });

      // Create yearly plan
      await this.createPlan({
        name: "Yearly Plan",
        description: "Premium yearly subscription with discount",
        price: 299.99,
        type: PlanType.YEARLY,
        duration: 365,
        trialPeriod: 15,
        isPublic: true,
        features: {
          tables: "unlimited",
          users: "up to 20",
          support: "priority",
          analytics: "advanced",
        },
      });

      // Create custom plan (not public)
      await this.createPlan({
        name: "Enterprise Plan",
        description: "Custom enterprise subscription",
        price: 0, // Price is custom
        type: PlanType.CUSTOM,
        duration: 30,
        trialPeriod: 15,
        isPublic: false,
        features: {
          tables: "unlimited",
          users: "unlimited",
          support: "24/7 dedicated",
          analytics: "premium",
          customization: "full",
        },
      });
    }
  }

  /**
   * Get payment provider based on country
   */
  private getPaymentProvider(country: string): PaymentProvider {
    if (!country) {
      return PaymentProvider.STRIPE;
    }

    const countryLower = country.toLowerCase();
    if (countryLower === "turkey" || countryLower === "tr") {
      return PaymentProvider.IYZICO;
    }

    return PaymentProvider.STRIPE;
  }

  /**
   * Get currency based on country
   */
  private getCurrencyByCountry(country: string): string {
    if (!country) {
      return "usd";
    }

    const countryLower = country.toLowerCase();

    const currencyMap: Record<string, string> = {
      turkey: "try",
      tr: "try",
      "united states": "usd",
      us: "usd",
      usa: "usd",
      "united kingdom": "gbp",
      uk: "gbp",
      gb: "gbp",
      germany: "eur",
      de: "eur",
      france: "eur",
      fr: "eur",
      spain: "eur",
      es: "eur",
      italy: "eur",
      it: "eur",
      netherlands: "eur",
      nl: "eur",
      canada: "cad",
      ca: "cad",
      australia: "aud",
      au: "aud",
      japan: "jpy",
      jp: "jpy",
    };

    return currencyMap[countryLower] || "usd";
  }

  /**
   * Find subscription by user
   */
  async findSubscriptionByUser(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId },
      relations: ["plan", "user"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
      },
    });

    return !!subscription;
  }
}
