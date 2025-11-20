#!/bin/bash

# Seed Supabase Auth with development users

set -e

SUPABASE_URL="http://localhost:8000"
SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q}"

echo "Waiting for Supabase..."
until curl -s "${SUPABASE_URL}/auth/v1/settings" -H "APIKey: ${SERVICE_ROLE_KEY}" > /dev/null 2>&1; do
  sleep 2
done
echo "Supabase ready"

create_user() {
  local email=$1
  local password=$2
  local role=$3
  local name=$4
  
  local json_payload=$(cat <<EOF
{
  "email": "${email}",
  "password": "${password}",
  "email_confirm": true,
  "user_metadata": {
    "name": "${name}",
    "role": "${role}"
  },
  "app_metadata": {
    "role": "${role}"
  }
}
EOF
)
  
  RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "APIKey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${json_payload}")
  
  USER_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
  
  if [ -n "$USER_ID" ]; then
    echo "Created: ${email} (${role})"
  elif echo "$RESPONSE" | grep -q "already registered"; then
    echo "Exists: ${email}"
  else
    echo "Failed: ${email}"
    echo "$RESPONSE"
  fi
}

echo "Creating users..."

create_user "admin@pjatk.dev" "admin123" "admin" "Admin User"
create_user "dev@pjatk.dev" "dev123" "tech" "Developer User"
create_user "user@pjatk.dev" "user123" "user" "Regular User"
create_user "student@pjatk.dev" "student123" "student" "Student User"
create_user "staff@pjatk.dev" "staff123" "staff" "Staff User"

echo "Done"
