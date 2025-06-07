/**
 * Free Command Module
 * 
 * Tests the free endpoint to demonstrate what users get WITHOUT paying.
 * Creates clear contrast with premium content for educational purposes.
 */

import axios from 'axios';
import type { CLICommand, CommandContext } from '../types/commands';
import { displayError } from '../utils/display';
import { logger } from '../../shared/utils/logger';

/**
 * Free endpoint test command implementation
 */
export const freeCommand: CLICommand = {
  name: 'free',
  aliases: [],
  description: 'Test free endpoint for comparison (no payment required)',
  usage: 'free',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    try {
      logger.header('Free Content Test', 'Testing free endpoint access');
      
      logger.flow('request', { 
        action: 'Accessing free content', 
        endpoint: '/free',
        payment: 'NOT REQUIRED' 
      });
      
      // Simple axios request - no payment interceptor needed
      const response = await axios.get('http://localhost:3000/free', {
        timeout: 10000
      });
      
      if (response.data) {
        logger.ui('\n📖 FREE CONTENT ACCESSED');
        logger.ui('═══════════════════════════════════════════════════════════');
        
        if (response.data.message) {
          logger.ui(`📢 ${response.data.message}`);
        }
        
        if (response.data.subtitle) {
          logger.ui(`   ${response.data.subtitle}`);
        }
        
        const data = response.data.data;
        if (data) {
          // Basic Info
          if (data.basicInfo) {
            logger.ui('\n📋 Basic Information:');
            logger.ui(`   Service: ${data.basicInfo.service}`);
            logger.ui(`   Version: ${data.basicInfo.version}`);
            logger.ui(`   Access Level: ${data.basicInfo.accessLevel}`);
          }
          
          // Free Features
          if (data.freeFeatures && data.freeFeatures.length > 0) {
            logger.ui('\n🆓 What You Get For Free:');
            data.freeFeatures.forEach((feature: string) => {
              logger.ui(`   ${feature}`);
            });
          }
          
          // Limitations
          if (data.limitations) {
            logger.ui('\n⚠️  Limitations of Free Tier:');
            logger.ui(`   Update Frequency: ${data.limitations.updateFrequency}`);
            logger.ui(`   Data Accuracy: ${data.limitations.dataAccuracy}`);
            logger.ui(`   API Calls/Hour: ${data.limitations.apiCallsPerHour}`);
            logger.ui(`   Support: ${data.limitations.supportLevel}`);
            logger.ui(`   Advanced Features: ${data.limitations.advancedFeatures}`);
          }
          
          // Upgrade Information
          if (data.upgradeInfo) {
            logger.ui('\n💡 Want More?');
            logger.ui(`   ${data.upgradeInfo.note}`);
            logger.ui(`   ${data.upgradeInfo.upgrade}`);
            logger.ui(`   Benefits: ${data.upgradeInfo.benefits}`);
          }
        }
        
        logger.ui('\n🆓 This content was FREE - no payment required!');
        logger.ui('   Compare this with the "test" command to see premium features.');
      }
      
      logger.separator();
      
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        displayError('Cannot connect to server at http://localhost:3000');
        logger.ui('💡 Make sure the server is running: npm run dev:server');
      } else {
        displayError('Error during free endpoint test', error);
      }
    }
  }
}; 