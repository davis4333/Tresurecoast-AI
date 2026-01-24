#!/bin/bash
# CODEX Quality Gate Verification Script
# Runs all quality gates in sequence and reports results
# Usage: ./scripts/verify-gates.sh [--skip-build]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
GATES_PASSED=0
GATES_FAILED=0
GATES_SKIPPED=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  TREASURE COAST AI - QUALITY GATE VERIFICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to run a gate
run_gate() {
    local gate_name=$1
    local gate_cmd=$2
    local gate_letter=$3

    echo -e "${BLUE}━━━ GATE ${gate_letter}: ${gate_name}${NC}"
    echo -e "${YELLOW}Running: ${gate_cmd}${NC}"
    echo ""

    if eval "$gate_cmd"; then
        echo -e "${GREEN}✅ GATE ${gate_letter} PASSED${NC}"
        echo ""
        ((GATES_PASSED++))
        return 0
    else
        echo -e "${RED}❌ GATE ${gate_letter} FAILED${NC}"
        echo ""
        ((GATES_FAILED++))
        return 1
    fi
}

# Function to skip a gate
skip_gate() {
    local gate_name=$1
    local reason=$2
    local gate_letter=$3

    echo -e "${BLUE}━━━ GATE ${gate_letter}: ${gate_name}${NC}"
    echo -e "${YELLOW}⏭️  SKIPPED: ${reason}${NC}"
    echo ""
    ((GATES_SKIPPED++))
}

# GATE A: Install
run_gate "INSTALL" "pnpm install --frozen-lockfile" "A" || exit 1

# GATE B: Preflight
run_gate "PREFLIGHT" "pnpm preflight" "B" || exit 1

# GATE C: TypeScript
run_gate "TYPESCRIPT" "pnpm typecheck" "C" || exit 1

# GATE D: Lint
run_gate "LINT" "pnpm lint" "D" || exit 1

# GATE E: Tests
run_gate "TESTS" "pnpm test" "E" || exit 1

# GATE F: Build (can be skipped with --skip-build)
if [[ "$1" == "--skip-build" ]]; then
    skip_gate "BUILD" "Skipped via --skip-build flag" "F"
else
    run_gate "BUILD" "SKIP_ENV_VALIDATION=true pnpm build" "F" || exit 1
fi

# GATE G: Database Tests (conditional)
echo -e "${BLUE}━━━ GATE G: DATABASE TESTS${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}PostgreSQL detected, running DB tests...${NC}"
    run_gate "DB_TESTS" "RUN_DB_TESTS=true pnpm test" "G" || exit 1
else
    skip_gate "DB_TESTS" "PostgreSQL not available (expected in CI)" "G"
fi

# GATE H: E2E Tests (conditional)
echo -e "${BLUE}━━━ GATE H: E2E TESTS${NC}"
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Dev server detected, running E2E tests...${NC}"
    run_gate "E2E_SMOKE" "pnpm test:e2e:smoke" "H" || exit 1
else
    skip_gate "E2E_TESTS" "Dev server not running (expected in local dev)" "H"
fi

# Final report
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  FINAL REPORT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Gates Passed:  ${GATES_PASSED}${NC}"
echo -e "${YELLOW}⏭️  Gates Skipped: ${GATES_SKIPPED}${NC}"
echo -e "${RED}❌ Gates Failed:  ${GATES_FAILED}${NC}"
echo ""

if [ $GATES_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ ALL QUALITY GATES PASSED${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ QUALITY GATES FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
