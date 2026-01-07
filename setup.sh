#!/bin/bash
set -e

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Run build verification
echo "Verifying build..."
pnpm run build
