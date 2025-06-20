#!/usr/bin/env python3
"""
X402 Python Server Runner

Runs the FastAPI server with configuration from the root config.yaml file.
"""

import uvicorn
from src.shared.config import config

def main():
    """Run the X402 Python server with config-based settings"""
    server_config = config.get_server_config("python")
    
    port = server_config.get("port", 5001)
    host = server_config.get("host", "localhost")
    log_level = server_config.get("log_level", "INFO").lower()
    
    print(f"🚀 Starting X402 Python Server")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Log Level: {log_level}")
    print(f"   Config: {config.config_path}")
    print()
    
    uvicorn.run(
        "src.server.app:app",
        host=host,
        port=port,
        log_level=log_level,
        reload=True
    )

if __name__ == "__main__":
    main() 