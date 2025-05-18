const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all test files
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.tsx') || file.endsWith('.test.ts'));

console.log('Running tests...');
console.log('=================');

let passedTests = 0;
let failedTests = 0;

// Run each test file
testFiles.forEach(file => {
  const testPath = path.join(testDir, file);
  console.log(`Running ${file}...`);
  
  try {
    // Run the test using Jest
    execSync(`npx jest ${testPath} --verbose`, { stdio: 'inherit' });
    console.log(`✅ ${file} passed`);
    passedTests++;
  } catch (error) {
    console.error(`❌ ${file} failed`);
    failedTests++;
  }
  
  console.log('-----------------');
});

// Print summary
console.log('=================');
console.log('Test Summary:');
console.log(`Total: ${testFiles.length}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
