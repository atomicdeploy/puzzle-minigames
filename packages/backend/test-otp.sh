#!/bin/bash

# OTP Testing Script for Mellipayamak Integration
# This script tests the complete OTP authentication flow

API_URL="http://localhost:3001/api/auth"

echo "========================================="
echo "OTP Authentication Flow Test"
echo "========================================="
echo ""

# Test 1: Send OTP to first test number
echo "Test 1: Sending OTP to 09901212697..."
response=$(curl -s -X POST "${API_URL}/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "09901212697"}')
echo "Response: $response"
echo ""

# Test 2: Send OTP to second test number
echo "Test 2: Sending OTP to 09197103488..."
response=$(curl -s -X POST "${API_URL}/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "09197103488"}')
echo "Response: $response"
echo ""

# Test 3: Get OTP from database (requires MySQL access)
echo "Test 3: Retrieving OTP codes from database..."
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
  echo "Database credentials not set. Please set DB_USER and DB_PASSWORD environment variables."
else
  mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE puzzle_minigames; SELECT phone, otp_code, created_at FROM otp_sessions WHERE verified=0 ORDER BY created_at DESC LIMIT 2;" 2>/dev/null
fi
echo ""

# Test 4: Verify OTP (you'll need to get the actual OTP from the SMS or database)
echo "Test 4: To verify OTP, run:"
echo "curl -X POST ${API_URL}/verify-otp -H 'Content-Type: application/json' -d '{\"phone\": \"09901212697\", \"otp\": \"YOUR_OTP_CODE\"}'"
echo ""

# Test 5: Register a new user (after OTP verification)
echo "Test 5: To register a new user, run:"
echo "curl -X POST ${API_URL}/register -H 'Content-Type: application/json' -d '{\"phone\": \"09901212697\", \"name\": \"Test User\", \"birthday\": \"1990-01-01\", \"gender\": \"male\", \"educationLevel\": \"bachelor\", \"fieldOfStudy\": \"Computer Science\", \"color\": \"#6c5ce7\"}'"
echo ""

echo "========================================="
echo "Test Configuration:"
echo "========================================="
echo "Endpoint: rest.payamak-panel.com"
echo "Pattern Code: 413580"
echo "Test Phone Numbers:"
echo "  - 09901212697"
echo "  - 09197103488"
echo "Username: 9901212697"
echo "API Key: [CONFIGURED]"
echo ""
