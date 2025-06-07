/**
 * Route Registry for X402 Server
 * 
 * Automatically discovers and registers all route modules.
 * Makes it trivial for developers to add new premium endpoints.
 */

import type { Express } from 'express';
import type { RouteDefinition } from './health';

// Import all route modules
import { healthRoute } from './health';
import { freeRoute } from './free';
import { protectedRoute } from './protected';
import { premiumPlusRoute } from './premium-plus';
import { enterpriseRoute } from './enterprise';

/**
 * All available routes in the system
 * To add a new route: 1) Create route file, 2) Add to this array
 */
export const allRoutes: RouteDefinition[] = [
  healthRoute,
  freeRoute,
  protectedRoute,
  premiumPlusRoute,
  enterpriseRoute
];

/**
 * Register all routes with the Express app
 */
export function registerRoutes(app: Express): void {
  console.log('📝 Registering routes...');
  
  allRoutes.forEach(route => {
    console.log(`   ${route.method.toUpperCase()} ${route.path} - ${route.description}${route.requiresPayment ? ` (${route.price})` : ''}`);
    
    // Register the route handler
    switch (route.method) {
      case 'get':
        app.get(route.path, route.handler);
        break;
      case 'post':
        app.post(route.path, route.handler);
        break;
      case 'put':
        app.put(route.path, route.handler);
        break;
      case 'delete':
        app.delete(route.path, route.handler);
        break;
    }
  });
  
  console.log(`✅ ${allRoutes.length} routes registered successfully`);
}

/**
 * Get X402 route configurations for payment middleware
 */
export function getX402RouteConfigs(): Record<string, any> {
  const configs: Record<string, any> = {};
  
  allRoutes
    .filter(route => route.requiresPayment)
    .forEach(route => {
      configs[route.path] = {
        price: route.price,
        network: route.network || 'base-sepolia',
        config: {
          description: route.description,
          maxTimeoutSeconds: 60
        }
      };
    });
  
  return configs;
}

/**
 * List all available endpoints for API documentation
 */
export function listEndpoints(): Array<{path: string, method: string, description: string, price?: string}> {
  return allRoutes.map(route => ({
    path: route.path,
    method: route.method.toUpperCase(),
    description: route.description || 'No description',
    price: route.requiresPayment ? route.price : undefined
  }));
} 