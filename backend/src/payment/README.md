# Payment Module

This module handles payment processing for the restaurant management system.

## Features

- Multiple payment methods (cash, credit card, debit card)
- Integration with payment gateways (Stripe, iyzico, PayPal)
- Webhook handling for payment events
- Payment status tracking
- Refund processing
- Receipt generation

## Payment Providers

The system supports the following payment providers:

### Stripe

Stripe is used as the default payment provider for most countries. It provides a secure and reliable way to process credit card payments.

#### Configuration

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

#### Webhook Setup

To set up Stripe webhooks:

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Add a new endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the signing secret and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### iyzico

iyzico is used for payments in Turkey. It's a popular payment gateway in the Turkish market.

#### Configuration

```
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

#### Webhook Setup

To set up iyzico webhooks:

1. Go to the iyzico Dashboard > Settings > Webhooks
2. Add a new webhook: `https://your-domain.com/api/webhooks/iyzico`
3. Select the relevant events
4. Save the webhook configuration

### PayPal

PayPal is used as an alternative payment method for international payments.

#### Configuration

```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

#### Webhook Setup

To set up PayPal webhooks:

1. Go to the PayPal Developer Dashboard > My Apps & Credentials
2. Select your app
3. Go to Webhooks
4. Add a new webhook: `https://your-domain.com/api/webhooks/paypal`
5. Select the following events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
6. Save the webhook configuration

## API Endpoints

### Payment Controller

- `POST /payments` - Create a new payment
- `GET /payments` - Get all payments
- `GET /payments/:id` - Get a specific payment
- `PATCH /payments/:id/status` - Update payment status
- `GET /payments/order/:orderId` - Get payment by order ID
- `POST /payments/:id/process` - Process a payment

### Webhook Controller

- `POST /webhooks/stripe` - Handle Stripe webhook events
- `POST /webhooks/paypal` - Handle PayPal webhook events
- `POST /webhooks/iyzico` - Handle iyzico webhook events

## Payment Flow

1. Create a payment record with `POST /payments`
2. Process the payment with `POST /payments/:id/process`
3. The payment gateway will redirect the user to the payment provider's page if needed
4. After payment completion, the provider will send a webhook event to update the payment status
5. The system will update the order status based on the payment status

## Testing Payments

For testing purposes, you can use the following test cards:

### Stripe Test Cards

- Visa: `4242 4242 4242 4242`
- Mastercard: `5555 5555 5555 4444`
- Failed payment: `4000 0000 0000 0002`

### PayPal Sandbox

- Use PayPal sandbox accounts for testing
- Create sandbox accounts in the PayPal Developer Dashboard

### iyzico Test Cards

- Visa (success): `4506 3456 7890 1234`
- Mastercard (success): `5406 3456 7890 1234`
- Failed payment: `4111 1111 1111 1111`

## Implementation Details

The payment module uses a gateway pattern to abstract the payment provider implementation. The `PaymentGatewayService` routes payment requests to the appropriate provider based on configuration and user country.

For Turkey, the system automatically uses iyzico. For other countries, it uses the configured provider (Stripe by default).

## Error Handling

Payment errors are logged and returned to the client. The system will retry failed payments a configurable number of times before marking them as failed.

## Security Considerations

- All payment provider API keys are stored in environment variables
- Webhook signatures are verified to prevent tampering
- Payment data is encrypted in the database
- PCI compliance is maintained by using payment provider SDKs and not storing sensitive card data
