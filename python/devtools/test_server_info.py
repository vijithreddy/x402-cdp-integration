#!/usr/bin/env python3
"""
Test server information to understand X402 requirements
"""

import requests
import json

def test_server_info():
    """Test server endpoints to understand X402 configuration"""
    
    base_url = "http://localhost:5001"
    
    print("🔍 Testing server X402 configuration")
    print("=" * 50)
    
    # Test 1: Check if there's a health or info endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Health response: {response.text}")
    except:
        print("No health endpoint found")
    
    # Test 2: Check if there's an X402 info endpoint
    try:
        response = requests.get(f"{base_url}/x402")
        print(f"X402 endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"X402 response: {response.text}")
    except:
        print("No X402 endpoint found")
    
    # Test 3: Check protected endpoint with different headers
    try:
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'X402-Test-Client/1.0'
        }
        response = requests.get(f"{base_url}/protected", headers=headers)
        print(f"Protected with custom headers: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check if there are any other endpoints
    endpoints = ['/', '/api', '/docs', '/openapi.json', '/info']
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"{endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"  Content: {response.text[:200]}...")
        except:
            print(f"{endpoint}: Not found")

if __name__ == "__main__":
    test_server_info() 