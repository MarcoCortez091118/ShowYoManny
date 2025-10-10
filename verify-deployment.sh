#!/bin/bash

# 🔍 ShowYo Deployment Verification Script
# Session: ODBxZz666G5PaT7K:58362183:3202205

echo "════════════════════════════════════════════════"
echo "🔍 ShowYo Deployment Verification"
echo "════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Check Build Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking Build Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "dist" ]; then
    check_pass "dist/ folder exists"

    if [ -f "dist/index.html" ]; then
        check_pass "dist/index.html found"
    else
        check_fail "dist/index.html NOT FOUND"
        echo "   Run: npm run build"
    fi

    if [ -d "dist/assets" ]; then
        check_pass "dist/assets/ folder exists"

        JS_COUNT=$(find dist/assets -name "*.js" | wc -l)
        CSS_COUNT=$(find dist/assets -name "*.css" | wc -l)

        if [ $JS_COUNT -gt 0 ]; then
            check_pass "Found $JS_COUNT JavaScript file(s)"
        else
            check_fail "No JavaScript files found"
        fi

        if [ $CSS_COUNT -gt 0 ]; then
            check_pass "Found $CSS_COUNT CSS file(s)"
        else
            check_fail "No CSS files found"
        fi
    else
        check_fail "dist/assets/ NOT FOUND"
    fi
else
    check_fail "dist/ folder NOT FOUND"
    echo "   Run: npm run build"
    exit 1
fi

echo ""

# 2. Check Firebase Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Checking Firebase Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "firebase.json" ]; then
    check_pass "firebase.json exists"

    if grep -q '"hosting"' firebase.json; then
        check_pass "Hosting configuration found"

        if grep -q '"public": "dist"' firebase.json; then
            check_pass "Public folder set to 'dist'"
        else
            check_warn "Public folder might not be set to 'dist'"
        fi

        if grep -q '"rewrites"' firebase.json; then
            check_pass "SPA rewrites configured"
        else
            check_warn "SPA rewrites not found"
        fi
    else
        check_fail "Hosting configuration NOT FOUND in firebase.json"
        echo "   Add hosting configuration"
        exit 1
    fi
else
    check_fail "firebase.json NOT FOUND"
    exit 1
fi

if [ -f ".firebaserc" ]; then
    check_pass ".firebaserc exists"

    if grep -q "showyo-20c51" .firebaserc; then
        check_pass "Project ID: showyo-20c51"
    else
        check_warn "Project ID might not be correct"
    fi
else
    check_fail ".firebaserc NOT FOUND"
fi

echo ""

# 3. Check Environment Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Checking Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    check_pass ".env file exists"

    if grep -q "VITE_SUPABASE_URL" .env; then
        check_pass "VITE_SUPABASE_URL defined"
    else
        check_fail "VITE_SUPABASE_URL NOT FOUND"
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        check_pass "VITE_SUPABASE_ANON_KEY defined"
    else
        check_fail "VITE_SUPABASE_ANON_KEY NOT FOUND"
    fi

    if grep -q "VITE_FIREBASE_PROJECT_ID" .env; then
        check_pass "VITE_FIREBASE_PROJECT_ID defined"
    else
        check_warn "VITE_FIREBASE_PROJECT_ID not found"
    fi
else
    check_fail ".env file NOT FOUND"
fi

echo ""

# 4. Check Package.json
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Checking Package Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
    check_pass "package.json exists"

    if grep -q '"build".*"vite build"' package.json; then
        check_pass "Build script configured"
    else
        check_warn "Build script might not be configured"
    fi

    if grep -q '"react"' package.json; then
        check_pass "React dependency found"
    fi

    if grep -q '"@supabase/supabase-js"' package.json; then
        check_pass "Supabase client found"
    fi
else
    check_fail "package.json NOT FOUND"
fi

echo ""

# 5. Check File Sizes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Checking Bundle Sizes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "dist/assets" ]; then
    for file in dist/assets/*.js; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            filename=$(basename "$file")

            # Get size in KB for comparison
            size_kb=$(du -k "$file" | cut -f1)

            if [ $size_kb -gt 500 ]; then
                check_warn "Large JS bundle: $filename ($size)"
                echo "      Consider code splitting"
            else
                check_info "JS bundle: $filename ($size)"
            fi
        fi
    done

    for file in dist/assets/*.css; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            filename=$(basename "$file")
            check_info "CSS bundle: $filename ($size)"
        fi
    done
fi

echo ""

# 6. Deployment Readiness
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Deployment Readiness"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Firebase CLI is installed
if command -v firebase &> /dev/null; then
    check_pass "Firebase CLI installed"

    FIREBASE_VERSION=$(firebase --version 2>/dev/null)
    check_info "Version: $FIREBASE_VERSION"
else
    check_fail "Firebase CLI NOT INSTALLED"
    echo "   Install: npm install -g firebase-tools"
fi

# Check if logged in to Firebase
if command -v firebase &> /dev/null; then
    if firebase projects:list &> /dev/null; then
        check_pass "Logged in to Firebase"
    else
        check_warn "Not logged in to Firebase"
        echo "   Run: firebase login"
    fi
fi

echo ""

# 7. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "dist" ] && [ -f "dist/index.html" ] && [ -f "firebase.json" ]; then
    echo -e "${GREEN}✓ Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. firebase deploy --only hosting"
    echo "  2. Wait 2-5 minutes"
    echo "  3. Open https://showyo-20c51.web.app"
    echo ""
else
    echo -e "${RED}✗ Not ready for deployment${NC}"
    echo ""
    echo "Fix the errors above and try again."
    echo ""
fi

echo "════════════════════════════════════════════════"
echo "For detailed instructions, see:"
echo "  📄 DEPLOY_INSTRUCTIONS.md"
echo "  📄 DEPLOYMENT_DEBUG.md"
echo "════════════════════════════════════════════════"
