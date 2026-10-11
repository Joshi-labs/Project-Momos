import os
import sys

# Ensure backend root is on sys.path so modules can be imported directly
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# Set mock/dummy environment variables for the test process before app modules load.
# These satisfy startup validation checks during automated tests without needing real credentials.
os.environ.setdefault("SECRET_KEY", "...")
os.environ.setdefault("CORS_ORIGINS", "...")
os.environ.setdefault("ADMIN_ID", "...")
os.environ.setdefault("ADMIN_PASS", "...")
os.environ.setdefault("ADMIN_NAME", "...")
os.environ.setdefault("RATE_LIMIT", "...")

