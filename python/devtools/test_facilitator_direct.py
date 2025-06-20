#!/usr/bin/env python3
"""
Test direct communication with X402 facilitator
"""

import requests
import json
import base64

def test_facilitator_direct():
    """Test direct communication with X402 facilitator"""
    
    print("🔍 Testing direct communication with X402 facilitator")
    print("=" * 60)
    
    # Our current payload structure
    our_payload = {
        "x402Version": 1,
        "scheme": "exact",
        "network": "base-sepolia",
        "resource": "http://localhost:5001/protected",
        "payload": {
            "authorization": {
                "from": "0x02998Da7aD2C929A22E66F9A4a4cFF90c8994B51",
                "to": "0x542C09793380BD873734d63Dc9f18aab6920C21B",
                "value": "10000",
                "validAfter": "1750316005",
                "validBefore": "1750316065",
                "nonce": "0x6bb8970a31f5e7b0dc8a4ed202a03bf8bbc15ce36d4df006b698693e07240d6c"
            },
            "signature": "0xa85e903e79a50df8d9502a41ffaa3fef4bd69d36bdd63b87f68fbf11027872b35237b562e8492e7e21500ff812281c058054b6878191f608328d8578a8d4745a1b"
        }
    }
    
    print("📦 Our payload structure:")
    print(json.dumps(our_payload, indent=2))
    print()
    
    # Try different payload structures
    test_payloads = [
        {
            "name": "Our current structure",
            "payload": our_payload
        },
        {
            "name": "Simplified structure",
            "payload": {
                "x402Version": 1,
                "scheme": "exact",
                "network": "base-sepolia",
                "resource": "http://localhost:5001/protected",
                "authorization": our_payload["payload"]["authorization"],
                "signature": our_payload["payload"]["signature"]
            }
        },
        {
            "name": "Flat structure",
            "payload": {
                "x402Version": 1,
                "scheme": "exact",
                "network": "base-sepolia",
                "resource": "http://localhost:5001/protected",
                "from": "0x02998Da7aD2C929A22E66F9A4a4cFF90c8994B51",
                "to": "0x542C09793380BD873734d63Dc9f18aab6920C21B",
                "value": "10000",
                "validAfter": "1750316005",
                "validBefore": "1750316065",
                "nonce": "0x6bb8970a31f5e7b0dc8a4ed202a03bf8bbc15ce36d4df006b698693e07240d6c",
                "signature": "0xa85e903e79a50df8d9502a41ffaa3fef4bd69d36bdd63b87f68fbf11027872b35237b562e8492e7e21500ff812281c058054b6878191f608328d8578a8d4745a1b"
            }
        }
    ]
    
    for test in test_payloads:
        print(f"🧪 Testing: {test['name']}")
        print("-" * 40)
        
        try:
            # Send request to X402 facilitator
            response = requests.post(
                "https://www.x402.org/facilitator/verify",
                json=test['payload'],
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "X402-Test-Client/1.0"
                },
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            print(f"   Body: {response.text}")
            
            if response.status_code == 200:
                print("   ✅ SUCCESS!")
                break
            else:
                print("   ❌ Failed")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print()

if __name__ == "__main__":
    test_facilitator_direct() 