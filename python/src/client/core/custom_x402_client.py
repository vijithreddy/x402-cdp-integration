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
        logger.info(f"Making initial request to: {url}")
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
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        logger.info(f"Response body: {response.text}")
        
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
        
        logger.info(f"X402 headers found: {x402_headers}")
        
        # Check if response contains X402 v1 format
        x402_version = x402_data.get('x402Version') or x402_data.get('x402_version')
        if x402_version == 1:
            logger.info("Found X402 v1 format in response body")
            
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
            logger.info("Signing X402 payment with CDP account")
            
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
                "validAfter": str(current_time),
                "validBefore": str(deadline),
                "nonce": nonce
            }
            
            # Create EIP-712 types with camelCase field names
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
            
            # Create EIP-712 domain using USDC contract address and version from extra field
            domain = EIP712Domain(
                name=extra.get("name", "USDC") if extra else "USDC",  # Use USDC name from extra
                version=extra.get("version", "2") if extra else "2",  # Use version from extra
                chain_id=84532,  # Base Sepolia
                verifying_contract=asset  # Use USDC contract address as verifying contract
            )
            
            # Create the data structure that gets signed (matching TypeScript exactly)
            data = {
                "types": authorization_types,
                "domain": {
                    "name": domain.name,
                    "version": domain.version,
                    "chainId": domain.chain_id,
                    "verifyingContract": domain.verifying_contract
                },
                "primaryType": "TransferWithAuthorization",
                "message": authorization
            }
            
            logger.info(f"Signing data: {json.dumps(data, indent=2)}")
            
            # Sign the structured data using CDP account's async method
            signature = await self.signer.sign_typed_data(
                domain={
                    "name": domain.name,
                    "version": domain.version,
                    "chainId": domain.chain_id,
                    "verifyingContract": domain.verifying_contract
                },
                types=authorization_types,
                primary_type="TransferWithAuthorization",
                message=authorization
            )
            
            logger.info(f"Signature: {signature}")
            
            # Create payment payload with camelCase fields for X402 facilitator
            payment_data = {
                "x402Version": 1,  # Use camelCase for facilitator
                "scheme": scheme,
                "network": network,
                "payload": {
                    "signature": signature,  # Signature comes FIRST
                    "authorization": {
                        "from": self.signer.address,  # This will be converted to "from_" by the library
                        "to": recipient,
                        "value": amount,
                        "validAfter": str(current_time),  # This will be converted to "valid_after" by the library
                        "validBefore": str(deadline),  # This will be converted to "valid_before" by the library
                        "nonce": nonce
                    }
                }
            }
            
            # Convert to JSON and base64 encode
            payment_json = json.dumps(payment_data, separators=(',', ':'))
            logger.info(f"Payment payload JSON: {payment_json}")
            
            payment_base64 = base64.b64encode(payment_json.encode()).decode()
            logger.info(f"Payment payload base64: {payment_base64}")
            
            # Decode and print for analysis
            decoded_payload = base64.b64decode(payment_base64).decode()
            logger.info(f"🔍 DECODED X-PAYMENT PAYLOAD FOR ANALYSIS:")
            logger.info(f"   Raw JSON: {decoded_payload}")
            
            # Parse and print field-by-field breakdown
            parsed_payload = json.loads(decoded_payload)
            logger.info(f"   Field-by-field breakdown:")
            logger.info(f"     x402Version: {parsed_payload.get('x402Version')}")
            logger.info(f"     scheme: {parsed_payload.get('scheme')}")
            logger.info(f"     network: {parsed_payload.get('network')}")
            logger.info(f"     resource: {parsed_payload.get('resource')}")
            
            payload_data = parsed_payload.get('payload', {})
            logger.info(f"     payload.signature: {payload_data.get('signature', '')[:20]}...")
            
            auth = payload_data.get('authorization', {})
            logger.info(f"     payload.authorization.from: {auth.get('from')}")
            logger.info(f"     payload.authorization.to: {auth.get('to')}")
            logger.info(f"     payload.authorization.value: {auth.get('value')}")
            logger.info(f"     payload.authorization.validAfter: {auth.get('validAfter')}")
            logger.info(f"     payload.authorization.validBefore: {auth.get('validBefore')}")
            logger.info(f"     payload.authorization.nonce: {auth.get('nonce')}")
            
            return payment_base64
            
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
            
            logger.info(f"Payment response status: {response.status_code}")
            logger.info(f"Payment response headers: {dict(response.headers)}")
            logger.info(f"Payment response body: {response.text}")
            
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