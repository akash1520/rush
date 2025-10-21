#!/bin/bash

# AI Site Builder - Development Environment Stop Script
# This script stops all running development servers

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/odoo/rush"
LOG_DIR="${PROJECT_ROOT}/.dev-logs"
PID_FILE="${LOG_DIR}/dev.pid"

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "Stopping development servers..."

if [ ! -f "${PID_FILE}" ]; then
    print_error "No PID file found. Servers may not be running."
    print_info "Looking for processes manually..."

    # Try to find and kill uvicorn and next dev processes
    pkill -f "uvicorn app.main:app" && print_success "Stopped API server" || print_info "No API server found"
    pkill -f "next dev" && print_success "Stopped web server" || print_info "No web server found"

    exit 0
fi

# Read PIDs and kill processes
while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_info "Stopping process $pid"
        kill "$pid" 2>/dev/null || true

        # Wait and force kill if necessary
        sleep 2
        if kill -0 "$pid" 2>/dev/null; then
            print_info "Force stopping process $pid"
            kill -9 "$pid" 2>/dev/null || true
        fi
        print_success "Process $pid stopped"
    else
        print_info "Process $pid not running"
    fi
done < "${PID_FILE}"

# Remove PID file
rm -f "${PID_FILE}"

print_success "All development servers stopped"

