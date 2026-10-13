#!/usr/bin/env bash
# Delete the auth rows the test login created (since the baseline) that may be
# deleted - login sessions and auth attempts - and reset the admin's last_login.
# Audit events are append-only and stay; the count left behind is reported.
# Business tables are never touched by the drive.
set -euo pipefail

BASE=/tmp/verify-design
[ -f "$BASE/baseline.env" ] || { echo "✗ no baseline.env - run capture-baseline.sh first" >&2; exit 1; }
# shellcheck disable=SC1091
source "$BASE/baseline.env"
EMAIL="${EMAIL:-admin@codexng.com}"

UID_SQL="(select id from vs_users_user where email='$EMAIL')"

# vs_audit_auditevent is append-only (BEFORE DELETE and BEFORE UPDATE triggers
# refuse both), so the LOGIN_SUCCESS rows the drive wrote cannot be removed.
# Count them and report them instead of failing the whole scrub.
LEFT=$(psql -d "$DB" -tAc "SELECT count(*) FROM vs_audit_auditevent WHERE actor_user_id=$UID_SQL AND action_type='LOGIN_SUCCESS' AND event_at >= '$MARKER'" | tr -d '[:space:]')

psql -d "$DB" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
DELETE FROM vs_user_authattempt WHERE id > ${AUTHATTEMPT_MAX};
DELETE FROM vs_user_loginsession WHERE id > ${LOGINSESSION_MAX};
UPDATE vs_users_user SET last_login=NULL WHERE id=$UID_SQL;
COMMIT;
SQL

echo "✓ scrubbed test-login rows (loginsession>$LOGINSESSION_MAX, authattempt>$AUTHATTEMPT_MAX) and reset last_login"
echo "  left in place (audit log is append-only): ${LEFT:-0} LOGIN_SUCCESS audit row(s) since $MARKER"
