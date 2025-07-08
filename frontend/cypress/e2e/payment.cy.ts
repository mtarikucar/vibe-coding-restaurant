describe('Payment Flow E2E', () => {
  let authToken: string;
  let orderId: string;
  let tenantId: string;

  beforeEach(() => {
    // Setup test data
    cy.task('db:seed').then((data: any) => {
      authToken = data.authToken;
      orderId = data.orderId;
      tenantId = data.tenantId;
    });

    // Set auth token in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('auth-token', authToken);
    });

    // Intercept API calls
    cy.intercept('GET', `/api/orders/${orderId}`, {
      fixture: 'order.json'
    }).as('getOrder');

    cy.intercept('POST', '/api/payments', {
      statusCode: 201,
      body: {
        id: 'payment-id',
        orderId: orderId,
        amount: 100.50,
        method: 'cash',
        status: 'completed',
        transactionId: 'CASH-123456'
      }
    }).as('createPayment');

    cy.intercept('POST', '/api/payments/*/process', {
      statusCode: 200,
      body: {
        id: 'payment-id',
        status: 'completed',
        transactionId: 'txn_123456'
      }
    }).as('processPayment');
  });

  describe('Successful Payment Flow', () => {
    it('should complete cash payment successfully', () => {
      cy.visit(`/app/payment/${orderId}`);

      // Wait for order to load
      cy.wait('@getOrder');

      // Verify order details are displayed
      cy.contains('Order Summary').should('be.visible');
      cy.contains('$100.50').should('be.visible');

      // Select cash payment method
      cy.get('[data-testid="payment-method-cash"]').click();

      // Verify cash is selected
      cy.get('[data-testid="payment-method-cash"]')
        .should('have.class', 'bg-primary-50/20');

      // Click pay button
      cy.get('[data-testid="pay-button"]').click();

      // Wait for payment creation
      cy.wait('@createPayment');

      // Verify success message
      cy.contains('Payment Successful').should('be.visible');
      cy.contains('CASH-123456').should('be.visible');

      // Verify redirect to orders page
      cy.url().should('include', '/app/orders');
    });

    it('should handle credit card payment flow', () => {
      cy.visit(`/app/payment/${orderId}`);

      cy.wait('@getOrder');

      // Select credit card payment method
      cy.get('[data-testid="payment-method-credit-card"]').click();

      // Click pay button
      cy.get('[data-testid="pay-button"]').click();

      // Wait for payment creation
      cy.wait('@createPayment');

      // Should show payment processing interface
      cy.contains('Processing Payment').should('be.visible');

      // Wait for payment processing
      cy.wait('@processPayment');

      // Verify success
      cy.contains('Payment Successful').should('be.visible');
    });

    it('should handle PayPal payment flow', () => {
      cy.visit(`/app/payment/${orderId}`);

      cy.wait('@getOrder');

      // Select PayPal payment method
      cy.get('[data-testid="payment-method-paypal"]').click();

      // Click pay button
      cy.get('[data-testid="pay-button"]').click();

      // Should show PayPal interface
      cy.get('[data-testid="paypal-payment"]').should('be.visible');

      // Simulate PayPal success
      cy.get('[data-testid="paypal-success-button"]').click();

      // Verify success
      cy.contains('Payment Successful').should('be.visible');
    });
  });

  describe('Payment Validation Errors', () => {
    it('should handle invalid amount error', () => {
      // Mock API error response
      cy.intercept('POST', '/api/payments', {
        statusCode: 400,
        body: {
          message: ['amount must be a number conforming to the specified constraints'],
          error: 'Bad Request',
          statusCode: 400
        }
      }).as('createPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPaymentError');

      // Verify error message is displayed
      cy.contains('amount must be a number').should('be.visible');
      cy.get('[data-testid="error-message"]').should('be.visible');

      // Verify retry button is available
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle negative amount error', () => {
      cy.intercept('POST', '/api/payments', {
        statusCode: 400,
        body: {
          message: ['amount must be a positive number'],
          error: 'Bad Request',
          statusCode: 400
        }
      }).as('createPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPaymentError');

      cy.contains('amount must be a positive number').should('be.visible');
    });

    it('should handle zero amount error', () => {
      cy.intercept('POST', '/api/payments', {
        statusCode: 400,
        body: {
          message: ['amount must be greater than 0'],
          error: 'Bad Request',
          statusCode: 400
        }
      }).as('createPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPaymentError');

      cy.contains('amount must be greater than 0').should('be.visible');
    });

    it('should handle payment already exists error', () => {
      cy.intercept('POST', '/api/payments', {
        statusCode: 409,
        body: {
          message: 'Payment for order ORD-001 already exists',
          error: 'Conflict',
          statusCode: 409
        }
      }).as('createPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPaymentError');

      cy.contains('Payment for order ORD-001 already exists').should('be.visible');
    });

    it('should handle order not ready for payment error', () => {
      cy.intercept('POST', '/api/payments', {
        statusCode: 400,
        body: {
          message: 'Order ORD-001 is not ready for payment',
          error: 'Bad Request',
          statusCode: 400
        }
      }).as('createPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPaymentError');

      cy.contains('Order ORD-001 is not ready for payment').should('be.visible');
    });
  });

  describe('Payment Processing Errors', () => {
    it('should handle payment processing failure', () => {
      cy.intercept('POST', '/api/payments/*/process', {
        statusCode: 400,
        body: {
          message: 'Payment processing failed',
          error: 'Bad Request',
          statusCode: 400
        }
      }).as('processPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-credit-card"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPayment');
      cy.wait('@processPaymentError');

      cy.contains('Payment processing failed').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle payment already completed error', () => {
      cy.intercept('POST', '/api/payments/*/process', {
        statusCode: 409,
        body: {
          message: 'Payment payment-id is already completed',
          error: 'Conflict',
          statusCode: 409
        }
      }).as('processPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-credit-card"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPayment');
      cy.wait('@processPaymentError');

      cy.contains('Payment payment-id is already completed').should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('POST', '/api/payments', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@networkError');

      cy.contains('Network error').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('User Experience', () => {
    it('should show loading states during payment', () => {
      // Delay the API response to test loading state
      cy.intercept('POST', '/api/payments', {
        delay: 2000,
        statusCode: 201,
        body: {
          id: 'payment-id',
          status: 'completed'
        }
      }).as('createPaymentSlow');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      // Verify loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="pay-button"]').should('be.disabled');

      cy.wait('@createPaymentSlow');

      // Verify loading state is gone
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should allow retry after error', () => {
      // First request fails
      cy.intercept('POST', '/api/payments', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('createPaymentError');

      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      cy.get('[data-testid="payment-method-cash"]').click();
      cy.get('[data-testid="pay-button"]').click();

      cy.wait('@createPaymentError');

      // Verify error and retry button
      cy.contains('Internal server error').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Mock successful retry
      cy.intercept('POST', '/api/payments', {
        statusCode: 201,
        body: {
          id: 'payment-id',
          status: 'completed'
        }
      }).as('createPaymentSuccess');

      // Click retry
      cy.get('[data-testid="retry-button"]').click();

      cy.wait('@createPaymentSuccess');

      // Verify success
      cy.contains('Payment Successful').should('be.visible');
    });

    it('should navigate back to orders', () => {
      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      // Click back button
      cy.get('[data-testid="back-button"]').click();

      // Verify navigation
      cy.url().should('include', '/app/orders');
    });

    it('should display order details correctly', () => {
      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      // Verify order information is displayed
      cy.contains('Order #ORD-001').should('be.visible');
      cy.contains('Table 1').should('be.visible');
      cy.contains('Total: $100.50').should('be.visible');

      // Verify order items are displayed
      cy.get('[data-testid="order-item"]').should('have.length.at.least', 1);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      // Tab through payment methods
      cy.get('body').tab();
      cy.focused().should('contain', 'Cash');

      cy.focused().tab();
      cy.focused().should('contain', 'Credit Card');

      // Select with Enter key
      cy.focused().type('{enter}');

      // Tab to pay button
      cy.focused().tab();
      cy.focused().should('contain', 'Pay');

      // Activate with Enter
      cy.focused().type('{enter}');

      cy.wait('@createPayment');
    });

    it('should have proper ARIA labels', () => {
      cy.visit(`/app/payment/${orderId}`);
      cy.wait('@getOrder');

      // Check ARIA labels
      cy.get('[data-testid="payment-method-cash"]')
        .should('have.attr', 'aria-label')
        .and('include', 'Cash payment method');

      cy.get('[data-testid="pay-button"]')
        .should('have.attr', 'aria-label')
        .and('include', 'Pay');
    });
  });
});
