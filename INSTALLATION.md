# Installation Guide

## Prerequisites

Before you can run this app, you need to install the following:

### 1. Install Node.js

**Option A: Using Homebrew (Recommended)**
```bash
brew install node
```

**Option B: Download from Official Website**
1. Visit https://nodejs.org/
2. Download the LTS version for macOS
3. Run the installer

**Option C: Using nvm (Node Version Manager)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install --lts
nvm use --lts
```

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Xcode (for iOS development)

1. Open the App Store
2. Search for "Xcode"
3. Install Xcode (this may take a while, it's a large download)
4. Open Xcode and accept the license agreement
5. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```

### 3. Install CocoaPods (for iOS dependencies)

```bash
sudo gem install cocoapods
```

## Project Setup

### Step 1: Install Dependencies

```bash
cd TimelineApp
npm install
```

### Step 2: Initialize iOS Project (if needed)

If you don't have an `ios` folder, you'll need to initialize the React Native project:

**Option A: Use React Native CLI**
```bash
npx react-native init TimelineApp --skip-install
# Then copy your src/ folder and App.js into the new project
```

**Option B: Use Expo (Easier for beginners)**
```bash
npx create-expo-app@latest TimelineApp
# Then install dependencies and copy your code
```

### Step 3: Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### Step 4: Run the App

```bash
npm run ios
```

This will:
1. Start the Metro bundler
2. Build the iOS app
3. Launch it in the iOS Simulator

## Troubleshooting

### Metro Bundler Issues
If you encounter cache issues:
```bash
npm start -- --reset-cache
```

### iOS Build Issues
If you have problems with CocoaPods:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Node Modules Issues
If dependencies are corrupted:
```bash
rm -rf node_modules
npm install
```

### Permission Issues
If you get permission errors with CocoaPods:
```bash
sudo gem install cocoapods
```

## Next Steps After Installation

1. Open the project in Xcode (optional, for advanced debugging):
   ```bash
   open ios/TimelineApp.xcworkspace
   ```

2. Start developing! The app will hot-reload when you make changes.

3. Check the README.md for usage instructions.

