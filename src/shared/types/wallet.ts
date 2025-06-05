export interface WalletData {
  id: string;
  seed: string;
  addresses: string[];
  defaultAddress?: string;
}

export interface WalletConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret?: string;
} 