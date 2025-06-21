#!/usr/bin/env python3
"""
Custom X402 Client Module

Provides a custom X402 client implementation specifically designed for CDP integration.
Handles payment payload creation, signature generation, and payment requests with
comprehensive error handling and type safety.

Features:
- CDP account integration with EIP-712 signing
- Race condition prevention (validAfter = 0)
- Comprehensive error handling and validation
- Type-safe payload creation and validation
- Professional logging and debugging support
"""

import requests
import json
import base64
import time
import secrets
from typing import Dict, Any, Optional, Union
from ...shared.utils.logger import logger
from eth_utils import to_hex
from cdp.openapi_client.models.eip712_domain import EIP712Domain
import aiohttp
import asyncio
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from ...shared.config import Config

class X402Error(Exception):
    """Base error class for X402 operations"""
    def __init__(self, message: str, code: str = "X402_ERROR", status_code: int = 500, details: Optional[Dict] = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        self.timestamp = time.time()

class PaymentError(X402Error):
    """Payment-specific errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "PAYMENT_ERROR", 402, details)

class NetworkError(X402Error):
    """Network and connection errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "NETWORK_ERROR", 503, details)

class AIServiceError(X402Error):
    """AI service errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "AI_SERVICE_ERROR", 503, details)

class PaymentPayloadError(Exception):
    """Custom exception for payment payload creation errors"""
    pass


class PaymentRequestError(Exception):
    """Custom exception for payment request errors"""
    pass


class SignatureError(Exception):
    """Custom exception for signature generation errors"""
    pass


class CDPSigner:
    """
    Wrapper for CDP account to provide consistent interface
    
    Provides a unified interface for CDP accounts with proper error handling
    and type safety for EIP-712 signature generation.
    """
    
    def __init__(self, account: Any):
        """
        Initialize CDP signer wrapper
        
        Args:
            account: CDP account instance with sign_typed_data method
        """
        self.account = account
        self.address = getattr(account, "address", None)
        
        if not self.address:
            raise ValueError("CDP account must have an address attribute")
    
    async def sign_typed_data(
        self, 
        domain: Dict[str, Any], 
        types: Dict[str, Any], 
        primary_type: str, 
        message: Dict[str, Any]
    ) -> str:
        """
        Sign typed data using CDP account
        
        Args:
            domain: EIP-712 domain object
            types: EIP-712 types definition
            primary_type: Primary type for signing
            message: Message data to sign
            
        Returns:
            Signature as hex string
            
        Raises:
            SignatureError: If signing fails
        """
        try:
            if hasattr(self.account, 'sign_typed_data'):
                return await self.account.sign_typed_data(
                    domain=domain,
                    types=types,
                    primary_type=primary_type,
                    message=message
                )
            else:
                raise SignatureError("CDP account does not support sign_typed_data")
        except Exception as e:
            raise SignatureError(f"Failed to sign typed data: {e}")


class CustomX402Client:
    """
    Custom X402 client for CDP integration
    
    Provides a complete X402 payment client implementation with CDP account
    integration, comprehensive error handling, and professional logging.
    """
    
    def __init__(self, cdp_account, cdp_client, config: Config):
        self.cdp_account = cdp_account
        self.cdp_client = cdp_client
        self.config = config
        
        # Create session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Get server config
        server_config = config.get_server_config('python')
        self.base_url = f"http://{server_config['host']}:{server_config['port']}"
        
        logger.debug(f"Initialized X402 client with base URL: {self.base_url}")
    
    def _create_authorization_types(self) -> Dict[str, Any]:
        """
        Create EIP-712 authorization types definition
        
        Returns:
            EIP-712 types definition for TransferWithAuthorization
        """
        return {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"}
            ],
            "TransferWithAuthorization": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "validAfter", "type": "uint256"},
                {"name": "validBefore", "type": "uint256"},
                {"name": "nonce", "type": "bytes32"}
            ]
        }
    
    def _create_eip712_domain(self, asset: str) -> Dict[str, Any]:
        """
        Create EIP-712 domain object
        
        Args:
            asset: USDC contract address
            
        Returns:
            EIP-712 domain object
        """
        return {
            "name": "USDC",
            "version": "2",
            "chainId": 84532,  # Base Sepolia
            "verifyingContract": asset
        }
    
    def _generate_nonce(self) -> str:
        """
        Generate a cryptographically secure nonce
        
        Returns:
            Hex nonce string with 0x prefix
        """
        return "0x" + secrets.token_hex(32)
    
    def _create_authorization_object(
        self, 
        recipient: str, 
        amount: str, 
        deadline: int
    ) -> Dict[str, Any]:
        """
        Create authorization object for EIP-712 signing
        
        Args:
            recipient: Recipient address
            amount: Payment amount in wei
            deadline: Valid before timestamp
            
        Returns:
            Authorization object with all required fields
        """
        nonce = self._generate_nonce()
        
        return {
            "from": self.cdp_account.address,
            "to": recipient,
            "value": amount,
            "validAfter": "0",  # Set to 0 to eliminate race conditions entirely
            "validBefore": str(deadline),
            "nonce": nonce
        }
    
    async def _sign_payment_data(
        self, 
        domain: Dict[str, Any], 
        authorization: Dict[str, Any], 
        types: Dict[str, Any]
    ) -> str:
        """
        Sign payment data using CDP account
        
        Args:
            domain: EIP-712 domain object
            authorization: Authorization object
            types: EIP-712 types definition
            
        Returns:
            Signature as hex string
            
        Raises:
            SignatureError: If signing fails
        """
        try:
            logger.debug(f"Signing data: {json.dumps({'domain': domain, 'message': authorization}, indent=2)}")
            
            signature = await self.cdp_account.sign_typed_data(
                domain=domain,
                types=types,
                primary_type="TransferWithAuthorization",
                message=authorization
            )
            
            logger.debug(f"Signature generated successfully")
            return signature
            
        except Exception as e:
            raise SignatureError(f"Failed to sign payment data: {e}")
    
    def _create_payment_payload_structure(
        self, 
        scheme: str, 
        network: str, 
        signature: str, 
        authorization: Dict[str, Any],
        resource: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create the final payment payload structure
        
        Args:
            scheme: Payment scheme (e.g., 'exact')
            network: Network identifier (e.g., 'base-sepolia')
            signature: EIP-712 signature
            authorization: Authorization object
            resource: Optional resource identifier
            
        Returns:
            Complete payment payload structure
        """
        payload = {
            "x402Version": 1,
            "scheme": scheme,
            "network": network,
            "payload": {
                "signature": signature,
                "authorization": authorization
            }
        }
        
        if resource:
            payload["resource"] = resource
        
        return payload
    
    def _wei_to_usdc(self, wei_amount: str) -> str:
        """
        Convert wei amount to USDC for display
        
        Args:
            wei_amount: Amount in wei as string
            
        Returns:
            USDC amount as formatted string
        """
        try:
            wei = int(wei_amount)
            usdc = wei / 1_000_000  # 6 decimals for USDC
            return f"{usdc:.6f}"
        except (ValueError, TypeError):
            return "0.000000"
    
    def _encode_payment_payload(self, payload: Dict[str, Any]) -> str:
        """
        Encode payment payload as base64
        
        Args:
            payload: Payment payload dictionary
            
        Returns:
            Base64-encoded payment payload
            
        Raises:
            PaymentPayloadError: If encoding fails
        """
        try:
            payload_json = json.dumps(payload, separators=(',', ':'))
            payload_base64 = base64.b64encode(payload_json.encode()).decode()
            
            logger.debug(f"✅ Payment payload created: {payload_base64[:50]}...")
            return payload_base64
            
        except Exception as e:
            raise PaymentPayloadError(f"Failed to encode payment payload: {e}")
    
    async def _create_payment_payload(
        self,
        scheme: str,
        network: str,
        amount: str,
        recipient: str,
        resource: Optional[str] = None,
        asset: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Create complete X402 payment payload
        
        Args:
            scheme: Payment scheme identifier
            network: Network identifier
            amount: Payment amount in wei
            recipient: Recipient address
            resource: Optional resource identifier
            asset: USDC contract address
            extra: Optional extra configuration
            
        Returns:
            Base64-encoded payment payload or None if creation fails
            
        Raises:
            PaymentPayloadError: If payload creation fails
        """
        try:
            # Validate required parameters
            if not all([scheme, network, amount, recipient]):
                raise PaymentPayloadError("Missing required parameters for payment payload")
            
            # Set defaults
            asset = asset or "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
            
            # Create timestamp and deadline
            current_time = int(time.time())
            deadline = current_time + 60  # 60 seconds from now
            
            # Create authorization object
            authorization = self._create_authorization_object(recipient, amount, deadline)
            
            # Create EIP-712 types and domain
            types = self._create_authorization_types()
            domain = self._create_eip712_domain(asset)
            
            # Sign the payment data
            signature = await self._sign_payment_data(domain, authorization, types)
            
            # Create payment payload structure
            payload = self._create_payment_payload_structure(
                scheme, network, signature, authorization, resource
            )
            
            # Encode and return
            return self._encode_payment_payload(payload)
            
        except Exception as e:
            logger.error(f"❌ Failed to create payment payload: {e}")
            raise PaymentPayloadError(f"Payment payload creation failed: {e}")
    
    def _parse_x402_response(self, response: requests.Response) -> Dict[str, Any]:
        """
        Parse X402 response and extract payment requirements
        
        Args:
            response: HTTP response from server
            
        Returns:
            Parsed X402 response data
            
        Raises:
            PaymentRequestError: If response parsing fails
        """
        try:
            x402_data = response.json()
            
            # Extract X402 headers if present
            x402_headers = {}
            for key, value in response.headers.items():
                if key.lower().startswith('x-x402'):
                    x402_headers[key] = value
            
            logger.debug(f"X402 headers found: {x402_headers}")
            
            # Check X402 version
            x402_version = x402_data.get('x402Version') or x402_data.get('x402_version')
            if x402_version != 1:
                raise PaymentRequestError(f"Unsupported X402 version: {x402_version}")
            
            logger.debug("Found X402 v1 format in response body")
            return x402_data
            
        except json.JSONDecodeError as e:
            raise PaymentRequestError(f"Invalid JSON response: {e}")
        except Exception as e:
            raise PaymentRequestError(f"Failed to parse X402 response: {e}")
    
    def _extract_payment_requirements(self, x402_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract payment requirements from X402 response
        
        Args:
            x402_data: Parsed X402 response data
            
        Returns:
            Payment requirements object
            
        Raises:
            PaymentRequestError: If payment requirements are invalid
        """
        accepts = x402_data.get('accepts') or x402_data.get('accepts', [])
        if not accepts:
            raise PaymentRequestError("No payment schemes accepted")
        
        # Use the first accepted payment scheme
        payment_requirements = accepts[0]
        
        def get_key(d: Dict[str, Any], *keys: str) -> Optional[str]:
            """Helper to get value from dict with multiple possible keys"""
            for k in keys:
                if k in d:
                    return d[k]
            return None
        
        return {
            "scheme": get_key(payment_requirements, "scheme"),
            "network": get_key(payment_requirements, "network"),
            "amount": get_key(payment_requirements, "maxAmountRequired"),
            "recipient": get_key(payment_requirements, "payTo", "pay_to"),
            "resource": get_key(payment_requirements, "resource"),
            "asset": get_key(payment_requirements, "asset"),
            "extra": get_key(payment_requirements, "extra")
        }
    
    def _send_payment_request(self, url: str, payment_payload: str) -> Dict[str, Any]:
        """
        Send payment request with X-PAYMENT header
        
        Args:
            url: The URL to request
            payment_payload: Base64-encoded payment payload
            
        Returns:
            Response data dictionary
            
        Raises:
            PaymentRequestError: If request fails
        """
        try:
            headers = {
                'X-PAYMENT': payment_payload,
                'Content-Type': 'application/json'
            }
            
            response = self.session.get(url, headers=headers)
            
            logger.debug(f"Payment response status: {response.status_code}")
            logger.debug(f"Payment response headers: {dict(response.headers)}")
            logger.debug(f"Payment response body: {response.text}")
            
            if response.status_code == 200:
                logger.info("✅ Payment successful!")
                return {
                    "success": True,
                    "status_code": 200,
                    "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                }
            else:
                logger.error(f"❌ Payment failed: {response.status_code}")
                try:
                    error_data = response.json()
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": error_data.get('error', f'Payment failed with status {response.status_code}'),
                        "details": error_data
                    }
                except:
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": f"Payment failed with status {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            logger.error(f"❌ Failed to send payment request: {e}")
            raise PaymentRequestError(f"Payment request failed: {e}")
    
    async def make_payment_request(self, url: str, amount: str = None) -> Dict[str, Any]:
        """
        Make a payment request to the specified URL
        
        Args:
            url: Target URL for the request
            amount: Optional amount override
            
        Returns:
            Dictionary with success status and response data
        """
        try:
            logger.ui(f"🌐 Connecting to server: {url}")
            logger.ui("⏳ Waiting for server response...")
            
            # Make initial request to get payment requirements
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    logger.ui(f"📡 Server response received (Status: {response.status})")
                    
                    if response.status == 402:
                        # Payment required - extract payment details
                        logger.ui("💰 Payment required - processing X402 payment flow")
                        
                        # Get payment details from response
                        payment_data = await response.json()
                        logger.ui("📋 Payment details extracted from server")
                        
                        # Extract payment requirements
                        try:
                            payment_requirements = self._extract_payment_requirements(payment_data)
                            logger.ui("🔍 Payment requirements extracted")
                        except Exception as e:
                            logger.ui(f"❌ Failed to extract payment requirements: {e}")
                            # Fallback to config values
                            x402_config = self.config.get_x402_config()
                            payment_requirements = {
                                "scheme": x402_config.get("scheme", "exact"),
                                "network": x402_config.get("network", "base-sepolia"),
                                "amount": amount or "10000",
                                "recipient": "0xe93cb61e3f327F344c09D5dFffE25fb0B0cFA65d",
                                "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
                            }
                        
                        # Discover cost dynamically
                        discovered_cost = payment_requirements.get('amount', amount or "10000")
                        cost_usdc = "USDC"
                        
                        logger.ui(f"💰 Discovered cost: {discovered_cost} wei ({self._wei_to_usdc(discovered_cost)} {cost_usdc})")
                        
                        # Create payment payload
                        logger.ui("🔐 Creating X402 payment payload...")
                        x402_config = self.config.get_x402_config()
                        payment_payload = await self._create_payment_payload(
                            scheme=payment_requirements.get('scheme', x402_config.get("scheme", "exact")),
                            network=payment_requirements.get('network', x402_config.get("network", "base-sepolia")),
                            amount=discovered_cost,
                            recipient=payment_requirements.get('recipient', '0xe93cb61e3f327F344c09D5dFffE25fb0B0cFA65d'),
                            resource=payment_requirements.get('resource'),
                            asset=payment_requirements.get('asset', '0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
                            extra=payment_requirements.get('extra')
                        )
                        
                        # Send payment
                        logger.ui("🚀 Sending X402 payment with X-PAYMENT header")
                        logger.ui("⏳ Waiting for payment verification...")
                        
                        # Make payment request
                        headers = {
                            'X-PAYMENT': payment_payload,
                            'Content-Type': 'application/json'
                        }
                        
                        async with session.get(url, headers=headers) as payment_response:
                            logger.ui(f"✅ Payment response received (Status: {payment_response.status})")
                            
                            if payment_response.status == 200:
                                # Payment successful
                                logger.ui("✅ Payment successful!")
                                response_data = await payment_response.json()
                                return {
                                    "success": True,
                                    "data": response_data,
                                    "cost": discovered_cost
                                }
                            else:
                                # Payment failed
                                error_text = await payment_response.text()
                                logger.ui(f"❌ Payment failed with status {payment_response.status}")
                                return {
                                    "success": False,
                                    "error": f"Payment failed: {payment_response.status}",
                                    "details": error_text
                                }
                    else:
                        # No payment required or other status
                        response_text = await response.text()
                        logger.ui(f"ℹ️  Server returned status {response.status} (no payment required)")
                        return {
                            "success": True,
                            "data": {"message": "No payment required", "status": response.status},
                            "raw_response": response_text
                        }
                        
        except Exception as e:
            logger.error(f"❌ Payment request failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _handle_request_error(self, error: Exception, context: str) -> X402Error:
        """
        Convert various exceptions to appropriate X402 error types.
        
        Args:
            error: The original exception
            context: Context string for logging
            
        Returns:
            Appropriate X402 error instance
        """
        logger.error(f"Request failed in {context}", exc_info=error)
        
        if isinstance(error, requests.exceptions.ConnectionError):
            return NetworkError(
                f"Connection failed to {self.base_url}",
                {"context": context, "base_url": self.base_url}
            )
        elif isinstance(error, requests.exceptions.Timeout):
            return NetworkError(
                f"Request timed out to {self.base_url}",
                {"context": context, "timeout": "30s"}
            )
        elif isinstance(error, requests.exceptions.HTTPError):
            if error.response.status_code == 402:
                return PaymentError(
                    "Payment required but validation failed",
                    {"status_code": error.response.status_code, "response": error.response.text}
                )
            elif error.response.status_code >= 500:
                return NetworkError(
                    f"Server error: {error.response.status_code}",
                    {"status_code": error.response.status_code, "response": error.response.text}
                )
            else:
                return X402Error(
                    f"HTTP error: {error.response.status_code}",
                    "HTTP_ERROR",
                    error.response.status_code,
                    {"response": error.response.text}
                )
        else:
            return X402Error(
                f"Unexpected error: {str(error)}",
                "UNKNOWN_ERROR",
                500,
                {"original_error": str(error)}
            )
    
    def _log_payment_attempt(self, endpoint: str, payload: Dict[str, Any]):
        """Log payment attempt details for debugging."""
        logger.flow('payment_attempt', {
            'endpoint': endpoint,
            'amount': payload.get('amount'),
            'recipient': payload.get('recipient'),
            'network': payload.get('network')
        })
    
    def _log_payment_success(self, endpoint: str, response_data: Dict[str, Any]):
        """Log successful payment details."""
        logger.flow('payment_success', {
            'endpoint': endpoint,
            'payment_verified': response_data.get('paymentVerified', False),
            'content_tier': response_data.get('contentTier', 'unknown')
        })
    
    def make_payment(self, endpoint: str, amount: str = "0") -> Dict[str, Any]:
        """
        Make a payment to the specified endpoint using X402 protocol.
        
        Args:
            endpoint: API endpoint to call
            amount: Payment amount (default "0" for dynamic discovery)
            
        Returns:
            Response data from the server
            
        Raises:
            X402Error: For various payment and network errors
        """
        try:
            # Create payment payload
            payload = self._create_payment_payload(amount)
            url = f"{self.base_url}{endpoint}"
            
            self._log_payment_attempt(endpoint, payload)
            
            # Make the request with X402 payment interceptor
            response = self.session.post(
                url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Payment-Protocol": "x402"
                },
                timeout=60  # 60 second timeout for payment processing
            )
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # Parse response
            try:
                response_data = response.json()
            except json.JSONDecodeError as e:
                raise X402Error(
                    "Invalid JSON response from server",
                    "RESPONSE_PARSE_ERROR",
                    500,
                    {"response_text": response.text, "json_error": str(e)}
                )
            
            self._log_payment_success(endpoint, response_data)
            
            # Check for payment verification
            if not response_data.get('paymentVerified', False):
                raise PaymentError(
                    "Payment verification failed",
                    {"response": response_data}
                )
            
            return response_data
            
        except requests.exceptions.RequestException as e:
            raise self._handle_request_error(e, f"payment to {endpoint}")
        except X402Error:
            # Re-raise X402 errors as-is
            raise
        except Exception as e:
            # Convert any other exceptions to X402 errors
            raise X402Error(
                f"Unexpected error during payment: {str(e)}",
                "UNKNOWN_ERROR",
                500,
                {"endpoint": endpoint, "original_error": str(e)}
            )
    
    def get_balance(self) -> str:
        """
        Get current USDC balance for the wallet.
        
        Returns:
            Balance as string
            
        Raises:
            X402Error: For network or wallet errors
        """
        try:
            # This would typically call the CDP client to get balance
            # For now, we'll return a placeholder
            return "0.0"
        except Exception as e:
            raise X402Error(
                f"Failed to get balance: {str(e)}",
                "BALANCE_ERROR",
                500,
                {"original_error": str(e)}
            )
    
    def close(self):
        """Clean up resources."""
        if self.session:
            self.session.close()

def create_x402_client(cdp_account, cdp_client, config: Config, base_url: str = None) -> CustomX402Client:
    """
    Factory function to create X402 client with CDP account
    
    Args:
        cdp_account: CDP account instance
        cdp_client: CDP client instance
        config: Configuration object
        base_url: Base URL for the server (defaults to config)
        
    Returns:
        Configured CustomX402Client instance
    """
    if base_url is None:
        from ...shared.config import get_server_url
        base_url = get_server_url()
    
    signer = CDPSigner(cdp_account)
    return CustomX402Client(signer, cdp_client, config) 