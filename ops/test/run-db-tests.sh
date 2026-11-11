#!/usr/bin/env bash
# Runs the ops migration + assertions against a throwaway local Postgres database.
# Usage: ops/test/run-db-tests.sh   (needs a local Postgres superuser via `psql`)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$here/../.."
db="ops_tracker_test_$$"
PSQL=${PSQL:-psql}
export PGOPTIONS="-c client_min_messages=warning"
$PSQL -q -v ON_ERROR_STOP=1 -d postgres -c "create database $db"
trap '$PSQL -q -d postgres -c "drop database if exists $db" >/dev/null' EXIT
run() { $PSQL -q -X -v ON_ERROR_STOP=1 -d "$db" -f "$1"; }
run "$here/supabase_shim.sql"
run "$root/supabase_schema.sql"          # existing app schema (profiles etc.), unchanged
run "$root/ops/supabase/001_ops_tracker.sql"
run "$here/grants.sql"
$PSQL -q -X -v ON_ERROR_STOP=1 -d "$db" -o /dev/null -f "$here/db_test.sql"
echo "ALL DB TESTS PASSED"
