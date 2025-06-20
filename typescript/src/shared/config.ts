/**
 * Centralized Configuration Module
 * 
 * All configuration settings for the X402-CDP integration.
 * Makes it easy to modify settings in one place.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ServerConfig {
  port: number;
  log_level: string;
  host: string;
}

export interface ClientConfig {
  log_level: string;
  verbose: boolean;
}

export interface X402Config {
  facilitator_url: string;
  network: string;
  scheme: string;
}

export interface AppConfig {
  servers: {
    python: ServerConfig;
    typescript: ServerConfig;
  };
  clients: {
    python: ClientConfig;
    typescript: ClientConfig;
  };
  x402: X402Config;
}

export class Config {
  private config: AppConfig;
  private configPath: string;

  constructor(configPath?: string) {
    if (!configPath) {
      // Look for config.yaml in project root (2 levels up from this file)
      const currentDir = __dirname;
      this.configPath = path.join(currentDir, '..', '..', '..', 'config.yaml');
    } else {
      this.configPath = configPath;
    }

    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Config file not found: ${this.configPath}`);
    }

    const configContent = fs.readFileSync(this.configPath, 'utf8');
    return yaml.load(configContent) as AppConfig;
  }

  getServerConfig(serverType: 'python' | 'typescript' = 'typescript'): ServerConfig {
    return this.config.servers[serverType];
  }

  getClientConfig(clientType: 'python' | 'typescript' = 'typescript'): ClientConfig {
    return this.config.clients[clientType];
  }

  getX402Config(): X402Config {
    return this.config.x402;
  }

  get(key: string, default_value?: any): any {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return default_value;
      }
    }

    return value;
  }

  getConfigPath(): string {
    return this.configPath;
  }
}

// Global config instance
export const config = new Config(); 