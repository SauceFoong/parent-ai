#!/bin/bash

# Parent AI - Start Script
# This script starts both backend and mobile app

echo "🚀 Starting Parent AI..."
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB not running. Starting..."
    brew services start mongodb-community
    sleep 2
fi
echo "✅ MongoDB is running"
echo ""

# Start backend in background
echo "🔧 Starting backend server..."
cd "$(dirname "$0")"
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend running on http://localhost:3000"
else
    echo "❌ Backend failed to start"
    exit 1
fi
echo ""

# Instructions for mobile app
echo "📱 To start the mobile app:"
echo ""
echo "   cd mobile"
echo "   ulimit -n 65536"
echo "   npm start"
echo ""
echo "   Then press 'i' for iOS or 'a' for Android"
echo ""
echo "🎉 Backend is ready! Start the mobile app to continue."
echo ""
echo "Press Ctrl+C to stop the backend server"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping backend...'; kill $BACKEND_PID; exit" INT
wait $BACKEND_PID


