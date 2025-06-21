/**
 * Free Command Module
 * 
 * Accesses the free endpoint without requiring payment.
 * Demonstrates basic API access and response handling.
 * 
 * Error Codes:
 * - FREE_001: Failed to create HTTP client
 * - FREE_002: Failed to access free endpoint
 * - FREE_003: Invalid response format
 * - FREE_004: Network error
 * - FREE_005: Server error
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayError } from '../utils/display';
import { logger } from '../../shared/utils/logger';
import { config } from '../../shared/config';
import axios from 'axios';

// Custom error type for free endpoint operations
interface FreeEndpointError extends Error {
  code: string;
  status?: number;
}

/**
 * Free command implementation
 * 
 * @param args - Command arguments (unused)
 * @param context - Command context with wallet manager
 * @throws {FreeEndpointError} FREE_001: Failed to create HTTP client
 * @throws {FreeEndpointError} FREE_002: Failed to access free endpoint
 * @throws {FreeEndpointError} FREE_003: Invalid response format
 * @throws {FreeEndpointError} FREE_004: Network error
 * @throws {FreeEndpointError} FREE_005: Server error
 */
export const freeCommand: CLICommand = {
  name: 'free',
  aliases: [],
  description: 'Access the free endpoint without payment',
  usage: 'free',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    try {
      // Log free endpoint access attempt
      logger.flow('free_endpoint', {
        action: 'Accessing free endpoint',
        timestamp: new Date().toISOString()
      });

      // Create HTTP client
      let client;
      try {
        const serverConfig = config.getServerConfig('typescript');
        const baseURL = `http://${serverConfig.host}:${serverConfig.port}`;
        
        client = axios.create({
          baseURL: baseURL,
          timeout: 10000
        });
      } catch (clientError) {
        const error = new Error('Failed to create HTTP client') as FreeEndpointError;
        error.code = 'FREE_001';
        throw error;
      }

      // Access free endpoint
      try {
        logger.ui('\n🔓 Accessing free endpoint...');
        const response = await client.get('/free');
        
        // Validate response format
        if (!response.data || typeof response.data !== 'object') {
          const error = new Error('Invalid response format from free endpoint') as FreeEndpointError;
          error.code = 'FREE_003';
          throw error;
        }

        // Display response
        if (response.data.message) {
          logger.ui(`\n📢 ${response.data.message}`);
        }
        if (response.data.subtitle) {
          logger.ui(`   ${response.data.subtitle}`);
        }

        // Log successful access
        logger.flow('free_success', {
          action: 'Accessed free endpoint',
          status: response.status,
          timestamp: new Date().toISOString()
        });
      } catch (requestError: any) {
        // Handle different types of request errors
        const error = new Error('Failed to access free endpoint') as FreeEndpointError;
        
        if (requestError.code === 'ECONNREFUSED' || requestError.code === 'ENOTFOUND') {
          error.code = 'FREE_004';
          error.message = 'Network error: Cannot connect to server';
          logger.ui('💡 Make sure the server is running: npm run dev:server');
        } else if (requestError.response) {
          error.code = 'FREE_005';
          error.status = requestError.response.status;
          error.message = `Server error: ${requestError.response.status}`;
        } else {
          error.code = 'FREE_002';
        }
        
        throw error;
      }
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        // If it's not already a FreeEndpointError, wrap it
        if (!('code' in caughtError)) {
          const freeError = new Error('Failed to access free endpoint') as FreeEndpointError;
          freeError.code = 'FREE_002';
          displayError('Failed to access free endpoint', freeError);
          logger.error('Free endpoint access failed', {
            error: freeError.message,
            code: freeError.code,
            timestamp: new Date().toISOString()
          });
        } else {
          displayError('Failed to access free endpoint', caughtError);
          logger.error('Free endpoint access failed', {
            error: caughtError.message,
            code: (caughtError as FreeEndpointError).code,
            status: (caughtError as FreeEndpointError).status,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Handle unknown error type
        const freeError = new Error('Unknown error occurred') as FreeEndpointError;
        freeError.code = 'FREE_002';
        displayError('Failed to access free endpoint', freeError);
        logger.error('Free endpoint access failed', {
          error: 'Unknown error',
          code: freeError.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}; 