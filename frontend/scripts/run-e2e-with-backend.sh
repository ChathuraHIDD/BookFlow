#!/usr/bin/env bash

set -u

MODE="${1:-all}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$ROOT_DIR/../backend" && pwd)"
BACKEND_URL="${E2E_BASE_URL:-http://localhost:8080}"
HEALTH_URL="$BACKEND_URL/api/health"
BACKEND_LOG="$ROOT_DIR/.e2e-backend.log"

if [[ -f "$ROOT_DIR/.env.e2e" ]]; then
  echo "Loading environment variables from .env.e2e ..."
  export $(grep -v '^#' "$ROOT_DIR/.env.e2e" | xargs)
fi

SPEC_PATH=""

case "$MODE" in
  all)
    SPEC_PATH=""
    ;;
  member1)
    SPEC_PATH="tests/e2e/member1.facilities-resources.spec.js"
    ;;
  member2)
    SPEC_PATH="tests/e2e/member2.booking-workflow.spec.js"
    ;;
  member3)
    SPEC_PATH="tests/e2e/member3.support-tickets.spec.js"
    ;;
  member4)
    SPEC_PATH="tests/e2e/member4.notifications-roles-oauth.spec.js"
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Use one of: all | member1 | member2 | member3 | member4"
    exit 1
    ;;
esac

BACKEND_PID=""

cleanup() {
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}====================================================${NC}"
echo -e "${CYAN}${BOLD}   🚀 BookFlow E2E Member Testing Suite             ${NC}"
echo -e "${CYAN}${BOLD}====================================================${NC}"

echo -e "${BLUE}📍 Starting backend from $BACKEND_DIR ...${NC}"
(
  cd "$BACKEND_DIR" || exit 1
  ./mvnw spring-boot:run > "$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

echo -en "${YELLOW}⌛ Waiting for backend health at $HEALTH_URL ...${NC}"
READY=0
for i in {1..120}; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    READY=1
    echo -e " ${GREEN}✅ Ready!${NC}"
    break
  fi
  echo -n "."
  sleep 1
done

if [[ "$READY" -ne 1 ]]; then
  echo -e "\n${RED}❌ Backend did not become ready in time.${NC}"
  echo -e "${YELLOW}Last backend logs:${NC}"
  tail -n 20 "$BACKEND_LOG" || true
  exit 1
fi

echo -e "${BLUE}🔍 Running Playwright tests for: ${BOLD}$MODE${NC}\n"
cd "$ROOT_DIR" || exit 1

TEST_EXIT_CODE=0
if [[ -n "$SPEC_PATH" ]]; then
  npx playwright test "$SPEC_PATH" "${@:2}" || TEST_EXIT_CODE=$?
else
  npx playwright test "${@:2}" || TEST_EXIT_CODE=$?
fi

echo -e "\n${CYAN}${BOLD}====================================================${NC}"
echo -e "${CYAN}${BOLD}   📊 Test Execution Summary                        ${NC}"
echo -e "${CYAN}${BOLD}====================================================${NC}"

if [[ "$TEST_EXIT_CODE" -eq 0 ]]; then
  echo -e "${GREEN}✨ ALL TESTS PASSED SUCCESSFULLY!${NC}"
else
  echo -e "${RED}⚠️  SOME TESTS FAILED. CHECK THE REPORT BELOW.${NC}"
fi

echo -e "\n${BLUE}🖥️  Opening Playwright HTML report...${NC}"
echo -e "${YELLOW}(Press Ctrl+C to stop the report viewer and backend)${NC}"

npx playwright show-report

exit "$TEST_EXIT_CODE"
