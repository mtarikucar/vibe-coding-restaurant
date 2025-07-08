/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to login with test credentials
       * @example cy.login('cashier@test.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to setup payment test data
       * @example cy.setupPaymentTest()
       */
      setupPaymentTest(): Chainable<any>;

      /**
       * Custom command to simulate payment gateway responses
       * @example cy.mockPaymentGateway('success')
       */
      mockPaymentGateway(scenario: 'success' | 'failure' | 'timeout'): Chainable<void>;

      /**
       * Custom command to tab through elements
       * @example cy.get('input').tab()
       */
      tab(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Custom command to select by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email,
      password,
    },
  }).then((response) => {
    window.localStorage.setItem('auth-token', response.body.access_token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Custom command to setup payment test data
Cypress.Commands.add('setupPaymentTest', () => {
  return cy.task('db:seed').then((data) => {
    // Store test data in localStorage for easy access
    window.localStorage.setItem('test-data', JSON.stringify(data));
    return data;
  });
});

// Custom command to mock payment gateway
Cypress.Commands.add('mockPaymentGateway', (scenario: 'success' | 'failure' | 'timeout') => {
  switch (scenario) {
    case 'success':
      cy.intercept('POST', '/api/payments/*/process', {
        statusCode: 200,
        body: {
          id: 'payment-id',
          status: 'completed',
          transactionId: 'txn_success_123',
        },
      }).as('paymentGatewaySuccess');
      break;

    case 'failure':
      cy.intercept('POST', '/api/payments/*/process', {
        statusCode: 400,
        body: {
          message: 'Card declined',
          error: 'Bad Request',
          statusCode: 400,
        },
      }).as('paymentGatewayFailure');
      break;

    case 'timeout':
      cy.intercept('POST', '/api/payments/*/process', {
        delay: 30000, // 30 second delay to simulate timeout
        statusCode: 200,
        body: {
          id: 'payment-id',
          status: 'completed',
          transactionId: 'txn_timeout_123',
        },
      }).as('paymentGatewayTimeout');
      break;
  }
});

// Custom command for keyboard navigation
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' });
});

// Add custom assertions for payment validation
Cypress.Commands.add('shouldHaveValidationError', { prevSubject: 'element' }, (subject, errorMessage) => {
  return cy.wrap(subject).should('contain.text', errorMessage);
});

// Helper to wait for payment processing
Cypress.Commands.add('waitForPaymentProcessing', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

// Helper to verify payment success
Cypress.Commands.add('verifyPaymentSuccess', (transactionId?: string) => {
  cy.contains('Payment Successful').should('be.visible');
  if (transactionId) {
    cy.contains(transactionId).should('be.visible');
  }
});

// Helper to verify payment error
Cypress.Commands.add('verifyPaymentError', (errorMessage: string) => {
  cy.get('[data-testid="error-message"]').should('be.visible');
  cy.contains(errorMessage).should('be.visible');
  cy.get('[data-testid="retry-button"]').should('be.visible');
});

// Helper to select payment method
Cypress.Commands.add('selectPaymentMethod', (method: string) => {
  cy.get(`[data-testid="payment-method-${method}"]`).click();
  cy.get(`[data-testid="payment-method-${method}"]`).should('have.class', 'bg-primary-50/20');
});

// Helper to complete payment flow
Cypress.Commands.add('completePayment', (method: string = 'cash') => {
  cy.selectPaymentMethod(method);
  cy.get('[data-testid="pay-button"]').click();
  
  if (method === 'cash') {
    cy.wait('@createPayment');
    cy.verifyPaymentSuccess();
  } else {
    cy.wait('@createPayment');
    cy.wait('@processPayment');
    cy.verifyPaymentSuccess();
  }
});

// Add these to the global namespace
declare global {
  namespace Cypress {
    interface Chainable {
      shouldHaveValidationError(errorMessage: string): Chainable<JQuery<HTMLElement>>;
      waitForPaymentProcessing(): Chainable<void>;
      verifyPaymentSuccess(transactionId?: string): Chainable<void>;
      verifyPaymentError(errorMessage: string): Chainable<void>;
      selectPaymentMethod(method: string): Chainable<void>;
      completePayment(method?: string): Chainable<void>;
    }
  }
}

export {};
