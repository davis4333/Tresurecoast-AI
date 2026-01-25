#!/bin/bash
# CODEX Deployment Readiness Checker
# Validates that all prerequisites are met for deployment
# Usage: ./scripts/deployment-readiness.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  DEPLOYMENT READINESS CHECK: ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((CHECKS_WARNING++))
}

# 1. Git Status
echo -e "${BLUE}1. Git Repository Status${NC}"
if git diff --quiet && git diff --cached --quiet; then
    check_pass "Working directory is clean"
else
    check_warn "Uncommitted changes detected"
fi

CURRENT_BRANCH=$(git branch --show-current)
echo -e "   Current branch: ${YELLOW}${CURRENT_BRANCH}${NC}"
echo ""

# 2. Quality Gates
echo -e "${BLUE}2. Quality Gates${NC}"

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    check_pass "Dependencies installed"
else
    check_fail "Dependencies not installed (run: pnpm install)"
fi

# Check TypeScript
if pnpm typecheck > /dev/null 2>&1; then
    check_pass "TypeScript compilation passes"
else
    check_fail "TypeScript errors detected"
fi

# Check Linting
if pnpm lint > /dev/null 2>&1; then
    check_pass "ESLint passes"
else
    check_fail "Linting errors detected"
fi

# Check Tests
if pnpm test > /dev/null 2>&1; then
    check_pass "Unit tests pass"
else
    check_fail "Unit tests failing"
fi

echo ""

# 3. Environment Variables
echo -e "${BLUE}3. Environment Configuration${NC}"

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "NEXT_PUBLIC_APP_URL"
)

OPTIONAL_VARS=(
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "RESEND_API_KEY"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
)

# Check if .env file exists
if [ -f ".env" ] || [ -f ".env.local" ]; then
    check_pass "Environment file exists"

    # Load env file
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi
    if [ -f ".env.local" ]; then
        set -a
        source .env.local
        set +a
    fi

    # Check required vars
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -n "${!var}" ]; then
            check_pass "Required: $var is set"
        else
            check_fail "Required: $var is missing"
        fi
    done

    # Check optional vars
    for var in "${OPTIONAL_VARS[@]}"; do
        if [ -n "${!var}" ]; then
            check_pass "Optional: $var is set"
        else
            check_warn "Optional: $var is missing"
        fi
    done
else
    check_fail "No .env or .env.local file found"
fi

echo ""

# 4. Database
echo -e "${BLUE}4. Database${NC}"

if [ -n "$DATABASE_URL" ]; then
    # Try to connect
    if pg_isready -d "$DATABASE_URL" > /dev/null 2>&1; then
        check_pass "Database is reachable"

        # Check migrations
        if pnpm prisma migrate status > /dev/null 2>&1; then
            check_pass "Database migrations are up to date"
        else
            check_warn "Database migrations may need to be applied"
        fi
    else
        check_fail "Cannot connect to database"
    fi
else
    check_fail "DATABASE_URL not set"
fi

echo ""

# 5. Build Verification
echo -e "${BLUE}5. Build Verification${NC}"

if [ -d ".next" ]; then
    check_pass "Production build exists"

    # Check build age
    BUILD_AGE=$(find .next -type f -name "*.js" -mmin +60 | wc -l)
    if [ $BUILD_AGE -gt 0 ]; then
        check_warn "Build is older than 1 hour - consider rebuilding"
    else
        check_pass "Build is recent"
    fi
else
    check_warn "No production build found (run: pnpm build)"
fi

echo ""

# 6. External Services
echo -e "${BLUE}6. External Services${NC}"

# Clerk
if [ -n "$CLERK_SECRET_KEY" ]; then
    if [[ "$CLERK_SECRET_KEY" == sk_test_* ]]; then
        if [ "$ENVIRONMENT" == "production" ]; then
            check_fail "Using Clerk TEST key in PRODUCTION"
        else
            check_pass "Clerk configured (test mode)"
        fi
    elif [[ "$CLERK_SECRET_KEY" == sk_live_* ]]; then
        check_pass "Clerk configured (live mode)"
    fi
fi

# Stripe
if [ -n "$STRIPE_SECRET_KEY" ]; then
    if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
        if [ "$ENVIRONMENT" == "production" ]; then
            check_warn "Using Stripe TEST key in PRODUCTION"
        else
            check_pass "Stripe configured (test mode)"
        fi
    elif [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
        check_pass "Stripe configured (live mode)"
    fi
fi

# OpenAI
if [ -n "$OPENAI_API_KEY" ]; then
    check_pass "OpenAI configured"
else
    check_warn "OpenAI not configured (AI features disabled)"
fi

# Upstash Redis
if [ -n "$UPSTASH_REDIS_REST_URL" ] && [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
    check_pass "Upstash Redis configured (rate limiting enabled)"
else
    check_warn "Upstash Redis not configured (rate limiting will fail-open)"
fi

echo ""

# 7. Security Checks
echo -e "${BLUE}7. Security${NC}"

# Check for .env in git
if git ls-files --error-unmatch .env > /dev/null 2>&1; then
    check_fail "CRITICAL: .env file is tracked in git"
else
    check_pass ".env is not tracked in git"
fi

# Check for hardcoded secrets
SECRET_PATTERNS=("sk_live_" "sk_test_" "pk_live_" "pk_test_" "whsec_" "re_")
FOUND_SECRETS=0

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r "$pattern" src/ > /dev/null 2>&1; then
        check_fail "CRITICAL: Potential secret found in source code: $pattern"
        ((FOUND_SECRETS++))
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    check_pass "No hardcoded secrets detected in source code"
fi

echo ""

# Final Report
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Passed:   ${CHECKS_PASSED}${NC}"
echo -e "${YELLOW}⚠️  Warnings: ${CHECKS_WARNING}${NC}"
echo -e "${RED}❌ Failed:   ${CHECKS_FAILED}${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ READY FOR DEPLOYMENT${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ $CHECKS_WARNING -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Note: There are ${CHECKS_WARNING} warnings. Review them before deploying.${NC}"
    fi

    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ NOT READY FOR DEPLOYMENT${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}Fix the failed checks before deploying.${NC}"
    exit 1
fi
