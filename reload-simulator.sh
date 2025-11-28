#!/bin/bash

# Reload iOS Simulator App
echo "Reloading iOS Simulator..."

# Send reload command to simulator (Cmd+R)
osascript -e 'tell application "Simulator" to activate'
sleep 1
osascript -e 'tell application "System Events" to keystroke "r" using command down'

echo "App reload triggered!"


