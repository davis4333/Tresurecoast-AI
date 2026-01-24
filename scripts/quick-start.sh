#!/bin/bash
# CODEX Quick Start Script
# Sets up development environment for new developers
# Usage: ./scripts/quick-start.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  TREASURE COAST AI - QUICK START${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Check Node.js
echo -e "${BLUE}[1/8] Checking Node.js...${NC}"
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} detected${NC}"

    # Check if version is 18 or higher
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}❌ Node.js 18+ required. Current: ${NODE_VERSION}${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo ""

# Step 2: Check pnpm
echo -e "${BLUE}[2/8] Checking pnpm...${NC}"
if command -v pnpm > /dev/null 2>&1; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✅ pnpm ${PNPM_VERSION} detected${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}✅ pnpm installed${NC}"
fi
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}[3/8] Installing dependencies...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Check environment file
echo -e "${BLUE}[4/8] Checking environment configuration...${NC}"
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from example...${NC}"

    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
    else
        # Create basic .env
        cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/treasurecoast"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
CLERK_SECRET_KEY="sk_test_your_key_here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:5000"

# Optional: OpenAI
OPENAI_API_KEY="sk-your_openai_key_here"

# Optional: Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_key_here"

# Optional: Resend
RESEND_API_KEY="re_your_resend_key_here"

# Optional: Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token_here"

# Optional: Development bypass (NEVER use in production)
DEV_BYPASS_AUTH="false"
EOF
        echo -e "${GREEN}✅ Created basic .env template${NC}"
    fi

    echo -e "${YELLOW}📝 Please edit .env and add your actual API keys${NC}"
else
    echo -e "${GREEN}✅ Environment file exists${NC}"
fi
echo ""

# Step 5: Check database
echo -e "${BLUE}[5/8] Checking database connection...${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"

    # Try to run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    if pnpm prisma migrate deploy 2>/dev/null; then
        echo -e "${GREEN}✅ Database migrations applied${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not apply migrations. Check DATABASE_URL in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not detected${NC}"
    echo -e "${YELLOW}   You have two options:${NC}"
    echo -e "${YELLOW}   1. Install PostgreSQL locally${NC}"
    echo -e "${YELLOW}   2. Use a managed service (Neon, Supabase, Railway)${NC}"
    echo -e "${YELLOW}   Update DATABASE_URL in .env once ready${NC}"
fi
echo ""

# Step 6: Generate Prisma Client
echo -e "${BLUE}[6/8] Generating Prisma Client...${NC}"
pnpm prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 7: Run preflight checks
echo -e "${BLUE}[7/8] Running preflight checks...${NC}"
if pnpm preflight 2>/dev/null; then
    echo -e "${GREEN}✅ Preflight checks passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some environment variables may need configuration${NC}"
    echo -e "${YELLOW}   Check .env and update with your actual API keys${NC}"
fi
echo ""

# Step 8: Verify installation
echo -e "${BLUE}[8/8] Verifying installation...${NC}"

# TypeScript
if pnpm typecheck > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript errors detected${NC}"
fi

# Lint
if pnpm lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting issues detected${NC}"
fi

# Tests
if pnpm test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests may need database connection${NC}"
fi

echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SETUP COMPLETE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "  1. Configure your .env file with actual API keys"
echo -e "     ${YELLOW}nano .env${NC}"
echo ""
echo -e "  2. Start the development server:"
echo -e "     ${YELLOW}pnpm dev${NC}"
echo ""
echo -e "  3. Open your browser:"
echo -e "     ${YELLOW}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}Helpful commands:${NC}"
echo ""
echo -e "  ${YELLOW}pnpm dev${NC}              - Start development server"
echo -e "  ${YELLOW}pnpm build${NC}            - Build for production"
echo -e "  ${YELLOW}pnpm test${NC}             - Run unit tests"
echo -e "  ${YELLOW}pnpm test:e2e${NC}         - Run E2E tests"
echo -e "  ${YELLOW}pnpm typecheck${NC}        - Check TypeScript"
echo -e "  ${YELLOW}pnpm lint${NC}             - Check linting"
echo -e "  ${YELLOW}pnpm preflight${NC}        - Validate environment"
echo ""
echo -e "${BLUE}Helper scripts:${NC}"
echo ""
echo -e "  ${YELLOW}./scripts/verify-gates.sh${NC}           - Run all quality gates"
echo -e "  ${YELLOW}./scripts/deployment-readiness.sh${NC}   - Check deployment readiness"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo ""
echo -e "  📚 Platform Status:  ${YELLOW}CODEX_PLATFORM_STATUS_REPORT.md${NC}"
echo -e "  📊 Quality Gates:    ${YELLOW}CODEX_GATE_SCORECARD.md${NC}"
echo -e "  ✅ Todo & Gaps:      ${YELLOW}CODEX_TODO_GAPS.md${NC}"
echo -e "  🔒 Security Audit:   ${YELLOW}CODEX_SECURITY_AUDIT.md${NC}"
echo -e "  🚀 Deployment:       ${YELLOW}CODEX_DEPLOYMENT_PLAYBOOK.md${NC}"
echo ""
