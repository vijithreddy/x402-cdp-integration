"""
Payment Service Module

Handles X402 payment verification and business logic for payment processing.
"""

import json
import logging
from typing import Dict, Any, Optional
import httpx
from ...shared.utils.logger import logger


class PaymentService:
    """Service for handling X402 payment verification and processing"""
    
    def __init__(self, facilitator_url: str = "https://x402.org/facilitator"):
        """
        Initialize the payment service
        
        Args:
            facilitator_url: URL of the X402 facilitator service
        """
        self.facilitator_url = facilitator_url
        self.logger = logger
    
    async def verify_payment(
        self, 
        payment_data: Dict[str, Any], 
        resource_path: str,
        receiving_address: str
    ) -> bool:
        """
        Verify a payment with the X402 facilitator
        
        Args:
            payment_data: Decoded payment data from X-PAYMENT header
            resource_path: The resource path being accessed
            receiving_address: The address that should receive the payment
            
        Returns:
            True if payment is valid, False otherwise
        """
        try:
            facilitator_payload = self._create_facilitator_payload(
                payment_data, resource_path, receiving_address
            )
            
            self.logger.info("🔍 SENDING TO FACILITATOR:")
            self.logger.info(f"   Payload: {json.dumps(facilitator_payload, indent=2)}")
            
            # Send to facilitator
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.post(
                    f"{self.facilitator_url}/verify",
                    json=facilitator_payload,
                    headers={"Content-Type": "application/json"},
                    timeout=10.0
                )
                
                self.logger.info(f"   Facilitator response status: {response.status_code}")
                self.logger.info(f"   Facilitator response: {response.text}")
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        return result.get("isValid", False)
                    except json.JSONDecodeError as e:
                        self.logger.error(f"   Failed to parse facilitator response as JSON: {e}")
                        self.logger.error(f"   Raw response: {response.text}")
                        return False
                else:
                    self.logger.error(f"   Facilitator error: {response.status_code} - {response.text}")
                    # Log additional details for debugging
                    try:
                        error_json = response.json()
                        self.logger.error(f"   Error details: {json.dumps(error_json, indent=2)}")
                    except json.JSONDecodeError:
                        self.logger.error(f"   Non-JSON error response: {response.text}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"❌ Error verifying payment: {e}")
            return False
    
    def _create_facilitator_payload(
        self, 
        payment_data: Dict[str, Any], 
        resource_path: str,
        receiving_address: str
    ) -> Dict[str, Any]:
        """
        Create the payload format expected by the X402 facilitator
        
        Args:
            payment_data: Decoded payment data from X-PAYMENT header
            resource_path: The resource path being accessed
            receiving_address: The address that should receive the payment
            
        Returns:
            Formatted payload for facilitator verification
        """
        # The facilitator expects the raw payment data exactly as sent by the client
        # This matches what the TypeScript x402-express middleware sends
        return {
            "x402Version": payment_data.get("x402Version"),
            "scheme": payment_data.get("scheme"),
            "network": payment_data.get("network"),
            "payload": {
                "signature": payment_data.get("payload", {}).get("signature"),
                "authorization": {
                    "from": payment_data.get("payload", {}).get("authorization", {}).get("from"),
                    "to": payment_data.get("payload", {}).get("authorization", {}).get("to"),
                    "value": payment_data.get("payload", {}).get("authorization", {}).get("value"),
                    "validAfter": payment_data.get("payload", {}).get("authorization", {}).get("validAfter"),
                    "validBefore": payment_data.get("payload", {}).get("authorization", {}).get("validBefore"),
                    "nonce": payment_data.get("payload", {}).get("authorization", {}).get("nonce")
                }
            }
        }


# Global instance for easy access
payment_service = PaymentService() 