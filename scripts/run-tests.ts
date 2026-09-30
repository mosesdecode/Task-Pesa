import { runValidateTests } from '../__tests__/validate.test';
import { runSchedulingTests } from '../__tests__/scheduling.test';
import { runAuthTests } from '../__tests__/auth.test';

async function main() {
  console.log('🚀 Starting TaskPesa Test Suite...\n');
  try {
    runValidateTests();
    runSchedulingTests();
    await runAuthTests();
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

main();
