#!/bin/bash
set -e

echo "=== iTerm Agent Dashboard Setup ==="

# Server setup
echo ""
echo "--- Setting up server ---"
cd "$(dirname "$0")/server"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Generate random API token
TOKEN=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
cat > .env <<EOF
DASHBOARD_API_TOKEN=$TOKEN
DASHBOARD_HOST=0.0.0.0
DASHBOARD_PORT=8420
EOF

echo ""
echo "API Token: $TOKEN"
echo "Save this token — you'll enter it in the mobile app."

# Mobile setup
echo ""
echo "--- Setting up mobile app ---"
cd ../mobile
npm install

echo ""
echo "=== Setup complete ==="
echo "Start server:  cd server && source .venv/bin/activate && python run.py"
echo "Start mobile:  cd mobile && npx expo start"
