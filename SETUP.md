# Setup Guide

## Quick Start

This project is set up as a React Native app. To get started:

### 1. Install Dependencies

```bash
npm install
```

### 2. iOS Setup

If you're using React Native CLI (not Expo), you'll need to:

```bash
cd ios
pod install
cd ..
```

### 3. Run the App

```bash
npm run ios
```

## Project Initialization

If you're starting from an empty repository, you may need to initialize the React Native project structure. You can either:

### Option A: Use React Native CLI
```bash
npx react-native init TimelineApp
# Then copy the src/ folder and App.js from this project
```

### Option B: Use Expo (Easier for beginners)
```bash
npx create-expo-app TimelineApp
# Then install the dependencies and copy the code
```

## Dependencies

All required dependencies are listed in `package.json`. Key dependencies include:

- `@react-navigation/native` - Navigation
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-date-picker` - Date picker component
- `react-native-vector-icons` - Icons

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Node Modules Issues
```bash
rm -rf node_modules
npm install
```

## Next Steps

1. Install dependencies
2. Set up iOS development environment (Xcode)
3. Run the app on iOS simulator or device
4. Start creating timelines!

