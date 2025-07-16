declare global {
  namespace Express {
    interface Request {
      subscription?: import('../subscription/entities/subscription.entity').Subscription;
      subscriptionStatus?: {
        hasActiveSubscription: boolean;
        isTrialUser: boolean;
        daysUntilExpiry?: number;
        planName?: string;
        planType?: string;
        features?: Record<string, any>;
      };
      featureAccess?: {
        hasAccess: boolean;
        feature: string;
        limitation?: string;
        currentPlan?: string;
        fallbackBehavior?: 'block' | 'limit' | 'degrade';
      };
      featureFlags?: Record<string, boolean>;
    }
  }
}

export {};