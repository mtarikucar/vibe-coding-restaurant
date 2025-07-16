import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  duration: number;
  trialPeriod: number;
  features: Record<string, any>;
  isPublic: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  subscriptionId?: string;
  status: 'ACTIVE' | 'TRIAL' | 'CANCELED' | 'EXPIRED' | 'FAILED' | 'PENDING';
  startDate: string;
  endDate?: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  canceledAt?: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  paymentProvider: 'STRIPE' | 'IYZICO' | 'PAYPAL';
  paymentDetails?: Record<string, any>;
  plan?: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isTrialUser: boolean;
  daysUntilExpiry?: number;
  planName?: string;
  planType?: string;
  features?: Record<string, any>;
}

export interface FeatureAccess {
  hasAccess: boolean;
  feature: string;
  limitation?: string;
  currentPlan?: string;
  fallbackBehavior?: 'block' | 'limit' | 'degrade';
}

interface SubscriptionStore {
  // State
  currentSubscription: Subscription | null;
  subscriptionStatus: SubscriptionStatus | null;
  availablePlans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentSubscription: (subscription: Subscription | null) => void;
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void;
  setAvailablePlans: (plans: SubscriptionPlan[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  fetchCurrentSubscription: () => Promise<void>;
  fetchAvailablePlans: () => Promise<void>;
  createSubscription: (planId: string, paymentDetails: any) => Promise<Subscription>;
  cancelSubscription: () => Promise<void>;
  startTrial: (planId: string) => Promise<Subscription>;
  
  // Feature Access
  hasFeature: (feature: string) => boolean;
  canAccess: (feature: string) => FeatureAccess;
  
  // Computed
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  needsUpgrade: boolean;
}

const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentSubscription: null,
      subscriptionStatus: null,
      availablePlans: [],
      loading: false,
      error: null,

      // Basic Actions
      setCurrentSubscription: (subscription) => set({ currentSubscription: subscription }),
      setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
      setAvailablePlans: (plans) => set({ availablePlans: plans }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // API Actions
      fetchCurrentSubscription: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/subscription/current', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const subscription = await response.json();
            set({ currentSubscription: subscription });
            
            // Update subscription status based on response headers
            const status: SubscriptionStatus = {
              hasActiveSubscription: response.headers.get('X-Has-Active-Subscription') === 'true',
              isTrialUser: subscription?.status === 'TRIAL',
              daysUntilExpiry: response.headers.get('X-Days-Until-Expiry') 
                ? parseInt(response.headers.get('X-Days-Until-Expiry') || '0') 
                : undefined,
              planName: subscription?.plan?.name,
              planType: subscription?.plan?.type,
              features: subscription?.plan?.features,
            };
            set({ subscriptionStatus: status });
          } else if (response.status === 404) {
            // No subscription found
            set({ 
              currentSubscription: null,
              subscriptionStatus: {
                hasActiveSubscription: false,
                isTrialUser: false,
              }
            });
          } else {
            throw new Error('Failed to fetch subscription');
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
          set({ loading: false });
        }
      },

      fetchAvailablePlans: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/subscription/plans');
          if (response.ok) {
            const plans = await response.json();
            set({ availablePlans: plans });
          } else {
            throw new Error('Failed to fetch plans');
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
          set({ loading: false });
        }
      },

      createSubscription: async (planId: string, paymentDetails: any) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              planId,
              ...paymentDetails,
            }),
          });

          if (response.ok) {
            const subscription = await response.json();
            set({ currentSubscription: subscription });
            
            // Refresh subscription status
            await get().fetchCurrentSubscription();
            
            return subscription;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create subscription');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      cancelSubscription: async () => {
        const { currentSubscription } = get();
        if (!currentSubscription) {
          throw new Error('No active subscription to cancel');
        }

        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/subscription/${currentSubscription.id}/cancel`, {
            method: 'PATCH',
            credentials: 'include',
          });

          if (response.ok) {
            const updatedSubscription = await response.json();
            set({ currentSubscription: updatedSubscription });
            
            // Update subscription status
            set({
              subscriptionStatus: {
                hasActiveSubscription: false,
                isTrialUser: false,
              }
            });
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel subscription');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      startTrial: async (planId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/subscription/trial', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ planId }),
          });

          if (response.ok) {
            const subscription = await response.json();
            set({ currentSubscription: subscription });
            
            // Update subscription status for trial
            set({
              subscriptionStatus: {
                hasActiveSubscription: true,
                isTrialUser: true,
                planName: subscription.plan?.name,
                planType: subscription.plan?.type,
                features: subscription.plan?.features,
              }
            });
            
            return subscription;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to start trial');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Feature Access Methods
      hasFeature: (feature: string) => {
        const { subscriptionStatus } = get();
        if (!subscriptionStatus?.hasActiveSubscription || !subscriptionStatus.features) {
          return false;
        }

        const features = subscriptionStatus.features;

        // Feature access rules (same as backend)
        const featureRules: Record<string, (features: any) => boolean> = {
          'advanced_analytics': (f) => f.analytics === 'advanced' || f.analytics === 'premium',
          'premium_analytics': (f) => f.analytics === 'premium',
          'unlimited_users': (f) => f.users === 'unlimited' || parseInt(f.users) > 20,
          'priority_support': (f) => f.support === 'priority' || f.support === '24/7 dedicated',
          'api_access': (f) => f.api_access === true || subscriptionStatus.planType !== 'MONTHLY',
          'custom_branding': (f) => f.customization === 'full' || f.custom_branding === true,
          'data_export': (f) => f.data_export === true || subscriptionStatus.planType !== 'MONTHLY',
        };

        const featureCheck = featureRules[feature];
        if (featureCheck) {
          return featureCheck(features);
        }

        return !!features[feature];
      },

      canAccess: (feature: string) => {
        const { subscriptionStatus } = get();
        
        if (!subscriptionStatus?.hasActiveSubscription) {
          return {
            hasAccess: false,
            feature,
            limitation: 'subscription_required',
            fallbackBehavior: 'limit',
          };
        }

        const hasAccess = get().hasFeature(feature);
        
        if (!hasAccess) {
          return {
            hasAccess: false,
            feature,
            limitation: 'plan_upgrade_required',
            currentPlan: subscriptionStatus.planName,
            fallbackBehavior: 'limit',
          };
        }

        return {
          hasAccess: true,
          feature,
          currentPlan: subscriptionStatus.planName,
        };
      },

      // Computed Properties
      get isActive() {
        return get().subscriptionStatus?.hasActiveSubscription || false;
      },

      get isTrial() {
        return get().subscriptionStatus?.isTrialUser || false;
      },

      get isExpired() {
        const { currentSubscription } = get();
        if (!currentSubscription) return false;
        
        return currentSubscription.status === 'EXPIRED' || 
               (currentSubscription.endDate && new Date(currentSubscription.endDate) < new Date());
      },

      get daysUntilExpiry() {
        return get().subscriptionStatus?.daysUntilExpiry || null;
      },

      get needsUpgrade() {
        const { subscriptionStatus } = get();
        return !subscriptionStatus?.hasActiveSubscription || subscriptionStatus.isTrialUser;
      },
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSubscription: state.currentSubscription,
        subscriptionStatus: state.subscriptionStatus,
        availablePlans: state.availablePlans,
      }),
    }
  )
);

export default useSubscriptionStore;