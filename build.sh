#!/bin/bash

# =============================================================================
# 🚀 Production Build & Deployment Package Script
# =============================================================================
# This script builds the project and creates a compressed deployment package
# =============================================================================

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji helpers
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
GEAR="⚙️"
PACKAGE="📦"
FILE="📄"
WRENCH="🔧"
SPARKLES="✨"
WARNING="⚠️"
FOLDER="📁"
FIRE="🔥"
LOCK="🔒"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR"
BUILD_DIR="$ROOT_DIR/dist-deploy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_PACKAGE="puzzle-minigames-${TIMESTAMP}.tar.gz"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}${ROCKET} $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${SPARKLES} $1${NC}"
}

# =============================================================================
# Environment Validation
# =============================================================================

validate_environment() {
    print_header "${LOCK} Validating Build Environment"
    
    local errors=0
    
    # Check if .env exists
    if [ ! -f "$ROOT_DIR/.env" ]; then
        print_error ".env file not found! Please create it from .env.example"
        errors=$((errors + 1))
    else
        print_success ".env file found"
        
        # Validate required environment variables
        print_step "Validating required environment variables..."
        
        local required_vars=(
            "NODE_ENV"
            "PORT"
            "APP_KEY"
            "HOST"
            "DB_HOST"
            "DB_PORT"
            "DB_USER"
            "DB_NAME"
            "VITE_API_BASE_URL"
            "VITE_SOCKET_URL"
        )
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^${var}=" "$ROOT_DIR/.env"; then
                print_error "Missing required variable: ${var}"
                errors=$((errors + 1))
            else
                local value=$(grep "^${var}=" "$ROOT_DIR/.env" | cut -d '=' -f2-)
                if [ -z "$value" ] || [ "$value" = "your_32_character_app_key_here" ]; then
                    print_error "Variable ${var} is not configured properly"
                    errors=$((errors + 1))
                else
                    print_success "${var} is configured"
                fi
            fi
        done
    fi
    
    # Check NODE_ENV is set to production
    if [ -f "$ROOT_DIR/.env" ]; then
        local node_env=$(grep "^NODE_ENV=" "$ROOT_DIR/.env" | cut -d '=' -f2-)
        if [ "$node_env" != "production" ]; then
            print_warning "NODE_ENV is not set to 'production' (current: $node_env)"
            print_warning "It's recommended to set NODE_ENV=production for deployment builds"
        fi
    fi
    
    # Check Node.js version
    print_step "Checking Node.js version..."
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        local node_major=$(echo "$node_version" | cut -d'.' -f1 | sed 's/v//')
        if [ "$node_major" -ge 18 ]; then
            print_success "Node.js version: $node_version"
        else
            print_error "Node.js version must be 18 or higher (found: $node_version)"
            errors=$((errors + 1))
        fi
    else
        print_error "Node.js is not installed"
        errors=$((errors + 1))
    fi
    
    # Check npm
    print_step "Checking npm..."
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm version: $npm_version"
    else
        print_error "npm is not installed"
        errors=$((errors + 1))
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Environment validation failed with $errors error(s)"
        exit 1
    fi
    
    print_success "Environment validation passed!"
}

# =============================================================================
# Clean Previous Builds
# =============================================================================

clean_build() {
    print_header "${FIRE} Cleaning Previous Builds"
    
    print_step "Removing old build directories..."
    
    # Clean backend build
    if [ -d "$ROOT_DIR/packages/backend/build" ]; then
        rm -rf "$ROOT_DIR/packages/backend/build"
        print_success "Cleaned backend/build"
    fi
    
    # Clean mobile-app build
    if [ -d "$ROOT_DIR/packages/mobile-app/.output" ]; then
        rm -rf "$ROOT_DIR/packages/mobile-app/.output"
        print_success "Cleaned mobile-app/.output"
    fi
    
    if [ -d "$ROOT_DIR/packages/mobile-app/.nuxt" ]; then
        rm -rf "$ROOT_DIR/packages/mobile-app/.nuxt"
        print_success "Cleaned mobile-app/.nuxt"
    fi
    
    # Clean deployment directory
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_success "Cleaned dist-deploy"
    fi
    
    # Clean old deployment packages
    local old_packages=$(find "$ROOT_DIR" -maxdepth 1 -name "puzzle-minigames-*.tar.gz" -type f | wc -l)
    if [ $old_packages -gt 0 ]; then
        print_step "Found $old_packages old deployment package(s)"
        read -p "Do you want to remove old packages? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            find "$ROOT_DIR" -maxdepth 1 -name "puzzle-minigames-*.tar.gz" -type f -delete
            print_success "Removed old deployment packages"
        fi
    fi
    
    print_success "Build directories cleaned!"
}

# =============================================================================
# Install Dependencies
# =============================================================================

install_dependencies() {
    print_header "${PACKAGE} Installing Dependencies"
    
    cd "$ROOT_DIR"
    
    print_step "Installing root dependencies..."
    npm install --production=false
    
    print_step "Installing backend dependencies..."
    cd "$ROOT_DIR/packages/backend"
    npm install --production=false
    
    print_step "Installing mobile-app dependencies..."
    cd "$ROOT_DIR/packages/mobile-app"
    npm install --production=false
    
    cd "$ROOT_DIR"
    print_success "All dependencies installed!"
}

# =============================================================================
# Build Projects
# =============================================================================

build_projects() {
    print_header "${WRENCH} Building Projects"
    
    # Build backend
    print_step "Building backend..."
    cd "$ROOT_DIR/packages/backend"
    npm run build
    
    if [ ! -d "$ROOT_DIR/packages/backend/build" ]; then
        print_error "Backend build failed - build directory not created"
        exit 1
    fi
    print_success "Backend built successfully!"
    
    # Build mobile-app (generate static files)
    print_step "Building mobile-app (static generation)..."
    cd "$ROOT_DIR/packages/mobile-app"
    npm run generate
    
    if [ ! -d "$ROOT_DIR/packages/mobile-app/.output" ]; then
        print_error "Mobile-app build failed - .output directory not created"
        exit 1
    fi
    print_success "Mobile-app built successfully!"
    
    cd "$ROOT_DIR"
}

# =============================================================================
# Create Deployment Package
# =============================================================================

create_deployment_package() {
    print_header "${PACKAGE} Creating Deployment Package"
    
    print_step "Creating deployment directory structure..."
    mkdir -p "$BUILD_DIR"
    
    # Copy backend build
    print_step "Packaging backend..."
    mkdir -p "$BUILD_DIR/backend"
    cp -r "$ROOT_DIR/packages/backend/build"/* "$BUILD_DIR/backend/"
    
    # Copy backend package.json and other necessary files
    cp "$ROOT_DIR/packages/backend/package.json" "$BUILD_DIR/backend/"
    cp "$ROOT_DIR/packages/backend/package-lock.json" "$BUILD_DIR/backend/" 2>/dev/null || true
    
    # Copy database migrations
    mkdir -p "$BUILD_DIR/backend/database/migrations"
    cp -r "$ROOT_DIR/packages/backend/database/migrations"/* "$BUILD_DIR/backend/database/migrations/" 2>/dev/null || true
    cp "$ROOT_DIR/packages/backend/database/schema.sql" "$BUILD_DIR/backend/database/" 2>/dev/null || true
    
    # Copy backend scripts
    mkdir -p "$BUILD_DIR/backend/scripts"
    cp "$ROOT_DIR/packages/backend/scripts"/*.mjs "$BUILD_DIR/backend/scripts/" 2>/dev/null || true
    
    print_success "Backend packaged"
    
    # Copy mobile-app build
    print_step "Packaging mobile-app..."
    mkdir -p "$BUILD_DIR/mobile-app"
    cp -r "$ROOT_DIR/packages/mobile-app/.output"/* "$BUILD_DIR/mobile-app/"
    print_success "Mobile-app packaged"
    
    # Copy root files
    print_step "Copying root files..."
    cp "$ROOT_DIR/package.json" "$BUILD_DIR/"
    cp "$ROOT_DIR/.env.example" "$BUILD_DIR/"
    cp "$ROOT_DIR/README.md" "$BUILD_DIR/" 2>/dev/null || true
    cp "$ROOT_DIR/INSTALLATION.md" "$BUILD_DIR/" 2>/dev/null || true
    cp "$ROOT_DIR/QUICKSTART.md" "$BUILD_DIR/" 2>/dev/null || true
    
    # Copy install script
    cp "$ROOT_DIR/install.sh" "$BUILD_DIR/" 2>/dev/null || true
    chmod +x "$BUILD_DIR/install.sh" 2>/dev/null || true
    
    print_success "Root files copied"
    
    # Create deployment instructions
    print_step "Creating deployment instructions..."
    cat > "$BUILD_DIR/DEPLOY.md" << 'EOF'
# Deployment Instructions

## Quick Deployment

1. Extract the deployment package:
   ```bash
   tar -xzf puzzle-minigames-TIMESTAMP.tar.gz
   cd puzzle-minigames-TIMESTAMP
   ```

2. Create and configure .env file:
   ```bash
   cp .env.example .env
   # Edit .env with your production settings
   nano .env
   ```

3. Install production dependencies:
   ```bash
   cd backend
   npm install --production
   cd ..
   ```

4. Set up the database:
   ```bash
   cd backend
   node scripts/migrate.mjs
   cd ..
   ```

5. Start the backend:
   ```bash
   cd backend
   npm start
   ```

6. Serve the mobile-app with a web server (nginx, Apache, etc.)
   - Point web server document root to: `mobile-app/public`
   - Or use the generated static files in `mobile-app/`

## Environment Variables

Make sure to configure these required variables in .env:
- NODE_ENV=production
- PORT=3001
- APP_KEY=<generate-secure-key>
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- VITE_API_BASE_URL, VITE_SOCKET_URL

## Production Recommendations

1. Use a process manager (PM2, systemd) for the backend
2. Use nginx or Apache to serve the frontend
3. Enable SSL/TLS certificates
4. Set up database backups
5. Configure firewall rules
6. Monitor logs and performance

## Security

- Never commit .env files
- Use strong APP_KEY (32+ characters)
- Use strong database passwords
- Keep dependencies updated
- Regular security audits

For more information, see INSTALLATION.md and README.md
EOF
    
    print_success "Deployment instructions created"
    
    # Compress the deployment package
    print_step "Compressing deployment package (highest compression)..."
    cd "$ROOT_DIR"
    
    # Use tar with maximum gzip compression (level 9)
    # -c: create archive
    # -z: compress with gzip
    # -f: output file
    # -v: verbose (optional, shows files being added)
    # --best or -9: maximum compression level
    GZIP=-9 tar -czf "$DEPLOY_PACKAGE" -C "$BUILD_DIR" .
    
    if [ ! -f "$DEPLOY_PACKAGE" ]; then
        print_error "Failed to create deployment package"
        exit 1
    fi
    
    local package_size=$(du -h "$DEPLOY_PACKAGE" | cut -f1)
    local uncompressed_size=$(du -sh "$BUILD_DIR" | cut -f1)
    
    print_success "Deployment package created!"
    print_info "Package: $DEPLOY_PACKAGE"
    print_info "Compressed size: $package_size"
    print_info "Uncompressed size: $uncompressed_size"
    
    # Calculate compression ratio
    local compressed_bytes=$(stat -f%z "$DEPLOY_PACKAGE" 2>/dev/null || stat -c%s "$DEPLOY_PACKAGE")
    local uncompressed_bytes=$(du -sb "$BUILD_DIR" | cut -f1)
    local ratio=$(echo "scale=1; (1 - $compressed_bytes / $uncompressed_bytes) * 100" | bc 2>/dev/null || echo "N/A")
    if [ "$ratio" != "N/A" ]; then
        print_info "Compression ratio: ${ratio}%"
    fi
}

# =============================================================================
# Generate Checksums
# =============================================================================

generate_checksums() {
    print_header "${LOCK} Generating Checksums"
    
    cd "$ROOT_DIR"
    
    print_step "Generating SHA256 checksum..."
    if command -v sha256sum &> /dev/null; then
        sha256sum "$DEPLOY_PACKAGE" > "${DEPLOY_PACKAGE}.sha256"
        print_success "SHA256: $(cat ${DEPLOY_PACKAGE}.sha256 | cut -d' ' -f1)"
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$DEPLOY_PACKAGE" > "${DEPLOY_PACKAGE}.sha256"
        print_success "SHA256: $(cat ${DEPLOY_PACKAGE}.sha256 | cut -d' ' -f1)"
    else
        print_warning "sha256sum not available, skipping checksum"
    fi
    
    print_step "Generating MD5 checksum..."
    if command -v md5sum &> /dev/null; then
        md5sum "$DEPLOY_PACKAGE" > "${DEPLOY_PACKAGE}.md5"
        print_success "MD5: $(cat ${DEPLOY_PACKAGE}.md5 | cut -d' ' -f1)"
    elif command -v md5 &> /dev/null; then
        md5 "$DEPLOY_PACKAGE" > "${DEPLOY_PACKAGE}.md5"
        print_success "MD5: $(cat ${DEPLOY_PACKAGE}.md5 | awk '{print $NF}')"
    else
        print_warning "md5sum not available, skipping checksum"
    fi
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup_temp() {
    print_header "${FIRE} Cleaning Temporary Files"
    
    print_step "Removing temporary deployment directory..."
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_success "Temporary files cleaned"
    fi
}

# =============================================================================
# Main Build Flow
# =============================================================================

main() {
    clear
    
    echo ""
    echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                               ║${NC}"
    echo -e "${PURPLE}║  ${SPARKLES}  اینفرنال - Production Build & Deploy  ${SPARKLES}            ║${NC}"
    echo -e "${PURPLE}║                                                               ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_info "This script will:"
    echo "  ${GEAR} Validate environment configuration"
    echo "  ${FIRE} Clean previous builds"
    echo "  ${PACKAGE} Install dependencies"
    echo "  ${WRENCH} Build backend and frontend"
    echo "  ${PACKAGE} Create deployment package with highest compression"
    echo "  ${LOCK} Generate checksums"
    echo ""
    
    read -p "Do you want to continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Build cancelled."
        exit 0
    fi
    
    # Run build steps
    validate_environment
    clean_build
    install_dependencies
    build_projects
    create_deployment_package
    generate_checksums
    cleanup_temp
    
    print_header "${CHECK} Build Complete!"
    
    echo ""
    print_success "Deployment package ready!"
    print_info "Package: ${GREEN}$DEPLOY_PACKAGE${NC}"
    print_info ""
    print_info "To deploy:"
    echo "  1. Upload $DEPLOY_PACKAGE to your server"
    echo "  2. Extract: tar -xzf $DEPLOY_PACKAGE"
    echo "  3. Follow instructions in DEPLOY.md"
    echo ""
    print_info "Checksums:"
    if [ -f "${DEPLOY_PACKAGE}.sha256" ]; then
        echo "  SHA256: $(cat ${DEPLOY_PACKAGE}.sha256 | cut -d' ' -f1)"
    fi
    if [ -f "${DEPLOY_PACKAGE}.md5" ]; then
        echo "  MD5: $(cat ${DEPLOY_PACKAGE}.md5 | cut -d' ' -f1 | awk '{print $NF}')"
    fi
    echo ""
}

# Run main function
main "$@"
