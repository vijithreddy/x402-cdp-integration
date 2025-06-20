# Development Tools

This directory contains development and testing utilities for the X402 CDP integration.

## Test Files

### Core Integration Tests
- `test_payment_simple.py` - **Main test file** (moved to root directory)
  - Clean X402 payment test using CDP accounts
  - Production-ready test flow

### Development & Debugging Tests
- `test_account.py` - Test CDP account creation and management
- `test_balance.py` - Test USDC balance checking
- `test_cdp_signer.py` - Test CDP signer functionality
- `test_cdp_vs_eth_account.py` - Compare CDP vs eth_account signing
- `test_eip712_signing.py` - Test EIP-712 signature creation
- `test_facilitator_direct.py` - Direct facilitator API testing
- `test_python_client.py` - Test Python client functionality
- `test_server_info.py` - Test server information endpoints
- `test_x402_official.py` - Test official X402 library integration

### Debugging Tools
- `test_method_signature.py` - Debug CDP method signatures
- `test_signature_debug.py` - Debug signature creation issues

## Usage

These files are for development and debugging purposes. For production testing, use:

```bash
python3 test_payment_simple.py
```

## Notes

- These files may contain experimental code and debugging output
- They're not part of the production integration
- Use them for development, debugging, and understanding the integration 