#!/usr/bin/env ts-node
/**
 * X402 TypeScript Server Runner
 * 
 * Runs the Express server with configuration from the root config.yaml file.
 */

import { config } from './src/shared/config';

function main() {
  const serverConfig = config.getServerConfig('typescript');
  
  console.log('🚀 Starting X402 TypeScript Server');
  console.log(`   Host: ${serverConfig.host}`);
  console.log(`   Port: ${serverConfig.port}`);
  console.log(`   Log Level: ${serverConfig.log_level}`);
  console.log(`   Config: ${config.getConfigPath()}`);
  console.log();
  
  // Import and run the server
  require('./src/server/index.ts');
}

if (require.main === module) {
  main();
} 