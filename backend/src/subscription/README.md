# Subscription Module

This module handles subscription management for the restaurant management system.

## Features

- Subscription plans (monthly, yearly, custom)
- Trial period (15 days)
- Payment processing with Stripe and iyzico
- Automatic trial expiration checks
- Email notifications for subscription events

## Configuration

The subscription module requires the following environment variables:

```
# Payment Gateway Configuration
PAYMENT_PROVIDER=mock # Options: stripe, iyzico, paypal, mock

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# iyzico Configuration
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

## API Endpoints

### Subscription Plans

- `GET /subscriptions/plans` - Get all public subscription plans
- `GET /subscriptions/plans/admin` - Get all subscription plans (admin only)
- `GET /subscriptions/plans/:id` - Get a specific subscription plan
- `POST /subscriptions/plans` - Create a new subscription plan (admin only)

### Subscriptions

- `GET /subscriptions` - Get all subscriptions (admin only)
- `GET /subscriptions/me` - Get the current user's subscription
- `GET /subscriptions/:id` - Get a specific subscription (admin only)
- `POST /subscriptions` - Create a new subscription
- `PATCH /subscriptions/:id` - Update a subscription
- `POST /subscriptions/:id/cancel` - Cancel a subscription
- `POST /subscriptions/trial/:planId` - Start a trial for a plan
- `POST /subscriptions/custom-request` - Request a custom plan

## Payment Processing

The subscription module supports two payment processors:

1. **Stripe** - Used for all countries except Turkey
2. **iyzico** - Used specifically for Turkey

The payment processor is selected automatically based on the user's country.

## Trial Period

All subscription plans include a 15-day trial period. During this period, users can access all features of the plan without payment. After the trial period expires, users must subscribe to continue using the system.

## Email Notifications

The subscription module sends the following email notifications:

- Trial started
- Trial ending soon (3 days before expiration)
- Trial expired
- Subscription confirmation
- Subscription canceled
- Custom plan request

## Scheduled Tasks

The subscription module includes scheduled tasks to:

- Check for expired trials (runs daily at midnight)
- Check for trials that will expire soon (runs daily at 8 AM)

## Usage

```typescript
// Start a trial
await subscriptionService.startTrial(userId, planId);

// Create a subscription
await subscriptionService.createSubscription({
  userId,
  planId,
  startDate,
  endDate,
  autoRenew: true,
});

// Cancel a subscription
await subscriptionService.cancelSubscription(subscriptionId);

// Request a custom plan
await subscriptionService.requestCustomPlan(userId, details);
```
