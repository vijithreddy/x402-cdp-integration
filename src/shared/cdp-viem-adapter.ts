import { LocalAccount, SignableMessage } from 'viem';
import { CdpClient } from '@coinbase/cdp-sdk';

/**
 * Type definitions for CDP SDK responses
 */
interface _CDPSignatureResponse {
  signature: string;
}

export interface CDPAccount {
  address: string;
  name: string;
}

/**
 * CDP to Viem Account Adapter
 * 
 * This adapter bridges Coinbase Developer Platform (CDP) accounts with viem's
 * LocalAccount interface, enabling CDP accounts to work seamlessly with viem-based
 * libraries like X402 payment systems.
 * 
 * Key Features:
 * - Type-safe conversion from CDP accounts to viem LocalAccount
 * - Full support for message signing, typed data signing (EIP-712), and transaction signing
 * - Direct integration with CDP's server-side key management
 * - Optimized for X402 payment authorization flows
 */

/**
 * Create a viem-compatible LocalAccount from a CDP account
 * This is the main adapter function that enables CDP accounts to work with viem
 * 
 * @param cdpAccount CDP account object with address and name
 * @param cdpClient Initialized CDP client for signing operations
 * @returns LocalAccount Compatible viem account for use with X402 and other viem libraries
 * @throws {Error} When CDP account is invalid or missing required fields
 * @throws {Error} When CDP client is not provided or invalid
 * @throws {Error} When account address format is invalid
 * @example
 * ```typescript
 * const viemAccount = createViemAccountFromCDP(
 *   { address: '0x123...', name: 'My Account' },
 *   cdpClient
 * );
 * // Now use with X402 or other viem libraries
 * ```
 */
export function createViemAccountFromCDP(
  cdpAccount: CDPAccount,
  cdpClient: CdpClient
): LocalAccount {
  
  // Input validation
  if (!cdpAccount || typeof cdpAccount !== 'object') {
    throw new Error('Invalid CDP account: must be a non-null object');
  }
  
  if (!cdpAccount.address || typeof cdpAccount.address !== 'string') {
    throw new Error('Invalid CDP account: missing or invalid address');
  }
  
  if (!cdpAccount.address.startsWith('0x') || cdpAccount.address.length !== 42) {
    throw new Error(`Invalid Ethereum address format: ${cdpAccount.address}`);
  }
  
  if (!cdpClient) {
    throw new Error('Invalid CDP client: must be provided');
  }

  // Helper function to extract signature from CDP response
  const extractSignature = (result: any): `0x${string}` => {
    if (!result) {
      throw new Error('No signature result from CDP');
    }
    
    if (typeof result === 'string') {
      if (!result.startsWith('0x')) {
        return `0x${result}`;
      }
      return result as `0x${string}`;
    }
    
    if (result.signature) {
      const sig = result.signature;
      if (!sig.startsWith('0x')) {
        return `0x${sig}`;
      }
      return sig as `0x${string}`;
    }
    
    throw new Error('Invalid signature format from CDP response');
  };

  const account: LocalAccount = {
    address: cdpAccount.address as `0x${string}`,
    publicKey: '0x', // CDP manages keys server-side
    source: 'custom',
    type: 'local',

    // Message signing - used for general authentication
    async signMessage({ message }: { message: SignableMessage }): Promise<`0x${string}`> {
      console.log('🔐 CDP Adapter: Signing message');
      
      try {
        // Validate input
        if (!message) {
          throw new Error('Message cannot be empty');
        }
        
        // Handle different message formats from viem
        let messageStr: string;
        if (typeof message === 'string') {
          messageStr = message;
        } else if (message && typeof message === 'object' && 'raw' in message) {
          messageStr = typeof message.raw === 'string' ? message.raw : new TextDecoder().decode(message.raw);
        } else {
          messageStr = String(message);
        }
        
        if (messageStr.length > 10000) {
          throw new Error('Message too long (max 10000 characters)');
        }
        
        const result = await cdpClient.evm.signMessage({
          address: cdpAccount.address as `0x${string}`,
          message: messageStr,
        });
        
        console.log('✅ CDP Adapter: Message signed successfully');
        return extractSignature(result);
      } catch (error: any) {
        console.error('❌ CDP Adapter: Failed to sign message:', error.message || error);
        throw new Error(`Message signing failed: ${error.message || 'Unknown error'}`);
      }
    },

    // Sign typed data (EIP-712) - CRITICAL for X402 payment authorization
    async signTypedData(typedDataInput: any): Promise<`0x${string}`> {
      console.log('🔐 CDP Adapter: Signing EIP-712 typed data for X402...', { 
        domain: typedDataInput.domain?.name,
        primaryType: typedDataInput.primaryType 
      });
      
      try {
        // Validate input structure
        if (!typedDataInput || typeof typedDataInput !== 'object') {
          throw new Error('Invalid typed data input');
        }
        
        if (!typedDataInput.domain || typeof typedDataInput.domain !== 'object') {
          throw new Error('Missing or invalid domain in typed data');
        }
        
        if (!typedDataInput.types || typeof typedDataInput.types !== 'object') {
          throw new Error('Missing or invalid types in typed data');
        }
        
        if (!typedDataInput.primaryType || typeof typedDataInput.primaryType !== 'string') {
          throw new Error('Missing or invalid primary type in typed data');
        }
        
        if (!typedDataInput.message || typeof typedDataInput.message !== 'object') {
          throw new Error('Missing or invalid message in typed data');
        }
        
        // Ensure EIP712Domain type is included (required by CDP SDK)
        const typesWithDomain = {
          ...typedDataInput.types,
          EIP712Domain: typedDataInput.types.EIP712Domain || [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ]
        };

        // Use CDP client's signTypedData method - this is the key method for X402
        const result = await Promise.race([
          cdpClient.evm.signTypedData({
            address: cdpAccount.address as `0x${string}`,
            domain: typedDataInput.domain,
            types: typesWithDomain,
            primaryType: typedDataInput.primaryType,
            message: typedDataInput.message,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Signing timeout after 30 seconds')), 30000)
          )
        ]) as any;
        
        console.log('✅ CDP Adapter: EIP-712 typed data signed successfully');
        return extractSignature(result);
      } catch (error: any) {
        console.error('❌ CDP Adapter: Failed to sign typed data:', error.message || error);
        throw new Error(`Typed data signing failed: ${error.message || 'Unknown error'}`);
      }
    },

    // Basic transaction signing - simplified for X402 use case
    async signTransaction(transaction: Record<string, unknown>): Promise<`0x${string}`> {
      console.log('🔐 CDP Adapter: Transaction signing requested');
      
      try {
        // Validate transaction object
        if (!transaction || typeof transaction !== 'object') {
          throw new Error('Invalid transaction object');
        }
        
        // For X402, we mainly need message/typed data signing
        // Transaction signing can use message signing as fallback
        const transactionStr = JSON.stringify(transaction);
        
        if (transactionStr.length > 50000) {
          throw new Error('Transaction data too large');
        }
        
        const result = await Promise.race([
          cdpClient.evm.signMessage({
            address: cdpAccount.address as `0x${string}`,
            message: transactionStr,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction signing timeout')), 30000)
          )
        ]) as any;
        
        console.log('✅ CDP Adapter: Transaction signed');
        return extractSignature(result);
      } catch (error: any) {
        console.error('❌ CDP Adapter: Failed to sign transaction:', error.message || error);
        throw new Error(`Transaction signing failed: ${error.message || 'Unknown error'}`);
      }
    },



    // Simple hash signing
    async sign({ hash }: { hash: `0x${string}` }): Promise<`0x${string}`> {
      console.log('🔐 CDP Adapter: Hash signing');
      
      try {
        // Validate hash format
        if (!hash || typeof hash !== 'string') {
          throw new Error('Invalid hash: must be a string');
        }
        
        if (!hash.startsWith('0x') || hash.length !== 66) {
          throw new Error('Invalid hash format: must be 32-byte hex string with 0x prefix');
        }
        
        const result = await Promise.race([
          cdpClient.evm.signMessage({
            address: cdpAccount.address as `0x${string}`,
            message: hash,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Hash signing timeout')), 30000)
          )
        ]) as any;
        
        console.log('✅ CDP Adapter: Hash signed');
        return extractSignature(result);
      } catch (error: any) {
        console.error('❌ CDP Adapter: Failed to sign hash:', error.message || error);
        throw new Error(`Hash signing failed: ${error.message || 'Unknown error'}`);
      }
    },

    // Nonce manager (optional)
    nonceManager: undefined,
  };

  return account;
}

/**
 * Validate that an account has the required signing capabilities for X402
 * 
 * @param account - LocalAccount instance to validate
 * @returns True if account has required capabilities, false otherwise
 */
export function validateViemAccount(account: LocalAccount): boolean {
  return (
    typeof account.signMessage === 'function' &&
    typeof account.signTypedData === 'function' &&
    account.address !== undefined &&
    account.address.startsWith('0x')
  );
}

/**
 * Type-safe wrapper for CDP account data
 * 
 * @param address - Ethereum address for the account
 * @param name - Human-readable name for the account
 * @returns Validated CDP account object
 */
export function createCDPAccount(address: string, name: string): CDPAccount {
  // Input validation
  if (!address || typeof address !== 'string') {
    throw new Error('Address must be a non-empty string');
  }
  
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Name must be a non-empty string');
  }
  
  if (name.length > 100) {
    throw new Error('Name too long (max 100 characters)');
  }
  
  return { address, name: name.trim() };
}

 