export interface WalletData {
  id: string;
  seed: string;
  addresses: string[];
  defaultAddress?: string;
  accounts?: Array<{
    address: string;
    name: string;
  }>;
}

export interface WalletConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret?: string;
} 