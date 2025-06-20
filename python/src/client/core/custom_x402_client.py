#!/usr/bin/env python3
"""
Custom X402 client using Requests Session Client approach
"""

import requests
import json
import base64
import time
from typing import Dict, Any, Optional
from ...shared.utils.logger import logger
from eth_utils import to_hex
from cdp.openapi_client.models.eip712_domain import EIP712Domain

class CustomX402Client:
    """Custom X402 client using Requests Session Client approach"""
    
    def __init__(self, signer):
        """
        Initialize the X402 client
        
        Args:
            signer: CDP account object for signing payments
        """
        self.signer = signer
        self.session = requests.Session()
        logger.info(f"✅ Custom X402 client initialized with signer: {getattr(signer, 'address', None)}")
    
    async def make_payment_request(self, url: str, amount: str = "10000") -> Dict[str, Any]:
        """
        Make a payment request to a protected endpoint
        
        Args:
            url: The URL to request
            amount: Payment amount in wei (default: 10000 = 0.01 USDC)
            
        Returns:
            Dict containing the response data
        """
        logger.info(f"💸 Making payment request to: {url}")
        logger.info(f"💰 Amount: {amount} wei (0.01 USDC)")
        
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
            logger.error(f"❌ Unexpected status code: {response.status_code}")
            return {
                "success": False,
                "status_code": response.status_code,
                "error": f"Unexpected status code: {response.status_code}"
            }
        
        logger.info("X402 payment required, processing payment flow")
        logger.debug(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")
        logger.debug(f"Response body: {response.text}")
        
        # Step 2: Parse X402 payment requirements
        try:
            x402_data = response.json()
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON response: {e}")
            return {
                "success": False,
                "status_code": 402,
                "error": f"Invalid JSON response: {e}"
            }
        
        # Extract X402 headers if present
        x402_headers = {}
        for key, value in response.headers.items():
            if key.lower().startswith('x-x402'):
                x402_headers[key] = value
        
        logger.debug(f"X402 headers found: {x402_headers}")
        
        # Check if response contains X402 v1 format
        x402_version = x402_data.get('x402Version') or x402_data.get('x402_version')
        if x402_version == 1:
            logger.debug("Found X402 v1 format in response body")
            
            # Use the first accepted payment scheme
            accepts = x402_data.get('accepts') or x402_data.get('accepts', [])
            if accepts:
                payment_requirements = accepts[0]  # Use first payment option
                
                def get_key(d, *keys):
                    for k in keys:
                        if k in d:
                            return d[k]
                    return None

                payment_payload = await self._create_payment_payload(
                    scheme=get_key(payment_requirements, "scheme"),
                    network=get_key(payment_requirements, "network"),
                    amount=amount,
                    recipient=get_key(payment_requirements, "payTo", "pay_to"),
                    resource=get_key(payment_requirements, "resource"),
                    asset=get_key(payment_requirements, "asset"),
                    extra=get_key(payment_requirements, "extra")  # Pass extra field for domain info
                )
                
                if not payment_payload:
                    return {
                        "success": False,
                        "status_code": 402,
                        "error": "Failed to create payment payload"
                    }
                
                # Step 3: Send payment with X-PAYMENT header
                logger.info("Sending X402 payment with X-PAYMENT header")
                payment_response = self._send_payment_request(url, payment_payload)
                
                return payment_response
            else:
                logger.error("❌ No payment schemes accepted")
                return {
                    "success": False,
                    "status_code": 402,
                    "error": "No payment schemes accepted"
                }
        else:
            logger.error("❌ Invalid X402 response format")
            return {
                "success": False,
                "status_code": 402,
                "error": "Invalid X402 response format"
            }
    
    async def _create_payment_payload(self, scheme: str, network: str, amount: str, 
                               recipient: str, resource: str, asset: str, extra: str) -> Optional[str]:
        """
        Create X402 payment payload matching the working TypeScript format
        
        Args:
            scheme: Payment scheme (e.g., 'exact')
            network: Network name (e.g., 'base-sepolia')
            amount: Payment amount in wei
            recipient: Recipient address
            resource: Resource URL
            asset: Asset contract address
            extra: Extra field for domain info
            
        Returns:
            Base64-encoded payment payload or None if failed
        """
        try:
            # Get current timestamp
            current_time = int(time.time())
            deadline = current_time + 60  # 60 seconds from now
            
            # Generate a hex nonce (like the working TypeScript client)
            import secrets
            nonce = "0x" + secrets.token_hex(32)
            
            # Create authorization object (all fields camelCase for EIP-712 signing)
            authorization = {
                "from": self.signer.address,
                "to": recipient,
                "value": amount,
                "validAfter": "0",  # Set to 0 to eliminate race conditions entirely
                "validBefore": str(deadline),
                "nonce": nonce
            }
            
            # Create EIP-712 types matching the TypeScript client
            authorization_types = {
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
            
            # Create EIP-712 domain using USDC token info (like TypeScript client)
            domain = {
                "name": "USDC",  # From extra.name in payment requirements
                "version": "2",  # From extra.version in payment requirements
                "chainId": 84532,  # Base Sepolia
                "verifyingContract": asset  # USDC contract address
            }
            
            # Create the data structure that gets signed (matching TypeScript exactly)
            data = {
                "types": authorization_types,
                "domain": domain,
                "primaryType": "TransferWithAuthorization",
                "message": authorization
            }
            
            logger.debug(f"Signing data: {json.dumps(data, indent=2)}")
            
            # Sign the structured data using CDP account's async method
            signature = await self.signer.sign_typed_data(
                domain=domain,
                types=authorization_types,
                primary_type="TransferWithAuthorization",
                message=authorization
            )
            
            # Create payment payload structure (matching TypeScript)
            payment_data = {
                "x402Version": 1,
                "scheme": scheme,
                "network": network,
                "resource": resource,
                "payload": {
                    "signature": signature,
                    "authorization": authorization
                }
            }
            
            # Encode as base64
            payload_json = json.dumps(payment_data)
            payload_base64 = base64.b64encode(payload_json.encode()).decode()
            
            logger.debug(f"✅ Payment payload created: {payload_base64[:50]}...")
            return payload_base64
            
        except Exception as e:
            logger.error(f"❌ Failed to create payment payload: {e}")
            return None
    
    def _send_payment_request(self, url: str, payment_payload: str) -> Dict[str, Any]:
        """
        Send payment request with X-PAYMENT header
        
        Args:
            url: The URL to request
            payment_payload: Base64-encoded payment payload
            
        Returns:
            Dict containing the response data
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
            return {
                "success": False,
                "status_code": 0,
                "error": f"Request failed: {e}"
            }
    
    async def get(self, endpoint: str) -> requests.Response:
        """
        Make a GET request to an endpoint with automatic X402 payment handling
        
        Args:
            endpoint: The endpoint to request (e.g., 'protected', 'premium')
            
        Returns:
            requests.Response object
        """
        # Construct full URL
        if not endpoint.startswith('http'):
            # Assume relative endpoint, use base URL
            url = f"http://localhost:5001/{endpoint.lstrip('/')}"
        else:
            url = endpoint
        
        # Make payment request
        result = await self.make_payment_request(url)
        
        # Create a mock response object for compatibility
        class MockResponse:
            def __init__(self, result_dict):
                self.status_code = result_dict.get('status_code', 0)
                self.text = str(result_dict.get('data', ''))
                self.headers = {}
                self._json_data = result_dict.get('data')
                
            def json(self):
                if isinstance(self._json_data, dict):
                    return self._json_data
                else:
                    raise ValueError("Response is not JSON")
        
        return MockResponse(result)

def create_x402_client(cdp_account, base_url: str = "http://localhost:5001") -> CustomX402Client:
    """
    Create a CustomX402Client instance
    
    Args:
        cdp_account: CDP account object for signing
        base_url: Base URL for the server (default: http://localhost:5001)
        
    Returns:
        CustomX402Client instance
    """
    client = CustomX402Client(cdp_account)
    # Set the base URL in the session
    client.session.base_url = base_url
    return client 