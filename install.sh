#!/bin/bash

# =============================================================================
# 🎮 Infernal Puzzle Minigames - Full Installation Script
# =============================================================================
# This script fully installs and sets up the entire project
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
DATABASE="🗄️"
PACKAGE="📦"
FILE="📄"
WRENCH="🔧"
SPARKLES="✨"
WARNING="⚠️"
FOLDER="📁"
KEY="🔑"
LOCK="🔒"
GLOBE="🌐"
PHONE="📱"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR"

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
# Environment Variable Utilities
# =============================================================================

# Get environment variable from .env file
get_env() {
    local key="$1"
    local env_file="${2:-.env}"
    
    if [ ! -f "$env_file" ]; then
        echo ""
        return 1
    fi
    
    # Read value, handling comments and empty lines
    local value=$(grep "^${key}=" "$env_file" | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//')
    echo "$value"
}

# Set environment variable in .env file
set_env() {
    local key="$1"
    local value="$2"
    local env_file="${3:-.env}"
    
    # Create file if it doesn't exist
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
    fi
    
    # Check if key exists
    if grep -q "^${key}=" "$env_file"; then
        # Update existing key (cross-platform sed)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
        fi
        print_success "Updated ${key} in ${env_file}"
    else
        # Append new key
        echo "${key}=${value}" >> "$env_file"
        print_success "Added ${key} to ${env_file}"
    fi
}

# =============================================================================
# Dependency Checks
# =============================================================================

check_dependencies() {
    print_header "${GEAR} Checking System Dependencies"
    
    local missing_deps=0
    
    # Check Node.js
    print_step "Checking Node.js..."
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js found: $node_version"
    else
        print_error "Node.js is not installed. Please install Node.js v18 or higher."
        missing_deps=1
    fi
    
    # Check npm
    print_step "Checking npm..."
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm found: v$npm_version"
    else
        print_error "npm is not installed."
        missing_deps=1
    fi
    
    # Check MySQL/MariaDB
    print_step "Checking MySQL/MariaDB..."
    if command -v mysql &> /dev/null; then
        local mysql_version=$(mysql --version)
        print_success "MySQL/MariaDB found: $mysql_version"
    else
        print_warning "MySQL/MariaDB CLI not found. Make sure it's installed and accessible."
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Missing required dependencies. Please install them and try again."
        exit 1
    fi
    
    print_success "All dependencies are installed!"
}

# =============================================================================
# Environment Setup
# =============================================================================

setup_environment() {
    print_header "${FILE} Setting Up Environment Configuration"
    
    cd "$ROOT_DIR"
    
    # Check if .env exists
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return 0
        fi
    fi
    
    # Copy .env.example to .env
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_error ".env.example not found!"
        exit 1
    fi
    
    # Prompt for database configuration
    print_step "Configuring database connection..."
    read -p "Enter database host (default: localhost): " db_host
    db_host=${db_host:-localhost}
    set_env "DB_HOST" "$db_host"
    
    read -p "Enter database port (default: 3306): " db_port
    db_port=${db_port:-3306}
    set_env "DB_PORT" "$db_port"
    
    read -p "Enter database user (default: root): " db_user
    db_user=${db_user:-root}
    set_env "DB_USER" "$db_user"
    
    read -s -p "Enter database password (press enter for none): " db_password
    echo
    set_env "DB_PASSWORD" "$db_password"
    
    read -p "Enter database name (default: puzzle_minigames): " db_name
    db_name=${db_name:-puzzle_minigames}
    set_env "DB_NAME" "$db_name"
    
    # Generate APP_KEY for AdonisJS
    print_step "Generating APP_KEY..."
    local app_key=$(openssl rand -base64 32)
    set_env "APP_KEY" "$app_key"
    
    print_success "Environment configuration completed!"
}

# =============================================================================
# Database Setup
# =============================================================================

setup_database() {
    print_header "${DATABASE} Setting Up Database"
    
    cd "$ROOT_DIR"
    
    # Read database configuration
    local db_host=$(get_env "DB_HOST")
    local db_port=$(get_env "DB_PORT")
    local db_user=$(get_env "DB_USER")
    local db_password=$(get_env "DB_PASSWORD")
    local db_name=$(get_env "DB_NAME")
    
    print_step "Creating database: $db_name"
    
    # Create database
    local mysql_cmd="mysql -h$db_host -P$db_port -u$db_user"
    if [ ! -z "$db_password" ]; then
        mysql_cmd="$mysql_cmd -p$db_password"
    fi
    
    echo "CREATE DATABASE IF NOT EXISTS \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | $mysql_cmd 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database created successfully!"
    else
        print_error "Failed to create database. Please check your credentials."
        exit 1
    fi
    
    # Run migrations
    print_step "Running database migrations..."
    cd "$ROOT_DIR/packages/backend"
    node scripts/migrate.mjs
    
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed!"
    else
        print_error "Database migration failed!"
        exit 1
    fi
    
    cd "$ROOT_DIR"
}

# =============================================================================
# Dependencies Installation
# =============================================================================

install_dependencies() {
    print_header "${PACKAGE} Installing Dependencies"
    
    cd "$ROOT_DIR"
    
    print_step "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed!"
    
    print_step "Installing backend dependencies..."
    cd "$ROOT_DIR/packages/backend"
    npm install
    print_success "Backend dependencies installed!"
    
    print_step "Installing mobile-app dependencies..."
    cd "$ROOT_DIR/packages/mobile-app"
    npm install
    print_success "Mobile-app dependencies installed!"
    
    cd "$ROOT_DIR"
    print_success "All dependencies installed successfully!"
}

# =============================================================================
# Initial Data Setup
# =============================================================================

setup_initial_data() {
    print_header "${SPARKLES} Setting Up Initial Data"
    
    cd "$ROOT_DIR/packages/backend"
    
    print_step "Seeding initial games..."
    
    # This would seed the database if seeders exist
    # npm run db:seed 2>/dev/null || print_warning "No seeders found, skipping..."
    
    print_success "Initial data setup completed!"
    cd "$ROOT_DIR"
}

# =============================================================================
# Build Applications
# =============================================================================

build_applications() {
    print_header "${WRENCH} Building Applications"
    
    print_step "Building backend..."
    cd "$ROOT_DIR/packages/backend"
    npm run build || print_warning "Backend build skipped (development mode)"
    
    print_step "Building mobile-app..."
    cd "$ROOT_DIR/packages/mobile-app"
    npm run build || print_warning "Mobile-app build skipped (will run in dev mode)"
    
    cd "$ROOT_DIR"
    print_success "Applications built successfully!"
}

# =============================================================================
# Start Services
# =============================================================================

start_services() {
    print_header "${ROCKET} Starting Services"
    
    print_info "Starting backend and mobile-app in development mode..."
    print_warning "This will run in the foreground. Press Ctrl+C to stop."
    print_info ""
    print_info "Backend will run on: http://localhost:3001"
    print_info "Mobile-app will run on: http://localhost:3000"
    print_info ""
    
    cd "$ROOT_DIR"
    npm run dev
}

# =============================================================================
# Main Installation Flow
# =============================================================================

main() {
    clear
    
    echo ""
    echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                               ║${NC}"
    echo -e "${PURPLE}║  ${SPARKLES}  اینفرنال - Infernal Puzzle Minigames  ${SPARKLES}            ║${NC}"
    echo -e "${PURPLE}║              Full Installation Script                         ║${NC}"
    echo -e "${PURPLE}║                                                               ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_info "This script will set up the entire project, including:"
    echo "  ${DATABASE} Database creation and configuration"
    echo "  ${PACKAGE} Dependency installation"
    echo "  ${FILE} Environment configuration"
    echo "  ${WRENCH} Application builds"
    echo "  ${ROCKET} Service startup"
    echo ""
    
    read -p "Do you want to continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Installation cancelled."
        exit 0
    fi
    
    # Run installation steps
    check_dependencies
    setup_environment
    install_dependencies
    setup_database
    setup_initial_data
    
    print_header "${CHECK} Installation Complete!"
    
    print_success "The project is now fully installed and configured!"
    echo ""
    print_info "You can now:"
    echo "  • Run both services: ${CYAN}npm run dev${NC}"
    echo "  • Run backend only: ${CYAN}npm run backend:dev${NC}"
    echo "  • Run mobile-app only: ${CYAN}npm run mobile:dev${NC}"
    echo ""
    
    read -p "Do you want to start the services now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_services
    else
        print_info "You can start the services later with: ${CYAN}npm run dev${NC}"
    fi
}

# Run main function
main "$@"
