#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Payment Checker Tool ===\n');

function checkPayment() {
  rl.question('Enter order number (e.g., ORD-953371): ', (orderNumber) => {
    rl.question('Enter your JWT token (from login): ', (token) => {
      
      const fetch = require('node-fetch');
      
      console.log(`\nChecking payment for order: ${orderNumber}...\n`);
      
      fetch(`http://localhost:3000/api/payments/order/${orderNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.status === 404) {
          console.log('✅ No payment found - Order can be paid');
          console.log('You can now create a payment for this order.\n');
        } else if (response.status === 200) {
          return response.json().then(payment => {
            console.log('❌ Payment already exists:');
            console.log('=====================================');
            console.log(`Payment ID: ${payment.id}`);
            console.log(`Status: ${payment.status}`);
            console.log(`Amount: $${payment.amount}`);
            console.log(`Method: ${payment.method}`);
            console.log(`Created: ${new Date(payment.createdAt).toLocaleString()}`);
            console.log(`Order Number: ${payment.order?.orderNumber}`);
            console.log('=====================================\n');
            
            if (payment.status === 'COMPLETED') {
              console.log('💡 This order has already been paid successfully.');
            } else if (payment.status === 'PENDING') {
              console.log('💡 This order has a pending payment. You may need to complete or cancel it first.');
            } else if (payment.status === 'FAILED') {
              console.log('💡 This order has a failed payment. You may need to handle the failed payment first.');
            }
            console.log('\n');
          });
        } else {
          return response.text().then(text => {
            console.log(`❌ Error (${response.status}): ${text}`);
          });
        }
      })
      .catch(error => {
        console.log('❌ Network error:', error.message);
      })
      .finally(() => {
        rl.question('\nCheck another order? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            checkPayment();
          } else {
            console.log('Goodbye!');
            rl.close();
          }
        });
      });
    });
  });
}

checkPayment();