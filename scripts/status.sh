#!/bin/bash

echo "=== CryptoPay Service Status ==="
echo ""

check_service() {
  local name=$1
  local port=$2
  local url=$3

  if curl -s -o /dev/null -w "" --connect-timeout 1 "$url" 2>/dev/null; then
    echo "  $name (port $port): running"
  else
    echo "  $name (port $port): stopped"
  fi
}

check_service "Web" "3000" "http://localhost:3000/"
check_service "Server" "3001" "http://localhost:3001/health"
check_service "Facilitator" "3003" "http://localhost:3003/health"

echo ""

# Check Stripe configuration
stripe_status=$(curl -s http://localhost:3001/api/stripe/status 2>/dev/null)
if echo "$stripe_status" | grep -q '"configured":true'; then
  echo "  Stripe: configured"
elif echo "$stripe_status" | grep -q '"configured":false'; then
  echo "  Stripe: not configured"
else
  echo "  Stripe: unknown (server not running)"
fi

echo ""
