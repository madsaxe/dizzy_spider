#!/bin/bash

# React Native Timeline App - Initialization Script
# This script helps set up the React Native project structure

echo "🚀 Timeline App - Project Initialization"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js first:"
    echo "  - Visit https://nodejs.org/ or"
    echo "  - Run: brew install node"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Check if React Native CLI is needed
if [ ! -d "ios" ] && [ ! -d "android" ]; then
    echo "📱 React Native project structure not found."
    echo "Initializing React Native project..."
    echo ""
    
    # Option 1: Use React Native CLI
    echo "Option 1: Using React Native CLI (Recommended for full native features)"
    read -p "Do you want to initialize with React Native CLI? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing React Native CLI..."
        npm install -g react-native-cli
        
        echo "Creating React Native project structure..."
        # Note: This will create a new project, user will need to merge files
        echo "⚠️  Note: You may need to merge the generated files with your existing code"
        echo "Run: npx react-native init TimelineAppTemp"
        echo "Then copy ios/ and android/ folders to this directory"
    fi
    
    # Option 2: Use Expo
    echo ""
    echo "Option 2: Using Expo (Easier setup, good for beginners)"
    read -p "Do you want to use Expo instead? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Expo CLI..."
        npm install -g expo-cli
        
        echo "⚠️  Note: Expo projects have a different structure"
        echo "You may need to adapt the code for Expo"
    fi
else
    echo "✅ React Native project structure found"
fi

echo ""
echo "📦 Installing npm dependencies..."
npm install

if [ -d "ios" ]; then
    echo ""
    echo "🍎 Setting up iOS dependencies..."
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo "⚠️  CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi
    
    echo "Installing CocoaPods dependencies..."
    cd ios
    pod install
    cd ..
    echo "✅ iOS setup complete"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run ios' to start the app"
echo "2. Or open ios/TimelineApp.xcworkspace in Xcode"
echo ""

