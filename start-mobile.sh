#!/bin/bash

# Parent AI Mobile App Starter
# This script fixes the file limit issue and starts Expo

echo "📱 Starting Parent AI Mobile App..."
echo ""

# Increase file limit
ulimit -n 65536
echo "✅ File limit increased"

# Navigate to mobile directory
cd "$(dirname "$0")/mobile"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting Expo..."
echo ""
echo "📱 Instructions:"
echo "1. Install 'Expo Go' app on your phone (App Store/Play Store)"
echo "2. Make sure your phone is on the same WiFi as this computer"
echo "3. Open Expo Go and scan the QR code that will appear"
echo ""
echo "⏳ Starting Metro bundler..."
echo ""

# Start Expo with increased watchers
WATCHMAN_MAX_FILES=65536 npx expo start --clear



