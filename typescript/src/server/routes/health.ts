/**
 * Health Check Route Module
 * 
 * Simple health check endpoint for server monitoring.
 * This route is free and doesn't require any payments.
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { config } from '../../shared/config';
import { logger } from '../../shared/utils/logger';
import axios from 'axios';

const router = Router();

export interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  handler: (req: Request, res: Response) => void;
  requiresPayment?: boolean;
  price?: string;
  network?: string;
  description?: string;
}

/**
 * Health check route handler
 */
function healthHandler(req: Request, res: Response): void {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Server is running - this endpoint is free!',
    walletInfo: {
      server: process.env.SERVER_WALLET || 'Not configured',
      client: 'Dynamic'
    }
  });
}

/**
 * Health route definition
 */
export const healthRoute: RouteDefinition = {
  path: '/health',
  method: 'get',
  handler: healthHandler,
  requiresPayment: false,
  description: 'Server health check (free)'
};

/**
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    logger.flow('health_check', { action: 'Basic health check requested' });
    
    const serverConfig = config.getServerConfig('typescript');
    const aiConfig = config.getAIServerConfig();
    
    // Check AI service availability
    let openai_available = false;
    let market_data_available = false;
    
    try {
      const aiResponse = await axios.get(`http://${aiConfig.host}:${aiConfig.port}/health`, {
        timeout: 5000
      });
      
      if (aiResponse.data) {
        openai_available = aiResponse.data.openai_available || false;
        market_data_available = aiResponse.data.market_data_available || false;
      }
    } catch (aiError) {
      logger.warn('AI service health check failed', { error: aiError });
    }
    
    const healthResponse = {
      status: 'healthy',
      service: 'X402 TypeScript Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      server: {
        host: serverConfig.host,
        port: serverConfig.port,
        log_level: serverConfig.log_level
      },
      ai_service: {
        available: openai_available,
        market_data_available: market_data_available,
        use_ai_responses: aiConfig.use_ai_responses
      },
      x402: {
        facilitator_url: config.getX402Config().facilitator_url,
        network: config.getX402Config().network,
        scheme: config.getX402Config().scheme
      }
    };
    
    res.json(healthResponse);
    
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check with component status
 */
router.get('/detailed', async (req, res) => {
  try {
    logger.flow('health_check', { action: 'Detailed health check requested' });
    
    const serverConfig = config.getServerConfig('typescript');
    const aiConfig = config.getAIServerConfig();
    
    const healthStatus = {
      status: 'healthy',
      service: 'X402 TypeScript Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      components: {
        server: {
          status: 'healthy',
          host: serverConfig.host,
          port: serverConfig.port,
          log_level: serverConfig.log_level
        },
        ai_service: {
          status: 'unknown' as string,
          available: false,
          details: null as string | null
        },
        x402_config: {
          status: 'healthy',
          facilitator_url: config.getX402Config().facilitator_url,
          network: config.getX402Config().network,
          scheme: config.getX402Config().scheme
        }
      }
    };
    
    // Check AI service
    try {
      const aiResponse = await axios.get(`http://${aiConfig.host}:${aiConfig.port}/health/detailed`, {
        timeout: 10000
      });
      
      if (aiResponse.data) {
        healthStatus.components.ai_service = {
          status: aiResponse.data.status || 'unknown',
          available: aiResponse.data.components?.openai?.available || false,
          details: aiResponse.data.components?.openai?.details || 'AI service responded'
        };
      }
    } catch (aiError: any) {
      healthStatus.components.ai_service = {
        status: 'error',
        available: false,
        details: `AI service error: ${aiError.message}`
      };
    }
    
    // Determine overall status
    const componentStatuses = Object.values(healthStatus.components).map(comp => comp.status);
    if (componentStatuses.includes('error')) {
      healthStatus.status = 'degraded';
    } else if (componentStatuses.includes('unknown')) {
      healthStatus.status = 'partial';
    }
    
    res.json(healthStatus);
    
  } catch (error) {
    logger.error('Detailed health check failed', { error });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Readiness check for Kubernetes/container orchestration
 */
router.get('/ready', async (req, res) => {
  try {
    const aiConfig = config.getAIServerConfig();
    
    // Check if AI service is required and available
    if (aiConfig.use_ai_responses) {
      try {
        const aiResponse = await axios.get(`http://${aiConfig.host}:${aiConfig.port}/health/ready`, {
          timeout: 5000
        });
        
        if (aiResponse.data.status === 'ready') {
          res.json({ status: 'ready', message: 'Service ready with AI capabilities' });
        } else {
          res.status(503).json({ status: 'not_ready', message: 'AI service not ready' });
        }
      } catch (aiError) {
        res.status(503).json({ status: 'not_ready', message: 'AI service unavailable' });
      }
    } else {
      // Service is ready even without AI if fallback is enabled
      res.json({ status: 'ready', message: 'Service ready with fallback responses' });
    }
    
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({ status: 'not_ready', message: 'Service not ready' });
  }
});

/**
 * Liveness check for Kubernetes/container orchestration
 */
router.get('/live', (req, res) => {
  try {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'X402 TypeScript Server',
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Liveness check failed', { error });
    res.status(503).json({ status: 'not_alive', message: 'Service not alive' });
  }
});

export default router; 