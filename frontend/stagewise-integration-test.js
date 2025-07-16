// Stagewise Integration Test
// This file verifies that the stagewise packages are properly installed and importable

try {
  const { StagewiseToolbar } = require('@stagewise/toolbar-react');
  const { ReactPlugin } = require('@stagewise-plugins/react');

  console.log('✅ @stagewise/toolbar-react imported successfully');
  console.log('✅ @stagewise-plugins/react imported successfully');
  console.log('✅ Integration test passed!');

  // Verify the components exist
  console.log('StagewiseToolbar:', typeof StagewiseToolbar);
  console.log('ReactPlugin:', typeof ReactPlugin);
} catch (error) {
  console.error('❌ Integration test failed:', error.message);
  process.exit(1);
}
