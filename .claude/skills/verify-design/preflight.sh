#!/usr/bin/env bash
# Verify the seeded admin can log in and at least one ledger entity exists.
set -euo pipefail

BACKEND="${BACKEND:-http://localhost:8000/v1}"
EMAIL="${EMAIL:-admin@codexng.com}"
PASSWORD="${PASSWORD:-Admin@123456}"

TOKEN=$(curl -s --max-time 8 -X POST "$BACKEND/user/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c "import sys,json
try:
    print(json.load(sys.stdin)['data']['access'])
except Exception:
    pass")

if [ -z "${TOKEN:-}" ]; then
  echo "✗ Login failed for $EMAIL — is the DB seeded? (run backend's ./reseed-dev.sh)" >&2
  exit 1
fi
echo "✓ Login OK as $EMAIL"

curl -s --max-time 8 "$BACKEND/finance/entities/" \
  -H "Authorization: Bearer $TOKEN" -H "accept: application/json" \
  | python3 -c "import sys,json
d=json.load(sys.stdin); rows=d.get('data',[])
rows=rows if isinstance(rows,list) else []
print(f'  entities: {len(rows)}')
for r in rows[:10]: print('   -', r.get('code'),'·',r.get('name'),'·',r.get('base_currency'))
if not rows: print('  ⚠ no entities — create one via Finance → Setup & Entity, or data screens will be empty')"
