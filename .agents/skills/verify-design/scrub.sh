#!/usr/bin/env bash
# Delete exactly the auth rows the test login created (since the baseline) and
# reset the admin's last_login. Business tables are never touched by the drive.
set -euo pipefail

BASE=/tmp/verify-design
[ -f "$BASE/baseline.env" ] || { echo "✗ no baseline.env - run capture-baseline.sh first" >&2; exit 1; }
# shellcheck disable=SC1091
source "$BASE/baseline.env"
EMAIL="${EMAIL:-admin@codexng.com}"

UID_SQL="(select id from vs_users_user where email=:'email')"

psql -d "$DB" -v ON_ERROR_STOP=1 -v email="$EMAIL" -v last_login="${LAST_LOGIN:-}" <<SQL
BEGIN;
DELETE FROM vs_audit_auditevent
  WHERE actor_user_id=$UID_SQL AND action_type='LOGIN_SUCCESS' AND event_at >= '$MARKER';
DELETE FROM vs_user_authattempt
  WHERE id > ${AUTHATTEMPT_MAX} AND email_entered=:'email';
DELETE FROM vs_user_loginsession
  WHERE id > ${LOGINSESSION_MAX} AND user_id=$UID_SQL;
UPDATE vs_users_user
  SET last_login=NULLIF(:'last_login', '')::timestamptz
  WHERE id=$UID_SQL;
COMMIT;
SQL

echo "✓ scrubbed the test account's new login rows and restored its prior last_login"
