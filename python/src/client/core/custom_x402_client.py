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
    
    def __init__(self, signer: CDPSigner):
        """
        Initialize custom X402 client
        
        Args:
            signer: CDP signer wrapper for EIP-712 signing
            
        Raises:
            ValueError: If signer is invalid
        """
        if not isinstance(signer, CDPSigner):
            raise ValueError("Signer must be a CDPSigner instance")
        
        self.signer = signer
        self.session = requests.Session()
        
        logger.info(f"✅ Custom X402 client initialized with signer: {self.signer.address}")
    
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
            "from": self.signer.address,
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
            
            signature = await self.signer.sign_typed_data(
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
    
    async def make_payment_request(self, url: str, amount: str = "10000") -> Dict[str, Any]:
        """
        Make a payment request to a protected endpoint
        
        This method orchestrates the complete X402 payment flow:
        1. Initial request to get payment requirements
        2. Parse X402 response and extract requirements
        3. Create payment payload with EIP-712 signature
        4. Send payment request with X-PAYMENT header
        5. Handle response and return result
        
        Args:
            url: The URL to request
            amount: Payment amount in wei (default: 10000 = 0.01 USDC)
            
        Returns:
            Dict containing the response data with success/error information
            
        Raises:
            PaymentRequestError: If payment flow fails
            PaymentPayloadError: If payload creation fails
        """
        logger.info(f"💸 Making payment request to: {url}")
        logger.info(f"💰 Amount: {amount} wei (0.01 USDC)")
        
        try:
            # Step 1: Make initial request to get X402 payment requirements
            logger.debug(f"Making initial request to: {url}")
            response = self.session.get(url)
            
            if response.status_code == 200:
                logger.info("✅ Payment not required, request successful")
                return {
                    "success": True,
                    "status_code": 200,
                    "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                }
            
            if response.status_code != 402:
                raise PaymentRequestError(f"Unexpected status code: {response.status_code}")
            
            logger.info("X402 payment required, processing payment flow")
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            logger.debug(f"Response body: {response.text}")
            
            # Step 2: Parse X402 payment requirements
            x402_data = self._parse_x402_response(response)
            payment_requirements = self._extract_payment_requirements(x402_data)
            
            # Step 3: Create payment payload
            payment_payload = await self._create_payment_payload(
                scheme=payment_requirements["scheme"],
                network=payment_requirements["network"],
                amount=amount,
                recipient=payment_requirements["recipient"],
                resource=payment_requirements["resource"],
                asset=payment_requirements["asset"],
                extra=payment_requirements["extra"]
            )
            
            if not payment_payload:
                raise PaymentPayloadError("Failed to create payment payload")
            
            # Step 4: Send payment with X-PAYMENT header
            logger.info("Sending X402 payment with X-PAYMENT header")
            return self._send_payment_request(url, payment_payload)
            
        except (PaymentRequestError, PaymentPayloadError, SignatureError) as e:
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            # Wrap unexpected errors
            raise PaymentRequestError(f"Unexpected error in payment flow: {e}")

def create_x402_client(cdp_account, base_url: str = None) -> CustomX402Client:
    """
    Factory function to create X402 client with CDP account
    
    Args:
        cdp_account: CDP account instance
        base_url: Base URL for the server (defaults to config)
        
    Returns:
        Configured CustomX402Client instance
    """
    if base_url is None:
        from ...shared.config import get_server_url
        base_url = get_server_url()
    
    signer = CDPSigner(cdp_account)
    return CustomX402Client(signer) 