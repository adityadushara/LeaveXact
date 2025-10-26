#!/bin/bash
set -e

echo "🚀 Starting build process..."

# Upgrade pip and install build tools
echo "📦 Upgrading pip and installing build tools..."
pip install --upgrade pip setuptools wheel

# Install dependencies with preference for binary packages
echo "📥 Installing dependencies..."
pip install --prefer-binary --no-cache-dir -r requirements.txt

# Create data directory if it doesn't exist
echo "📁 Creating data directory..."
mkdir -p data

# Run database migrations (if using Alembic)
# echo "🗄️  Running database migrations..."
# alembic upgrade head

# Seed initial data (optional)
# echo "🌱 Seeding initial data..."
# python scripts/seed_starter_data.py

echo "✅ Build completed successfully!"
